from datetime import datetime

from mongoengine import *

from api.core import Mixin


class AdminEventNotification(Document, Mixin):
    meta = {
        "indexes": [
            {
                "fields": ["recipient_uid", "event_id", "submission_version"],
                "unique": True,
            },
            {"fields": ["recipient_uid", "read_at", "-created_at"]},
            "-created_at",
        ]
    }

    recipient_admin_id = ObjectIdField(required=True)
    recipient_uid = StringField(required=True)
    event_id = ObjectIdField(required=True)
    submission_version = IntField(required=True)
    title = StringField(required=True)
    message = StringField(required=True)
    link = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    read_at = DateTimeField(required=False)
