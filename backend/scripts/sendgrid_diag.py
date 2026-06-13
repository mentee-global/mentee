"""Read-only SendGrid deliverability diagnostic for a single recipient.

Usage:
    uv run python scripts/sendgrid_diag.py h.i.ashqar@gmail.com

Checks the four suppression lists (bounces, blocks, spam reports, invalid
emails), the global unsubscribe list, and — if the Email Activity add-on is
enabled — the recent message events for the address. Nothing is modified.
"""

import json
import sys
import urllib.parse

import requests
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.environ.get("SENDGRID_API_KEY")
SENDER = os.environ.get("SENDER_EMAIL")
BASE = "https://api.sendgrid.com/v3"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}


def get(path):
    r = requests.get(f"{BASE}{path}", headers=HEADERS, timeout=30)
    return r.status_code, (r.json() if r.text else None)


def check_suppression(kind, email):
    # Each suppression list supports a direct GET by email; an empty list means
    # the address is NOT on that list.
    status, body = get(f"/suppression/{kind}/{urllib.parse.quote(email)}")
    on_list = bool(body) if status == 200 else None
    return status, on_list, body


def check_global_unsub(email):
    status, body = get(f"/asm/suppressions/global/{urllib.parse.quote(email)}")
    # 200 with a recipient_email payload => globally unsubscribed.
    return status, body


def check_activity(email):
    query = urllib.parse.quote(f'to_email="{email}"')
    status, body = get(f"/messages?limit=50&query={query}")
    return status, body


def main():
    email = sys.argv[1] if len(sys.argv) > 1 else "h.i.ashqar@gmail.com"
    print(f"Sender (from .env): {SENDER}")
    print(f"Recipient under investigation: {email}")
    print("=" * 70)

    print("\n## SUPPRESSION LISTS (if the address is here, SendGrid drops sends)\n")
    for kind in ["bounces", "blocks", "spam_reports", "invalid_emails"]:
        status, on_list, body = check_suppression(kind, email)
        flag = (
            "⛔ ON LIST"
            if on_list
            else ("clear" if on_list is False else f"http {status}")
        )
        print(f"- {kind:14} {flag}")
        if on_list:
            print(f"    {json.dumps(body, indent=2)}")

    print("\n## GLOBAL UNSUBSCRIBE\n")
    status, body = check_global_unsub(email)
    if status == 200 and body and body.get("recipient_email"):
        print(f"⛔ Globally unsubscribed: {json.dumps(body, indent=2)}")
    else:
        print(f"clear (http {status})")

    print("\n## EMAIL ACTIVITY (last events; needs Email Activity add-on)\n")
    status, body = check_activity(email)
    if status == 200 and body:
        msgs = body.get("messages", [])
        if not msgs:
            print("No messages found in the activity window for this address.")
        for m in msgs:
            print(
                f"- {m.get('last_event_time')}  {m.get('status'):10}  "
                f"opens={m.get('opens_count')}  clicks={m.get('clicks_count')}  "
                f"subj={m.get('subject')!r}"
            )
    elif status in (401, 403):
        print(
            f"Activity API not available on this plan (http {status}). "
            "Suppression lists above are the authoritative signal."
        )
    else:
        print(f"http {status}: {json.dumps(body, indent=2) if body else ''}")


if __name__ == "__main__":
    main()
