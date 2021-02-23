from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Education, Video, Availability, Image, Users


class MenteeProfile(Document, Mixin):
    """"Mentee Profile Collection."""

    name = StringField(required=True)
    gender = StringField(required=True)
    location = StringField()
    age = StringField(required=True)
    email = StringField(required=True)
    phone_number = StringField()
    linkedin = StringField()
    website = StringField()
    image = EmbeddedDocumentField(Image)
    education = ListField(EmbeddedDocumentField(Education))
    languages = ListField(StringField(), required=True)
    specialist_categories = ListField(StringField(), required=True)
    biography = StringField(required=False)
    organization = StringField(required=True)
    text_notifications = BooleanField(required=True)
    email_notifications = BooleanField(required=True)

    def __repr__(self):
        return f"""<MenteeProfile user_id:{self.id} \n name: {self.name}
                \n age: {self.age} gender: {self.gender}
                \n organization: {self.organization} 
                \n linkedin: {self.linkedin} \n website: {self.website}
                \n image: {self.image} \n biography: {self.biography}"""
