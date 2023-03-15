from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *


# is_mentor field isn't scalable for other types of users
# change it if needed for other types
class VerifiedEmail(Document, Mixin):
    email = StringField(required=True)
    role = StringField(required=True)
    password = StringField()

    def __repr__(self):
        return f"<VerifiedEmail email: {self.email} role: {self.role} password: {self.password}"
