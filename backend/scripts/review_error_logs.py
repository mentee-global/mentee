#!/usr/bin/env python3
"""Summarize recent frontend/backend ErrorLog records from MongoDB.

Usage:
    python scripts/review_error_logs.py --days 14 --limit 25
    python scripts/review_error_logs.py --source backend --json
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

from pymongo import MongoClient

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent


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
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


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


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Review outstanding application errors in MongoDB."
    )
    parser.add_argument("--days", type=int, default=14, help="Lookback window.")
    parser.add_argument(
        "--source",
        choices=["all", "backend", "frontend"],
        default="all",
        help="Filter by source.",
    )
    parser.add_argument("--limit", type=int, default=20, help="Max groups to print.")
    parser.add_argument(
        "--examples",
        type=int,
        default=3,
        help="Recent examples per group in JSON output.",
    )
    parser.add_argument(
        "--unnotified",
        action="store_true",
        help="Only include logs that have not triggered an email notification.",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON output.")
    return parser.parse_args()


def _safe_text(value, limit=220):
    text = "" if value is None else str(value)
    return text if len(text) <= limit else text[: limit - 3] + "..."


def _json_default(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def main() -> int:
    args = _parse_args()
    _load_env()
    mongo_uri, db_name = _mongo_uri()

    since = datetime.utcnow() - timedelta(days=args.days)
    query = {"timestamp": {"$gte": since}}
    if args.source != "all":
        query["source"] = args.source
    if args.unnotified:
        query["notified"] = {"$ne": True}

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
    try:
        collection = client[db_name]["error_logs"]
        collection.database.command("ping")

        docs = list(collection.find(query).sort("timestamp", -1))
    finally:
        client.close()

    groups = {}
    examples = defaultdict(list)
    by_day = Counter()
    by_source = Counter()

    for doc in docs:
        timestamp = doc.get("timestamp")
        if isinstance(timestamp, datetime):
            by_day[timestamp.date().isoformat()] += 1
        by_source[doc.get("source") or "unknown"] += 1

        key = (
            doc.get("source") or "",
            doc.get("exception_type") or "",
            doc.get("endpoint") or "",
            doc.get("exception_message") or "",
        )
        group = groups.setdefault(
            key,
            {
                "source": key[0],
                "exception_type": key[1],
                "endpoint": key[2],
                "message": key[3],
                "count": 0,
                "notified_count": 0,
                "first_seen": timestamp,
                "last_seen": timestamp,
                "user_agents": Counter(),
                "ips": Counter(),
            },
        )
        group["count"] += 1
        group["notified_count"] += 1 if doc.get("notified") else 0
        if timestamp and (
            group["first_seen"] is None or timestamp < group["first_seen"]
        ):
            group["first_seen"] = timestamp
        if timestamp and (group["last_seen"] is None or timestamp > group["last_seen"]):
            group["last_seen"] = timestamp
        if doc.get("user_agent"):
            group["user_agents"][doc["user_agent"]] += 1
        if doc.get("ip"):
            group["ips"][doc["ip"]] += 1
        if len(examples[key]) < args.examples:
            examples[key].append(
                {
                    "id": str(doc.get("_id")),
                    "timestamp": timestamp,
                    "user_email": doc.get("user_email"),
                    "ip": doc.get("ip"),
                    "traceback": _safe_text(doc.get("traceback"), 600),
                    "request_payload": _safe_text(doc.get("request_payload"), 600),
                }
            )

    rows = sorted(groups.values(), key=lambda item: item["count"], reverse=True)[
        : args.limit
    ]
    for row in rows:
        key = (
            row["source"],
            row["exception_type"],
            row["endpoint"],
            row["message"],
        )
        row["top_user_agents"] = row.pop("user_agents").most_common(3)
        row["top_ips"] = row.pop("ips").most_common(3)
        row["examples"] = examples[key]
        row["message"] = _safe_text(row["message"], 500)

    output = {
        "generated_at": datetime.utcnow(),
        "lookback_days": args.days,
        "source": args.source,
        "total_logs": len(docs),
        "by_source": dict(by_source),
        "by_day": dict(sorted(by_day.items())),
        "groups": rows,
    }

    if args.json:
        print(json.dumps(output, indent=2, default=_json_default))
        return 0

    print(
        f"Error logs since {since.isoformat(timespec='seconds')} UTC: "
        f"{len(docs)} total"
    )
    print(f"By source: {dict(by_source)}")
    print("")
    for index, row in enumerate(rows, start=1):
        first_seen = row["first_seen"].isoformat() if row["first_seen"] else ""
        last_seen = row["last_seen"].isoformat() if row["last_seen"] else ""
        print(f"{index}. {row['source']} {row['exception_type']} @ {row['endpoint']}")
        print(f"   count={row['count']} notified={row['notified_count']}")
        print(f"   first={first_seen} last={last_seen}")
        print(f"   message={_safe_text(row['message'])}")
        if row["top_ips"]:
            print(f"   top_ips={row['top_ips']}")
        print("")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"review_error_logs failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
