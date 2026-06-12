#!/usr/bin/env python3
"""One-off cleanup: drop the obsolete `term_matches` field from message flags.

The field was removed from the MessageFlag model. `strict=False` keeps existing
documents loadable, but this strips the dead data so the field is gone for good.

Dry run by default (reports how many documents still carry the field):
    uv run python scripts/cleanup_term_matches.py

Apply the change:
    uv run python scripts/cleanup_term_matches.py --apply
"""

import argparse
import os
import sys
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
        elif path.exists():
            for raw_line in path.read_text().splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _mongo_uri():
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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually unset the field (otherwise dry run).",
    )
    args = parser.parse_args()

    _load_env()
    uri, db_name = _mongo_uri()
    db = MongoClient(uri)[db_name]
    flags = db["message_flag"]

    query = {"term_matches": {"$exists": True}}
    count = flags.count_documents(query)
    print(f"message_flag documents with term_matches: {count}")

    if not count:
        print("Nothing to clean up.")
        return 0

    if not args.apply:
        print("Dry run. Re-run with --apply to unset the field.")
        return 0

    result = flags.update_many(query, {"$unset": {"term_matches": ""}})
    print(f"Unset term_matches on {result.modified_count} documents.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
