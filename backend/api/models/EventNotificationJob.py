from datetime import datetime

from mongoengine import *

from api.core import Mixin


EVENT_NOTIFICATION_JOB_STATUSES = (
    "staged",
    "queued",
    "processing",
    "completed",
    "completed_with_errors",
    "failed",
    "cancelled",
)


class EventNotificationJob(Document, Mixin):
    meta = {
        "indexes": [
            {"fields": ["event_id", "publication_version"], "unique": True},
            "status",
            "created_at",
        ]
    }

    event_id = ObjectIdField(required=True)
    publication_version = IntField(required=True)
    status = StringField(choices=EVENT_NOTIFICATION_JOB_STATUSES, default="queued")
    recipients = ListField(DictField(), default=list)
    sent_recipients = ListField(StringField(), default=list)
    target_url = StringField(required=True)
    sent_count = IntField(default=0)
    failed_count = IntField(default=0)
    errors = ListField(StringField(), default=list)
    created_at = DateTimeField(default=datetime.utcnow)
    started_at = DateTimeField(required=False)
    completed_at = DateTimeField(required=False)
