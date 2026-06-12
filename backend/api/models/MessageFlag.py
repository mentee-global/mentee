from datetime import datetime

from api.core import Mixin
from flask_mongoengine import Document
from mongoengine import *


MESSAGE_FLAG_SOURCE_TYPES = ("direct", "group", "partner_group")
MESSAGE_FLAG_STATUSES = ("pending", "allowed", "dismissed", "hidden", "deleted")
MESSAGE_FLAG_SEVERITIES = ("low", "medium", "high")
MESSAGE_FLAG_ORIGINS = ("live", "backfill")


class MessageFlag(Document, Mixin):
    meta = {
        # Tolerate documents that still carry fields removed from this schema
        # (e.g. the old term_matches). Without this, MongoEngine raises
        # FieldDoesNotExist when hydrating those existing flags.
        "strict": False,
        "indexes": [
            {"fields": ["source_key"], "unique": True},
            "status",
            "severity",
            "source_type",
            "origin",
            "-created_at",
            {"fields": ["status", "-created_at"]},
            {"fields": ["source_type", "source_message_id"]},
        ],
    }

    source_key = StringField(required=True)
    source_type = StringField(required=True, choices=MESSAGE_FLAG_SOURCE_TYPES)
    source_collection = StringField(required=True)
    source_message_id = ObjectIdField(required=False)
    origin = StringField(required=True, choices=MESSAGE_FLAG_ORIGINS, default="live")
    status = StringField(
        required=True, choices=MESSAGE_FLAG_STATUSES, default="pending"
    )

    title = StringField(required=False)
    body = StringField(required=True)
    sender_id = ObjectIdField(required=True)
    recipient_id = ObjectIdField(required=False)
    hub_user_id = ObjectIdField(required=False)
    parent_message_id = StringField(required=False)
    message_read = BooleanField(required=False, default=False)
    original_created_at = DateTimeField(required=False)
    pending_payload = DictField(required=False)

    severity = StringField(required=True, choices=MESSAGE_FLAG_SEVERITIES)
    categories = ListField(StringField(), default=list)
    reason = StringField(required=True)
    language = StringField(required=False)
    confidence = FloatField(required=False)
    openai_model = StringField(required=False)
    openai_response = DictField(required=False)
    moderation_error = StringField(required=False)

    reviewed_by = ObjectIdField(required=False)
    reviewed_at = DateTimeField(required=False)
    action_notes = StringField(required=False)
    warning_sent_at = DateTimeField(required=False)
    warning_sent_to = StringField(required=False)

    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    def __repr__(self):
        return f"<MessageFlag:{self.source_type} {self.status} {self.severity}>"
