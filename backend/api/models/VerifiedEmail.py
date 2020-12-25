from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *

# is_mentor field isn't scalable for other types of users
# change it if needed for other types
class VerifiedEmail(Document, Mixin):
    email = StringField(required=True)
    is_mentor = BooleanField(required=True)
    password = StringField()

    def __repr__(self):
        return f"<VerifiedEmail email: {self.email} is_mentor: {self.is_mentor} password: {self.password}"
