from api.core import Mixin
from sqlalchemy import false
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Availability


class GroupMessage(Document, Mixin):
    title = StringField(required=False)
    body = StringField(required=True)
    message_read = BooleanField(required=True)
    message_edited = BooleanField(required=False)
    sender_id = ObjectIdField(required=True)
    hub_user_id = ObjectIdField(required=True)
    created_at = DateTimeField(required=True)
    parent_message_id = StringField(required=False)
    is_deleted = BooleanField(required=False)

    def __repr__(self):
        return f"<GroupMessage:{self.body} \n Sent by:{self.sender_id}>"
