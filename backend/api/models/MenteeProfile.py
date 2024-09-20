from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Education, Video, Image, Users, MentorProfile


class MenteeProfile(Document, Mixin):
    """Mentee Profile Collection."""

    firebase_uid = StringField()
    name = StringField(required=True)
    gender = StringField(required=True)
    location = StringField()
    age = StringField(required=True)
    email = StringField(required=True)
    phone_number = StringField()
    image = EmbeddedDocumentField(Image)
    education = ListField(EmbeddedDocumentField(Education))
    isStudent = StringField()
    education_level = StringField()
    languages = ListField(StringField(), required=True)
    biography = StringField()
    organization = StringField(required=False)
    text_notifications = BooleanField(required=True)
    email_notifications = BooleanField(required=True)
    is_private = BooleanField(required=True)
    video = EmbeddedDocumentField(Video)
    favorite_mentors_ids = ListField(StringField())
    specializations = ListField(StringField())
    pair_partner = DictField(required=False)
    immigrant_status = ListField(StringField(), required=False)
    workstate = ListField(StringField(), required=False)
    preferred_language = StringField(required=False, default="en-US")
    roomName = StringField(required=False)

    def __repr__(self):
        return f"""<MenteeProfile user_id:{self.firebase_uid} \n name: {self.name}
                \n age: {self.age} gender: {self.gender}
                \n organization: {self.organization} 
                \n image: {self.image} \n biography: {self.biography}"""
