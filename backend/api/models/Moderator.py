from api.core import Mixin
from flask_mongoengine import Document
from mongoengine import *


class Moderator(Document, Mixin):
    """Moderator Collection."""

    firebase_uid = StringField(required=True)
    email = StringField(required=True)
    name = StringField(required=True)
    roomName = StringField(required=False)

    def __repr__(self):
        return f"""<User id:{self.id} 
                \n firebase_uid:{self.firebase_uid}
                \n email:{self.email}
                \n name:{self.name}>"""
