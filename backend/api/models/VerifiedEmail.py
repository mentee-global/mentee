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

    @staticmethod
    def normalize_email(value):
        """The access gate looks emails up after strip().lower(), so a row stored
        with a pasted CR/LF or mixed casing is invisible to it. Normalize on the
        way in (drop all whitespace, lowercase) so the stored value always
        matches how it is later queried."""
        if not isinstance(value, str):
            return value
        return "".join(value.split()).lower()

    def clean(self):
        self.email = self.normalize_email(self.email)

    def __repr__(self):
        return f"<VerifiedEmail email: {self.email} role: {self.role} password: {self.password}"
