from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class MenteeApplication(Document, Mixin):
    """Model for Mentee application."""
    email = StringField(required=True)
    name = StringField(required=True)
    age = StringField(required=True)
    immigrant_status = ListField(StringField(), required=True)
    Country = StringField(required=True)
    identify = StringField(required=True)
    language = StringField(required=True)
    topics =ListField(StringField(), required=True)
    workstate =ListField(StringField(), required=True)
    isSocial = StringField(required=True)
    questions = StringField(required=True)
    application_state = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    notes=StringField()

    def __repr__(self):
        return f"""Mentee Application email: {self.email}
                \n name: {self.name}
                \n age: {self.age}
                \n Country: {self.Country}
                \n topics: {self.topics}
                \n questions: {self.questions}
                \n immigrant_status: {self.immigrant_status}
                \n language: {self.language}
                \n identify: {self.identify}
                \n workstate: {self. workstate}
                \n date_submitted: {self.date_submitted}
                \n isSocial: {self.isSocial}
                \n application_state: {self.application_state}>"""
