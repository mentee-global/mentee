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
from typing import Any, Dict, Optional

from bson import ObjectId
from pymongo import MongoClient

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DEFAULT_MODEL = "gpt-4o-mini"

# Mirrors MODERATION_SYSTEM_PROMPT in api/utils/message_flagging.py (duplicated
# because this one-off script runs standalone, with no app import).
MODERATION_SYSTEM_PROMPT = (
    "You review messages on Mentee Global, a mentorship platform that connects "
    "immigrant and refugee youth (mentees) with volunteer mentors. Most messages "
    "are normal conversation and must NOT be flagged. Flag a message, in any "
    "language, only when it clearly and genuinely violates platform safety or "
    "misuses the platform. Violations are: harassment, hate, threats, violence, "
    "sexual content, self-harm encouragement, exploitation, or abusive language; "
    "financial solicitation, meaning actually asking the other person to give, "
    "send, lend, or pay money, or sending payment details to receive money; "
    "scams and fraud, such as phishing, fake offers, or requests for sensitive "
    "personal or financial information (passwords, bank or card details, "
    "identity documents); advertising, selling, or recruiting (including "
    "multi-level marketing and job or investment pitches); explicit romantic or "
    "sexual advances; and sharing or requesting personal contact details (phone "
    "number, WhatsApp, email, social handles) or pushing to move the "
    "conversation off the platform. "
    "Do NOT flag normal conversation or mentorship logistics. Greetings, small "
    "talk, thanks, and arranging to meet -- proposing or asking to meet, "
    "scheduling or asking about a call or session, and asking when or where to "
    "meet -- are legitimate and must not be flagged. Suggesting a meeting is not "
    "a contact-detail or off-platform violation. Discussing careers, education, "
    "jobs, budgeting, finances, scholarships, or immigration as guidance is "
    "normal; only flag an actual request for money or other clear misuse, not a "
    "mere mention of these topics. When a message is short, ambiguous, or only "
    "mentions a sensitive topic without a clear violation, do NOT flag it. "
    "Prioritize English, Spanish, Portuguese, Arabic, Persian, and Dari, but "
    "review messages written in any language. In the categories field, use short "
    "snake_case labels such as harassment, hate, sexual_content, threats, "
    "self_harm, exploitation, scam, financial_solicitation, spam_advertising, "
    "off_topic, romantic_advance, or contact_info_request. Set severity by how "
    "harmful the content is. Return concise JSON only."
)

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


def _is_reasoning_model(model: str) -> bool:
    return (model or "").lower().startswith(("gpt-5", "o1", "o3", "o4"))


def _classify(client, model: str, text: str) -> Dict[str, Any]:
    request = dict(
        model=model,
        input=[
            {
                "role": "system",
                "content": MODERATION_SYSTEM_PROMPT,
            },
            {"role": "user", "content": f"Message: {text}"},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "message_flag_result",
                "schema": _openai_schema(),
                "strict": True,
            }
        },
        max_output_tokens=600,
    )
    # Reasoning models (gpt-5*, o-series) need minimal reasoning so the JSON isn't
    # crowded out; non-reasoning models (gpt-4o-mini) reject the parameter.
    if _is_reasoning_model(model):
        request["reasoning"] = {"effort": "minimal"}
    response = client.responses.create(**request)
    return json.loads(getattr(response, "output_text", "") or "{}")


def _ai_flag_result(ai_result: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "flagged": bool(ai_result.get("flagged")),
        "severity": ai_result.get("severity") or "low",
        "categories": list(ai_result.get("categories") or []),
        "reason": ai_result.get("reason") or "Potentially inappropriate message.",
        "language": ai_result.get("language"),
        "confidence": ai_result.get("confidence"),
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
                    result = _ai_flag_result(ai_result)
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
