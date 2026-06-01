#!/usr/bin/env python3
"""Backfill admin review records for historical messages.

Dry run by default:
    python scripts/backfill_message_flags.py --limit 100

Write review records:
    python scripts/backfill_message_flags.py --apply --batch-size 50
"""

import argparse
import json
import os
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pymongo import MongoClient

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DEFAULT_MODEL = "gpt-5-nano"

COLLECTIONS = {
    "direct_message": {
        "source_type": "direct",
        "body": "body",
        "sender_id": "sender_id",
        "recipient_id": "recipient_id",
    },
    "group_message": {
        "source_type": "group",
        "body": "body",
        "title": "title",
        "sender_id": "sender_id",
        "hub_user_id": "hub_user_id",
        "parent_message_id": "parent_message_id",
    },
    "partner_group_message": {
        "source_type": "partner_group",
        "body": "body",
        "sender_id": "sender_id",
        "parent_message_id": "parent_message_id",
    },
}


def _load_env() -> None:
    for path in (BACKEND_DIR / ".env", BACKEND_DIR.parent / ".env"):
        if load_dotenv is not None:
            load_dotenv(path)
        else:
            _load_env_file(path)


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _mongo_uri() -> tuple[str, str]:
    user = os.environ.get("MONGO_USER")
    password = os.environ.get("MONGO_PASSWORD")
    db_name = os.environ.get("MONGO_DB")
    host = os.environ.get("MONGO_HOST")
    missing = [
        name
        for name, value in {
            "MONGO_USER": user,
            "MONGO_PASSWORD": password,
            "MONGO_DB": db_name,
            "MONGO_HOST": host,
        }.items()
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing Mongo environment variables: {', '.join(missing)}")
    return host % (user, password, db_name), db_name


def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create MessageFlag review records for historical messages."
    )
    parser.add_argument("--apply", action="store_true", help="Write flagged records.")
    parser.add_argument("--limit", type=int, default=None, help="Max messages to scan.")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Mongo cursor batch size.",
    )
    parser.add_argument(
        "--collection",
        choices=["all", *COLLECTIONS.keys()],
        default="all",
        help="Message collection to process.",
    )
    parser.add_argument("--since", help="Only messages created at/after this ISO date.")
    parser.add_argument(
        "--before", help="Only messages created at/before this ISO date."
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("OPENAI_MESSAGE_FLAGGING_MODEL", DEFAULT_MODEL),
        help="OpenAI model to use.",
    )
    return parser.parse_args()


def _openai_schema() -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "flagged": {"type": "boolean"},
            "severity": {"type": "string", "enum": ["low", "medium", "high"]},
            "categories": {"type": "array", "items": {"type": "string"}},
            "reason": {"type": "string"},
            "language": {"type": ["string", "null"]},
            "confidence": {"type": ["number", "null"], "minimum": 0, "maximum": 1},
        },
        "required": [
            "flagged",
            "severity",
            "categories",
            "reason",
            "language",
            "confidence",
        ],
    }


def _classify(client, model: str, text: str) -> Dict[str, Any]:
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "Review this historical platform message for admin moderation. "
                    "Flag harassment, threats, sexual content, hate, exploitation, "
                    "scams, self-harm encouragement, or abusive language. Prioritize "
                    "English, Spanish, Portuguese, Arabic, and Persian, but review "
                    "the message in any other language if it is written in a "
                    "different language. Return JSON only."
                ),
            },
            {"role": "user", "content": f"Message:\n{text}"},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "message_flag_result",
                "schema": _openai_schema(),
                "strict": True,
            }
        },
        max_output_tokens=300,
    )
    return json.loads(getattr(response, "output_text", "") or "{}")


def _term_matches(db, text: str) -> List[Dict[str, Any]]:
    normalized = text.lower()
    matches = []
    for term in db["flagged_term"].find({"enabled": {"$ne": False}}):
        needle = (term.get("term") or "").strip().lower()
        if needle and needle in normalized:
            matches.append(
                {
                    "term": term.get("term"),
                    "language": term.get("language") or "all",
                    "category": term.get("category") or "custom",
                    "severity": term.get("severity") or "medium",
                }
            )
    return matches


def _best_severity(values: List[str]) -> str:
    order = {"low": 1, "medium": 2, "high": 3}
    return max(values or ["low"], key=lambda item: order.get(item, 1))


