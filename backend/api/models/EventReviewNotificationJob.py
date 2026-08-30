from datetime import datetime

from mongoengine import *

from api.core import Mixin
from api.models.EventNotificationJob import EVENT_NOTIFICATION_JOB_STATUSES


class EventReviewNotificationJob(Document, Mixin):
    meta = {
        "indexes": [
            {"fields": ["event_id", "submission_version"], "unique": True},
            "status",
            "created_at",
        ]
    }

    event_id = ObjectIdField(required=True)
    submission_version = IntField(required=True)
    status = StringField(choices=EVENT_NOTIFICATION_JOB_STATUSES, default="queued")
    recipients = ListField(DictField(), default=list)
    sent_recipients = ListField(StringField(), default=list)
    creator = DictField(required=True)
    target_url = StringField(required=True)
    sent_count = IntField(default=0)
    failed_count = IntField(default=0)
    errors = ListField(StringField(), default=list)
    created_at = DateTimeField(default=datetime.utcnow)
    started_at = DateTimeField(required=False)
    completed_at = DateTimeField(required=False)
