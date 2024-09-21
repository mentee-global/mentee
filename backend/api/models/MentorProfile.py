from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Education, Video, Availability, Image


class MentorProfile(Document, Mixin):
    """Mentor Profile Collection."""

    firebase_uid = StringField()
    user_id = ReferenceField("Users")
    name = StringField(required=True)
    location = StringField()
    email = StringField(required=True)
    phone_number = StringField()
    professional_title = StringField(required=True)
    linkedin = StringField()
    website = StringField()
    image = EmbeddedDocumentField(Image)
    education = ListField(EmbeddedDocumentField(Education))
    languages = ListField(StringField(), required=True)
    specializations = ListField(StringField(), required=True)
    biography = StringField(required=False)
    offers_in_person = BooleanField(required=False, default=False)
    offers_group_appointments = BooleanField(required=False, default=False)
    videos = ListField(EmbeddedDocumentField(Video))
    video = EmbeddedDocumentField(Video)
    availability = ListField(EmbeddedDocumentField(Availability))
    taking_appointments = BooleanField(required=False)
    text_notifications = BooleanField(required=True)
    email_notifications = BooleanField(required=True)
    pair_partner = DictField(required=False)
    preferred_language = StringField(required=False, default="en-US")
    roomName = StringField(required=False)

    def __repr__(self):
        return f"""<MentorProfile firebase_id: {self.firebase_uid} 
                \n user_id:{self.user_id} \n name: {self.name} 
                \n professional title: {self.professional_title} 
                \n linkedin: {self.linkedin} \n website: {self.website}
                \n image: {self.image} \n biography: {self.biography} 
                \n offers_in_person: {self.offers_in_person} 
                \n offers_group_appointments: {self.offers_group_appointments}>"""
