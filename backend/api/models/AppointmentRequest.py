from api.core import Mixin
from .base import db
from mongoengine import *
from flask_mongoengine import Document
from api.models import Availability


class AppointmentRequest(Document, Mixin):
    """Appointment Request Collection."""

    mentor_id = ObjectIdField(required=True)
    mentee_id = ObjectIdField()
    timeslot = EmbeddedDocumentField(Availability, required=True)
    accepted = BooleanField(required=True)
    message = StringField()
    allow_texts = BooleanField()
    allow_calls = BooleanField()

    # Legacy Fields
    organization = StringField()
    name = StringField()
    email = StringField()
    phone_number = StringField()
    languages = ListField(StringField())
    age = StringField()
    gender = StringField()
    location = StringField()
    specialist_categories = ListField(StringField(), required=True)

    def __repr__(self):
        return f"""<AppointmentRequest mentor_id: {self.mentor_id}
                \n mentee_id: {self.mentee_id}
                \n timeslot: {self.timeslot}
                \n accepted: {self.accepted}
                \n name: {self.name}
                \n email: {self.email}
                \n phone_number: {self.phone_number}
                \n languages: {self.languages} 
                \n age: {self.age}
                \n gender: {self.gender}
                \n location: {self.location}
                \n specialist_categories: {self.specialist_categories}
                \n message: {self.message}
                \n organization: {self.organization}
                \n allows_texts: {self.allow_texts}
                \n allows_calls: {self.allow_calls}>"""
