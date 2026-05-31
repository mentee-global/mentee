#!/usr/bin/env python3
"""Read-only health check of Hub accounts and their related data in MongoDB.

Reports, for every Hub:
  - Core fields (name, email, url, invite_key, firebase_uid, image, language)
  - Whether the email is whitelisted in verified_email with the HUB role (6)
  - Counts of hub-scoped data: members (partners), events, announcements,
    trainings, community library docs, group messages, signed docs
  - Integrity warnings (missing required fields, duplicate urls, etc.)

Also reports orphaned hub references: documents whose hub_id points at a Hub
that no longer exists.

This script only READS from the database. It never writes or deletes.

Usage:
    python scripts/review_hubs.py
    python scripts/review_hubs.py --json
    python scripts/review_hubs.py --hub "Yidan"   # filter by name/url/email substring
"""

import argparse
import json
import os
import sys
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent

HUB_ROLE = "6"  # Account.HUB
PARTNER_ROLE = "3"  # Account.PARTNER


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
    parser = argparse.ArgumentParser(description="Review Hub accounts and their data.")
    parser.add_argument(
        "--hub",
        default=None,
        help="Only show hubs whose name/url/email contains this (case-insensitive).",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON output.")
    return parser.parse_args()


def _count(coll, query) -> int:
    try:
        return coll.count_documents(query)
    except Exception:
        return 0


def _hub_id_variants(hub_oid):
    """hub_id is stored as a string of the ObjectId on related docs."""
    return [str(hub_oid)]


def review(db, name_filter=None):
    hubs_coll = db["hub"]
    verified = db["verified_email"]
    users = db["users"]

    existing = db.list_collection_names()

    def coll(name):
        return db[name] if name in existing else None

    partner_coll = coll("partner_profile")
    event_coll = coll("event")
    announce_coll = coll("announcement")
    training_coll = coll("training")
    community_coll = coll("community_library")
    group_coll = coll("group_message")
    signed_coll = coll("signed_docs")

    all_hubs = list(hubs_coll.find({}))
    hub_ids = {str(h["_id"]) for h in all_hubs}

    results = []
    for h in all_hubs:
        oid = h["_id"]
        sid = str(oid)
        name = h.get("name", "")
        url = h.get("url", "")
        email = h.get("email", "")

        if name_filter:
            blob = f"{name} {url} {email}".lower()
            if name_filter.lower() not in blob:
                continue

        warnings = []
        for field in ("name", "email", "url", "firebase_uid"):
            if not h.get(field):
                warnings.append(f"missing required field '{field}'")
        if not h.get("invite_key"):
            warnings.append("no invite_key set (invite link will not work)")
        if not h.get("image") or not (h.get("image") or {}).get("url"):
            warnings.append("no logo/image set")

        # verified_email whitelist entry (required to log in)
        ve = verified.find_one({"email": email})
        if not ve:
            warnings.append("email NOT in verified_email whitelist (cannot log in)")
        elif str(ve.get("role")) != HUB_ROLE:
            warnings.append(
                f"verified_email role is '{ve.get('role')}', expected '{HUB_ROLE}' (HUB)"
            )

        # duplicate url across hubs
        if url and sum(1 for o in all_hubs if o.get("url") == url) > 1:
            warnings.append(f"url '{url}' is shared by more than one hub")

        idv = _hub_id_variants(oid)
        members = (
            _count(partner_coll, {"hub_id": {"$in": idv}})
            if partner_coll is not None
            else 0
        )
        events = (
            _count(event_coll, {"hub_id": {"$in": idv}})
            if event_coll is not None
            else 0
        )
        announces = (
            _count(announce_coll, {"hub_id": {"$in": idv}})
            if announce_coll is not None
            else 0
        )
        trainings = (
            _count(training_coll, {"hub_id": {"$in": idv}})
            if training_coll is not None
            else 0
        )
        community = (
            _count(community_coll, {"hub_id": {"$in": idv}})
            if community_coll is not None
            else 0
        )
        # group_message.hub_user_id is a real ObjectId
        groups = (
            _count(group_coll, {"hub_user_id": {"$in": [oid, sid]}})
            if group_coll is not None
            else 0
        )
        signed = (
            _count(signed_coll, {"hub_id": {"$in": idv}})
            if signed_coll is not None
            else 0
        )

        results.append(
            {
                "id": sid,
                "name": name,
                "url": url,
                "email": email,
                "preferred_language": h.get("preferred_language"),
                "has_firebase_uid": bool(h.get("firebase_uid")),
                "has_invite_key": bool(h.get("invite_key")),
                "has_image": bool((h.get("image") or {}).get("url")),
                "verified_email_ok": bool(ve)
                and str((ve or {}).get("role")) == HUB_ROLE,
                "has_users_doc": users.find_one({"email": email}) is not None,
                "counts": {
                    "members_partners": members,
                    "events": events,
                    "announcements": announces,
                    "trainings": trainings,
                    "community_library": community,
                    "group_messages": groups,
                    "signed_docs": signed,
                },
                "warnings": warnings,
            }
        )

    # Orphaned hub references across hub-scoped collections.
    orphans = {}
    for label, c, field in (
        ("partner_profile", partner_coll, "hub_id"),
        ("event", event_coll, "hub_id"),
        ("announcement", announce_coll, "hub_id"),
        ("training", training_coll, "hub_id"),
        ("community_library", community_coll, "hub_id"),
        ("signed_docs", signed_coll, "hub_id"),
    ):
        if c is None:
            continue
        bad = set()
        for doc in c.find({field: {"$nin": [None, ""]}}, {field: 1}):
            val = doc.get(field)
            if val and str(val) not in hub_ids:
                bad.add(str(val))
        if bad:
            orphans[label] = sorted(bad)

    return {"total_hubs": len(all_hubs), "hubs": results, "orphans": orphans}


def _print_human(report):
    print(f"\n{'=' * 70}")
    print(f"HUB REVIEW — {report['total_hubs']} hub(s) total")
    print(f"{'=' * 70}")
    for h in report["hubs"]:
        print(f"\n● {h['name'] or '(no name)'}   [{h['id']}]")
        print(f"    email : {h['email']}")
        print(f"    url   : /{h['url']}")
        print(
            f"    login : firebase_uid={'yes' if h['has_firebase_uid'] else 'NO'}"
            f"  verified_email={'ok' if h['verified_email_ok'] else 'MISSING/WRONG'}"
            f"  users_doc={'yes' if h['has_users_doc'] else 'no'}"
        )
        print(
            f"    invite: {'set' if h['has_invite_key'] else 'NOT SET'}"
            f"   logo: {'set' if h['has_image'] else 'none'}"
            f"   lang: {h['preferred_language']}"
        )
        c = h["counts"]
        print(
            f"    data  : members={c['members_partners']} events={c['events']} "
            f"announcements={c['announcements']} trainings={c['trainings']} "
            f"community={c['community_library']} group_msgs={c['group_messages']} "
            f"signed_docs={c['signed_docs']}"
        )
        if h["warnings"]:
            for w in h["warnings"]:
                print(f"    ⚠  {w}")
        else:
            print(f"    ✓  no warnings")

    if report["orphans"]:
        print(f"\n{'-' * 70}")
        print("ORPHANED hub_id REFERENCES (point to a hub that does not exist):")
        for label, ids in report["orphans"].items():
            print(f"    {label}: {', '.join(ids)}")
    else:
        print(f"\nNo orphaned hub references found.")
    print()


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
        report = review(client[db_name], name_filter=args.hub)
    finally:
        client.close()

    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        _print_human(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
