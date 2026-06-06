#!/usr/bin/env python3
"""Backfill Users.verified from Firebase email-verification status.

Historically a user's email could be verified in Firebase while Mongo's
``Users.verified`` stayed ``False`` (it was set at account creation and never
synced). The admin onboarding panel flags these as "Ready to mark verified",
and the per-row "Mark verified" action fixes one at a time. This script does the
same thing in bulk for the existing backlog.

It only ever flips ``verified`` from ``False`` to ``True`` for users whose
Firebase account reports ``email_verified``. It never clears a verified flag and
never touches Firebase, so it is safe to re-run (idempotent).

Going forward the login sync (auth.py) and profile-creation sync (main.py) keep
this aligned, so after this one-off the count should stay near zero.

Read-only by default: it reports what it WOULD change. Pass --apply to write.

Usage (from backend/, through uv):
    uv run python scripts/backfill_verified_from_firebase.py            # dry run
    uv run python scripts/backfill_verified_from_firebase.py --apply    # perform update
    uv run python scripts/backfill_verified_from_firebase.py --role mentee --apply
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from firebase_admin import auth as firebase_admin_auth

from api import create_app
from api.models import Users
from api.utils.constants import Account

FIREBASE_BATCH_SIZE = 100

ROLE_ALIASES = {
    "mentor": str(Account.MENTOR.value),
    "mentee": str(Account.MENTEE.value),
}


def _normalize_email(email):
    return (email or "").strip().lower()


def _parse_args():
    parser = argparse.ArgumentParser(
        description="Mark users verified when Firebase already verified their email."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Perform the update. Without this flag the script only reports.",
    )
    parser.add_argument(
        "--role",
        help="Limit to a single role: 'mentor', 'mentee', or the stored numeric role.",
    )
    return parser.parse_args()


def _verified_emails_in_firebase(emails):
    """Return the subset of emails whose Firebase account has a verified email."""
    verified = set()
    unique = [e for e in {_normalize_email(e) for e in emails} if e]
    for start in range(0, len(unique), FIREBASE_BATCH_SIZE):
        batch = unique[start : start + FIREBASE_BATCH_SIZE]
        identifiers = [firebase_admin_auth.EmailIdentifier(e) for e in batch]
        try:
            response = firebase_admin_auth.get_users(identifiers)
        except Exception as exc:  # noqa: BLE001 - report and continue with next batch
            print(f"  warning: Firebase lookup failed for a batch: {exc}")
            continue
        for user in response.users:
            if user.email and user.email_verified:
                verified.add(_normalize_email(user.email))
    return verified


def main():
    args = _parse_args()

    role_filter = None
    if args.role:
        role_filter = ROLE_ALIASES.get(args.role.lower(), args.role)

    app = create_app()
    with app.app_context():
        query = Users.objects(verified=False)
        if role_filter is not None:
            query = query.filter(role=role_filter)
        candidates = list(query.only("id", "email", "role", "verified"))

        if not candidates:
            print("No users with verified=False. Nothing to do.")
            return 0

        print(f"Users with verified=False: {len(candidates)}")
        verified_emails = _verified_emails_in_firebase([u.email for u in candidates])

        to_update = [
            u for u in candidates if _normalize_email(u.email) in verified_emails
        ]
        per_role = {}
        for user in to_update:
            per_role[user.role] = per_role.get(user.role, 0) + 1

        print(f"Verified in Firebase but not in the app: {len(to_update)}")
        for role, count in sorted(per_role.items()):
            print(f"  role {role}: {count}")
        for user in to_update[:20]:
            print(f"  - {user.email}  (role {user.role}, {user.id})")
        if len(to_update) > 20:
            print(f"  ... and {len(to_update) - 20} more")

        if not to_update:
            print("Nothing to update.")
            return 0

        if not args.apply:
            print("\nDry run. Re-run with --apply to set verified=True.")
            return 0

        updated = 0
        for user in to_update:
            user.verified = True
            user.save()
            updated += 1
        print(f"\nUpdated {updated} user(s) to verified=True.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
