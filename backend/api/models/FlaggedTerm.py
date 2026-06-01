from datetime import datetime

from api.core import Mixin
from flask_mongoengine import Document
from mongoengine import *


class FlaggedTerm(Document, Mixin):
    meta = {
        "indexes": [
            "enabled",
            "language",
            "severity",
            {"fields": ["term", "language"], "unique": True},
        ],
    }

    term = StringField(required=True)
    language = StringField(required=False, default="all")
    category = StringField(required=False, default="custom")
    severity = StringField(
        required=False,
        default="medium",
        choices=("low", "medium", "high"),
    )
    enabled = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    def __repr__(self):
        return f"<FlaggedTerm:{self.term} language:{self.language}>"
