from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *


class Users(Document, Mixin):
    """User Collection."""

    firebase_uid = StringField()
    email = StringField(required=True)
    role = StringField(required=True)
    mongooseVersion = IntField(db_field="__v")

    # legacy fields (DO NOT USE)
    password = StringField()
    pin = IntField()
    expiration = DateTimeField()
    verified = BooleanField(required=True)

    def __repr__(self):
        return f"<User id:{self.id} \n email:{self.email}>"
