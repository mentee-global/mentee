from api.core import Mixin
from .base import db
from mongoengine import *
from flask_mongoengine import Document
from api.models import Email

class ApptRequest(Document, Mixin):
    """Appointment Request Collection."""

    name = StringField(required = True)
    email = EmbeddedDocumentField(Email, required = True)
    phone_number = StringField(required = True)
    languages = ListField(StringField(), required=True)
    age = IntField(required = True)
    gender = StringField(required = True)
    ethnicity = StringField(required = True)
    location = StringField()
    mentorship_goals = StringField(required = True)
    specialist_categories = ListField(StringField(), required = True)
    message = StringField()
    attendee_count = IntField(required = True)
    organization = StringField(required = True)

    def __repr__(self):
        return f"""<name: {self.name}
                \n email: {self.email}
                \n phone_number: {self.phone_number}
                \n languages: {self.languages}
                \n age: {self.age}
                \n gender: {self.gender}
                \n ethnicity: {self.ethnicity}
                \n location: {self.location}
                \n mentorship_goals: {self.mentorship_goals}
                \n specialist_categories: {self.specialist_categories}
                \n message: {self.message}
                \n attendee_count: {self.attendee_count}
                \n organization: {self.organization}>"""

