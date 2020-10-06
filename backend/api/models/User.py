from api.core import Mixin
from .base import db
from api.models import Email
from flask_mongoengine import Document
from mongoengine import *


class User(Document, Mixin):
    """User Collection."""

    userId = StringField(required=True)
    username = StringField(required=True)

    def __repr__(self):
        return f"<User id:{self.userId} \n username:{self.username}>"
