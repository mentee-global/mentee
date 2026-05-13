from api.core import Mixin
from .base import db
from mongoengine import *
from flask_mongoengine import Document
from datetime import datetime


class ErrorLog(Document, Mixin):
    """Captured unhandled errors from backend and frontend."""

    timestamp = DateTimeField(required=True, default=datetime.utcnow)
    severity = StringField(choices=["error", "warning"], default="error")
    source = StringField(required=True, choices=["backend", "frontend"])
    endpoint = StringField()  # e.g. "POST /api/account" or "/n50/build-profile"
    user_email = StringField()
    user_role = StringField()
    exception_type = StringField()
    exception_message = StringField()
    traceback = StringField()  # truncated to 8KB upstream
    request_payload = StringField()  # sanitized JSON, truncated to 8KB upstream
    user_agent = StringField()
    ip = StringField()
    notified = BooleanField(default=False)

    meta = {
        "collection": "error_logs",
        "indexes": [
            # TTL: auto-expire after 90 days
            {"fields": ["-timestamp"], "expireAfterSeconds": 60 * 60 * 24 * 90},
            "exception_type",
            "source",
        ],
    }

    def __repr__(self):
        return (
            f"<ErrorLog {self.source} {self.exception_type} "
            f"{self.endpoint} @ {self.timestamp}>"
        )
