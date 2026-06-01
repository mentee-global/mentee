from api.core import Mixin
from flask_mongoengine import Document
from mongoengine import *
from api.models import Image
from datetime import datetime


class Hub(Document, Mixin):
    """Hub Collection."""

    meta = {"indexes": ["email", "-created_at"]}

    firebase_uid = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    email = StringField(required=True)
    name = StringField(required=True)
    image = EmbeddedDocumentField(Image)
    url = StringField(required=True)
    invite_key = StringField(required=False)
    preferred_language = StringField(required=False, default="en-US")
    roomName = StringField(required=False)
    mentorMentee = StringField(required=False)

    def __repr__(self):
        return f"""<Hub id:{self.id} 
                \n firebase_uid:{self.firebase_uid}
                \n email:{self.email}
                \n name:{self.name}>"""
