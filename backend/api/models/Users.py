from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *


class Users(Document, Mixin):
    """User Collection."""

    email = StringField(required=True)
    password = StringField(required=True)
    role = StringField(required=True)
    verified = BooleanField(required=True)
    pin = IntField(required=True)
    expiration = DateTimeField(required=True)
    mongooseVersion = IntField(db_field="__v")

    def __repr__(self):
        return f"<User id:{self.id} \n email:{self.email}>"
