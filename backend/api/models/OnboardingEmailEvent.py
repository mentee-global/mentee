from datetime import datetime

from flask_mongoengine import Document
from mongoengine import BooleanField, DateTimeField, DictField, StringField

from api.core import Mixin


class OnboardingEmailEvent(Document, Mixin):
    """Audit row for admin-triggered onboarding recovery actions."""

    meta = {
        "indexes": [
            "email",
            "role",
            "-created_at",
            {"fields": ["email", "role", "-created_at"]},
        ],
    }

    email = StringField(required=True)
    role = StringField(required=True)
    action = StringField(required=True)
    template_id = StringField()
    link_type = StringField()
    success = BooleanField(required=True)
    error_message = StringField()
    admin_uid = StringField()
    admin_email = StringField()
    created_at = DateTimeField(default=datetime.utcnow)
    metadata = DictField()
