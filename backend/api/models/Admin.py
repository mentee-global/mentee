from api.core import Mixin
from flask_mongoengine import Document
from mongoengine import *
from api.models import Image


class Admin(Document, Mixin):
    """Admin Collection."""

    firebase_uid = StringField(required=True)
    email = StringField(required=True)
    name = StringField(required=True)
    image = EmbeddedDocumentField(Image)
    roomName = StringField(required=False)

    def __repr__(self):
        return f"""<User id:{self.id} 
                \n firebase_uid:{self.firebase_uid}
                \n email:{self.email}
                \n name:{self.name}>"""
