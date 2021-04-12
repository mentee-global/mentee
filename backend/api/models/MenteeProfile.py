from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Education, Video, Image, Users, MentorProfile


class MenteeProfile(Document, Mixin):
    """"Mentee Profile Collection."""

    name = StringField(required=True)
    firebase_uid = StringField()
    gender = StringField(required=True)
    location = StringField()
    age = StringField(required=True)
    email = StringField(required=True)
    phone_number = StringField()
    image = EmbeddedDocumentField(Image)
    education = ListField(EmbeddedDocumentField(Education))
    languages = ListField(StringField(), required=True)
    biography = StringField()
    organization = StringField(required=True)
    text_notifications = BooleanField(required=True)
    email_notifications = BooleanField(required=True)
    is_private = BooleanField(required=True)
    video = EmbeddedDocumentField(Video)
    favorite_mentors = ListField(ReferenceField(MentorProfile))

    def __repr__(self):
        return f"""<MenteeProfile user_id:{self.id} \n name: {self.name}
                \n age: {self.age} gender: {self.gender}
                \n organization: {self.organization} 
                \n linkedin: {self.linkedin} \n website: {self.website}
                \n image: {self.image} \n biography: {self.biography}"""
