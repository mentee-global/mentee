from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class NewProfile(Document, Mixin):
    """Model for mentor application."""
    email = StringField(required=True)
    name = StringField(required=True)
    phone_number = StringField(required=True)
    video_url= StringField(required=True)
    password = StringField(required=True)
    role = StringField(required=True)
    date_submitted = DateTimeField(required=True)

    def __repr__(self):
        return f"""<profile email: {self.email}
                \n name: {self.name}
                \n phone_number: {self.phone_number}
                \n date_submitted: {self.date_submitted}
                \n video_url: {self.video_url}
                \n role: {self.role}>"""
