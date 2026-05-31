#!/usr/bin/env python3
"""Backfill verified_email.role for hubs: "Account.HUB" -> "6".

Hub accounts were historically whitelisted with the enum repr ("Account.HUB")
instead of the numeric role ("6") that every other account type uses and that
the email-status check (`apply.py`) queries for. This one-off migration rewrites
those rows so the whitelist is consistent.

Read-only by default: it reports what it WOULD change. Pass --apply to write.

Usage:
    python scripts/backfill_hub_verified_email_role.py            # dry run
    python scripts/backfill_hub_verified_email_role.py --apply    # perform update
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

OLD_ROLE = "Account.HUB"
NEW_ROLE = "6"


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


def _mongo_uri() -> tuple:
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
        description="Backfill verified_email hub role to the numeric value."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Perform the update. Without this flag the script only reports.",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    _load_env()
    try:
        uri, db_name = _mongo_uri()
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    client = MongoClient(uri, serverSelectionTimeoutMS=10000)
    try:
        coll = client[db_name]["verified_email"]
        query = {"role": OLD_ROLE}
        affected = coll.count_documents(query)
        print(f"verified_email rows with role={OLD_ROLE!r}: {affected}")
        for doc in coll.find(query, {"email": 1}):
            print(f"  - {doc.get('email')}  ({doc['_id']})")

        if affected == 0:
            print("Nothing to do.")
            return 0

        if not args.apply:
            print(f"\nDry run. Re-run with --apply to set role -> {NEW_ROLE!r}.")
            return 0

        result = coll.update_many(query, {"$set": {"role": NEW_ROLE}})
        print(f"\nUpdated {result.modified_count} row(s) to role={NEW_ROLE!r}.")
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
