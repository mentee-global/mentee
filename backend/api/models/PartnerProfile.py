from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *
from api.models import Education, Video, Image


class PartnerProfile(Document, Mixin):
    """Model for mentor application."""

    firebase_uid = StringField()
    email = StringField(required=True)
    text_notifications = BooleanField(required=True)
    email_notifications = BooleanField(required=True)
    organization = StringField(required=True)
    location = StringField(required=True)
    person_name = StringField()
    regions = ListField(StringField(), required=True)
    intro = StringField(required=True)
    website = StringField()
    linkedin = StringField()
    sdgs = ListField(StringField(), required=True)
    topics = StringField()
    open_grants = BooleanField(required=True)
    open_projects = BooleanField(required=True)
    image = EmbeddedDocumentField(Image)

    def __repr__(self):
        return f"""<Partner email: {self.email}
                \n name: {self.name}
                \n phone_number: {self.phone_number}
                \n organization: {self.organization}
                \n role: {self.role}>"""
