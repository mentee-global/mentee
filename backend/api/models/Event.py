from datetime import datetime

from mongoengine import *

from api.core import Mixin
from api.models import Image


EVENT_STATUSES = (
    "draft",
    "pending_review",
    "published",
    "rejected",
    "cancelled",
)
EVENT_SCOPE_TYPES = ("global", "hub", "partner")
EVENT_NOTIFICATION_STATUSES = (
    "not_requested",
    "queued",
    "processing",
    "completed",
    "completed_with_errors",
    "failed",
    "cancelled",
)


class Event(Document, Mixin):
    meta = {
        "indexes": [
            "status",
            "scope_type",
            "scope_id",
            "created_by_uid",
            "-start_datetime",
        ]
    }

    # Legacy fields remain readable while existing production records are
    # migrated into the workflow fields below.
    user_id = ObjectIdField(required=True)
    role = ListField(IntField(), required=True)
    hub_id = StringField(required=False)
    partner_ids = ListField(StringField(), required=False)

    title = StringField(required=True)
    start_datetime = DateTimeField(required=False)
    end_datetime = DateTimeField(required=False)
    description = StringField(required=False)
    url = StringField(required=False)
    titleTranslated = DictField(required=False)
    descriptionTranslated = DictField(required=False)
    image_file = EmbeddedDocumentField(Image, required=False)
    date_submitted = DateTimeField(required=True, default=datetime.utcnow)

    # A missing value means a legacy event that was already public before the
    # workflow existed. New events always set their status explicitly.
    status = StringField(choices=EVENT_STATUSES, default="published")
    scope_type = StringField(choices=EVENT_SCOPE_TYPES, default="global")
    scope_id = StringField(required=False)
    creator_role = IntField(required=False)
    created_by_uid = StringField(required=False)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    submitted_at = DateTimeField(required=False)
    submission_version = IntField(default=0)
    reviewed_by_uid = StringField(required=False)
    reviewed_at = DateTimeField(required=False)
    review_feedback = StringField(required=False)
    review_history = ListField(DictField(), default=list)
    published_by_uid = StringField(required=False)
    published_at = DateTimeField(required=False)
    cancelled_by_uid = StringField(required=False)
    cancelled_at = DateTimeField(required=False)
    notification_requested = BooleanField(default=False)
    notification_status = StringField(
        choices=EVENT_NOTIFICATION_STATUSES, default="not_requested"
    )
    notification_recipient_count = IntField(default=0)
    publication_version = IntField(default=0)

    def __repr__(self):
        return f"<Event title={self.title!r} status={self.status!r}>"
