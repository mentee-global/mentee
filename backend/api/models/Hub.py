from api.core import Mixin
from flask_mongoengine import Document
from mongoengine import *
from api.models import Image


class Hub(Document, Mixin):
    """Hub Collection."""

    firebase_uid = StringField(required=True)
    email = StringField(required=True)
    name = StringField(required=True)
    image = EmbeddedDocumentField(Image)
    url = StringField(required=True)
    invite_key = StringField(required=False)
    preferred_language = StringField(required=False, default="en-US")
    roomName = StringField(required=False)

    def __repr__(self):
        return f"""<Hub id:{self.id} 
                \n firebase_uid:{self.firebase_uid}
                \n email:{self.email}
                \n name:{self.name}>"""
