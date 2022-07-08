from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class Notifications(Document, Mixin):
    """Model for mentor application."""

    message = StringField(required=True)
    mentorId = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    readed=BooleanField(required=True)

    def __repr__(self):
        return f"""<Notification  : {self.message}
                \n mentorId: {self.mentorId}
                \n readed: {self.readed}
                \n date_submitted: {self.date_submitted}>"""
