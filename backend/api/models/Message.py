from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Users

class Message(Document, Mixin):
    """User Collection."""

    message = StringField(required=True)
    user_name = StringField(required=True)
    user_id = ReferenceField("Users", required=True)
    recipient_name = StringField(required=True)
    recipient_id = ReferenceField("Users", required=True)
    email = StringField()
    link = StringField()
    read = BooleanField(required=True)

    def __repr__(self):
        return f"<Message:{self.message} \n Sent by:{self.user_name} to :{self.recipient_name}>"