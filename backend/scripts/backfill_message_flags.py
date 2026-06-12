#!/usr/bin/env python3
"""Backfill admin review records for historical messages.

Dry run by default:
    python scripts/backfill_message_flags.py --limit 100

Write review records:
    python scripts/backfill_message_flags.py --apply --batch-size 50
"""

import argparse
import os
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from pymongo import MongoClient

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

# Single source of truth for the moderation logic (prompt, model, omni+LLM call,
# rules) lives in the app module; this script only does Mongo I/O around it.
from api.utils.message_flagging import (  # noqa: E402
    DEFAULT_MESSAGE_FLAGGING_MODEL as DEFAULT_MODEL,
    moderate_message_text,
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
    parser.add_argument(
        "--concurrency",
        type=int,
        default=8,
        help="How many messages to classify in parallel.",
    )
    return parser.parse_args()


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
    result,
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
        "severity": result.severity,
        "categories": result.categories,
        "reason": result.reason,
        "language": result.language,
        "confidence": result.confidence,
        "openai_model": result.model,
        "openai_response": result.response,
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
    counts = Counter()

    try:
        db = client[db_name]
        db.command("ping")
        flags = db["message_flag"]

        # Pre-load existing flag keys once so we can skip already-reviewed
        # messages without a per-message query (and avoid re-paying OpenAI).
        existing = {d["source_key"] for d in flags.find({}, {"source_key": 1})}

        # Build the worklist: non-empty, not-yet-flagged messages to classify.
        worklist = []
        for collection_name, config in selected:
            if args.limit is not None and counts["scanned"] >= args.limit:
                break
            cursor = (
                db[collection_name]
                .find(_query(args))
                .sort("created_at", 1)
                .batch_size(args.batch_size)
            )
            for message in cursor:
                if args.limit is not None and counts["scanned"] >= args.limit:
                    break
                counts["scanned"] += 1
                counts[f"scanned_{collection_name}"] += 1
                source_key = f"{config['source_type']}:{message['_id']}"
                if source_key in existing:
                    counts["skipped_existing"] += 1
                    continue
                text = (message.get(config["body"]) or "").strip()
                if not text:
                    counts["skipped_empty"] += 1
                    continue
                worklist.append((collection_name, config, message, text))

        def _context_for(collection_name, config, message, limit=3):
            # Recent prior messages of the same direct conversation, so the model
            # judges the message in context (matches the live app + re-eval).
            if collection_name != "direct_message":
                return ""
            s = message.get(config.get("sender_id", ""))
            r = message.get(config.get("recipient_id", ""))
            before = message.get("created_at")
            if not (s and r and before):
                return ""
            q = {
                "created_at": {"$lt": before},
                "$or": [
                    {"sender_id": s, "recipient_id": r},
                    {"sender_id": r, "recipient_id": s},
                ],
            }
            prior = list(
                db["direct_message"]
                .find(q, {"body": 1, "sender_id": 1})
                .sort("created_at", -1)
                .limit(limit)
            )
            prior.reverse()
            return "\n".join(
                f"{'sender' if m.get('sender_id') == s else 'other'}: "
                f"{(m.get('body') or '')[:300]}"
                for m in prior
            )

        def _classify_item(item):
            collection_name, config, message, text = item
            ctx = _context_for(collection_name, config, message)
            return item, moderate_message_text(text, model=args.model, context=ctx)

        # Moderate in parallel (the OpenAI calls are the bottleneck). The shared
        # moderate_message_text is plain (no eventlet offload), so it's safe in a
        # thread pool. DB writes stay in the main thread as each result completes.
        with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
            futures = [pool.submit(_classify_item, item) for item in worklist]
            for future in as_completed(futures):
                try:
                    item, result = future.result()
                except Exception as exc:
                    counts["errors"] += 1
                    print(f"error: {exc}", file=sys.stderr)
                    continue
                collection_name, config, message, _text = item
                if not result.flagged:
                    counts["clean"] += 1
                    continue
                counts["flagged"] += 1
                counts[f"flagged_{result.severity}"] += 1
                doc = _flag_doc(collection_name, config, message, result)
                if args.apply:
                    flags.update_one(
                        {"source_key": doc["source_key"]},
                        {"$setOnInsert": doc},
                        upsert=True,
                    )
                print(
                    f"{'would flag' if not args.apply else 'flagged'} "
                    f"{collection_name}/{message['_id']} severity={result.severity} "
                    f"reason={result.reason[:120]}"
                )
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