def _combined_result(db, ai_result: Dict[str, Any], text: str) -> Dict[str, Any]:
    terms = _term_matches(db, text)
    categories = list(
        dict.fromkeys(
            list(ai_result.get("categories") or [])
            + [match.get("category") or "custom" for match in terms]
        )
    )
    reason = ai_result.get("reason") or ""
    if terms:
        reason = (
            reason
            + " Matched flagged term(s): "
            + ", ".join(match["term"] for match in terms[:5])
            + "."
        ).strip()
    return {
        "flagged": bool(ai_result.get("flagged")) or bool(terms),
        "severity": _best_severity(
            [ai_result.get("severity") or "low"]
            + [match.get("severity") or "medium" for match in terms]
        ),
        "categories": categories,
        "reason": reason or "Potentially inappropriate message.",
        "language": ai_result.get("language"),
        "confidence": ai_result.get("confidence"),
        "term_matches": terms,
        "openai_response": ai_result,
    }


def _query(args: argparse.Namespace) -> Dict[str, Any]:
    query = {}
    date_query = {}
    since = _parse_date(args.since)
    before = _parse_date(args.before)
    if since:
        date_query["$gte"] = since
    if before:
        date_query["$lte"] = before
    if date_query:
        query["created_at"] = date_query
    return query


def _flag_doc(
    collection_name: str,
    config: Dict[str, Any],
    message: Dict[str, Any],
    result: Dict[str, Any],
    model: str,
) -> Dict[str, Any]:
    now = datetime.utcnow()
    source_type = config["source_type"]
    return {
        "source_key": f"{source_type}:{message['_id']}",
        "source_type": source_type,
        "source_collection": collection_name,
        "source_message_id": message["_id"],
        "origin": "backfill",
        "status": "pending",
        "title": message.get(config.get("title", "")),
        "body": message.get(config["body"]) or "",
        "sender_id": message.get(config["sender_id"]),
        "recipient_id": message.get(config.get("recipient_id", "")),
        "hub_user_id": message.get(config.get("hub_user_id", "")),
        "parent_message_id": message.get(config.get("parent_message_id", "")),
        "message_read": bool(message.get("message_read", False)),
        "original_created_at": message.get("created_at"),
        "pending_payload": {},
        "severity": result["severity"],
        "categories": result["categories"],
        "reason": result["reason"],
        "language": result["language"],
        "confidence": result["confidence"],
        "term_matches": result["term_matches"],
        "openai_model": model,
        "openai_response": result["openai_response"],
        "created_at": now,
        "updated_at": now,
    }


def main() -> int:
    _load_env()
    args = _parse_args()
    if not os.environ.get("OPENAI_API_KEY"):
        print("error: OPENAI_API_KEY is required", file=sys.stderr)
        return 2

    try:
        from openai import OpenAI
    except ImportError:
        print("error: openai package is not installed", file=sys.stderr)
        return 2

    try:
        uri, db_name = _mongo_uri()
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    selected = (
        COLLECTIONS.items()
        if args.collection == "all"
        else [(args.collection, COLLECTIONS[args.collection])]
    )
    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    counts = Counter()

    try:
        db = client[db_name]
        db.command("ping")
        flags = db["message_flag"]
        for collection_name, config in selected:
            scanned_this_collection = 0
            cursor = (
                db[collection_name]
                .find(_query(args))
                .sort("created_at", 1)
                .batch_size(args.batch_size)
            )
            for message in cursor:
                if args.limit is not None and counts["scanned"] >= args.limit:
                    break
                scanned_this_collection += 1
                counts["scanned"] += 1
                source_key = f"{config['source_type']}:{message['_id']}"
                if flags.count_documents({"source_key": source_key}, limit=1):
                    counts["skipped_existing"] += 1
                    continue
                text = (message.get(config["body"]) or "").strip()
                if not text:
                    counts["skipped_empty"] += 1
                    continue
                try:
                    ai_result = _classify(openai_client, args.model, text)
                    result = _combined_result(db, ai_result, text)
                except Exception as exc:
                    counts["errors"] += 1
                    print(
                        f"error: {collection_name}/{message['_id']}: {exc}",
                        file=sys.stderr,
                    )
                    continue
                if not result["flagged"]:
                    counts["clean"] += 1
                    continue
                counts["flagged"] += 1
                counts[f"flagged_{result['severity']}"] += 1
                doc = _flag_doc(collection_name, config, message, result, args.model)
                if args.apply:
                    flags.update_one(
                        {"source_key": doc["source_key"]},
                        {"$setOnInsert": doc},
                        upsert=True,
                    )
                print(
                    f"{'would flag' if not args.apply else 'flagged'} "
                    f"{collection_name}/{message['_id']} severity={result['severity']} "
                    f"reason={result['reason'][:120]}"
                )
            if args.limit is not None and counts["scanned"] >= args.limit:
                break
            counts[f"scanned_{collection_name}"] += scanned_this_collection
    finally:
        client.close()

    print("\nSummary")
    for key in sorted(counts):
        print(f"{key}: {counts[key]}")
    if not args.apply:
        print("\nDry run. Re-run with --apply to write MessageFlag records.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
