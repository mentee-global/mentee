import argparse
import sys
from datetime import datetime
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from api import create_app
from api.models import (
    Admin,
    Event,
    Hub,
    MenteeProfile,
    MentorProfile,
    PartnerProfile,
    Support,
)
from api.utils.constants import Account


CREATOR_MODELS = (
    (Account.ADMIN.value, Admin),
    (Account.MENTOR.value, MentorProfile),
    (Account.MENTEE.value, MenteeProfile),
    (Account.PARTNER.value, PartnerProfile),
    (Account.HUB.value, Hub),
    (Account.SUPPORT.value, Support),
)


def creator_updates(user_id):
    for role, model in CREATOR_MODELS:
        profile = model.objects(id=user_id).only("firebase_uid").first()
        if profile:
            return {
                "creator_role": role,
                "created_by_uid": profile.firebase_uid,
            }
    return {}


def backfill(apply_changes=False):
    updated = 0
    with create_app().app_context():
        collection = Event._get_collection()
        for raw in collection.find({}):
            event = Event.objects(id=raw["_id"]).first()
            updates = {}
            if "status" not in raw:
                updates["status"] = "published"
            if "scope_type" not in raw:
                updates["scope_type"] = "hub" if event.hub_id else "global"
            if "scope_id" not in raw and event.hub_id:
                updates["scope_id"] = str(event.hub_id)
            if "created_at" not in raw:
                updates["created_at"] = event.date_submitted or datetime.utcnow()
            if "updated_at" not in raw:
                updates["updated_at"] = event.date_submitted or datetime.utcnow()
            if "published_at" not in raw:
                updates["published_at"] = event.date_submitted or datetime.utcnow()
            if "created_by_uid" not in raw or "creator_role" not in raw:
                updates.update(creator_updates(event.user_id))
            if updates:
                updated += 1
                print(f"{event.id}: {updates}")
                if apply_changes:
                    event.update(
                        **{f"set__{key}": value for key, value in updates.items()}
                    )
    print(f"{'Updated' if apply_changes else 'Would update'} {updated} events")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    backfill(apply_changes=args.apply)
