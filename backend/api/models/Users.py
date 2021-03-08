from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *


class Users(Document, Mixin):
    """User Collection."""

    firebase_uid = StringField(required=True)
    email = StringField(required=True)
    role = StringField(required=True)
    verified = BooleanField(required=True)
    mongooseVersion = IntField(db_field="__v")

    # in the case where a User object exists but there is no Firebase user
    # we need to force the user to reset their password since the
    # newly created Firebase account is using an unsecure password
    lockedUntilPasswordReset = BooleanField()

    # legacy fields (DO NOT USE)
    password = StringField()
    pin = IntField()
    expiration = DateTimeField()

    def __repr__(self):
        return f"<User id:{self.id} \n email:{self.email}>"
