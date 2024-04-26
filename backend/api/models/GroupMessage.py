from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Availability


class GroupMessage(Document, Mixin):
    body = StringField(required=True)
    message_read = BooleanField(required=True)
    sender_id = ObjectIdField(required=True)
    hub_user_id = ObjectIdField(required=True)
    created_at = DateTimeField(required=True)

    def __repr__(self):
        return f"<GroupMessage:{self.body} \n Sent by:{self.sender_id}>"
