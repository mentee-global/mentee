from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class PartnerApplication(Document, Mixin):
    """Model for mentor application."""
    email = StringField(required=True)
    name = StringField(required=True)
    Country = StringField(required=True)
    application_state = StringField(required=True)
    date_submitted = DateTimeField(required=True)

    def __repr__(self):
        return f"""<Mentor Application email: {self.email}
                \n name: {self.name}
                \n Country: {self.Country}
                \n date_submitted: {self.date_submitted}
                \n application_state: {self.application_state}>"""
