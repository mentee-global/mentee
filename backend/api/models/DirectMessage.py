from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Availability


class DirectMessage(Document, Mixin):
    meta = {
        "indexes": [
            "-created_at",
            "message_read",
            {"fields": ["message_read", "-created_at"]},
            {"fields": ["sender_id", "-created_at"]},
            {"fields": ["recipient_id", "-created_at"]},
        ],
    }

    body = StringField(required=True)
    message_read = BooleanField(required=True)
    sender_id = ObjectIdField(required=True)
    recipient_id = ObjectIdField(required=True)
    created_at = DateTimeField(required=True)
    availabes_in_future = ListField(EmbeddedDocumentField(Availability), required=False)

    def __repr__(self):
        return f"<DirectMessage:{self.body} \n Sent by:{self.sender_id} to :{self.recipient_id}>"
