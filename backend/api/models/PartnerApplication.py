from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class PartnerApplication(Document, Mixin):
    """Model for mentor application."""

    email = StringField(required=True)
    organization = StringField(required=True)
    contanctPerson = StringField(required=True)
    personEmail = StringField(required=True)
    relationShip = ListField(StringField(), required=True)
    SDGS = ListField(StringField(), required=True)
    howBuild = StringField(required=True)
    application_state = StringField(required=True)
    date_submitted = DateTimeField(required=True)

    def __repr__(self):
        return f"""<partner Application email: {self.email}
                \n organization: {self.organization}
                \n contanctPerson: {self.contanctPerson}
                \n date_submitted: {self.date_submitted}
                \n application_state: {self.application_state}>"""
