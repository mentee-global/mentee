from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Education, Video, Availability, Image, Users


class MentorProfile(Document, Mixin):
    """"Mentor Profile Collection."""

    user_id = ReferenceField("Users", required=True)
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
    offers_in_person = BooleanField(required=True)
    offers_group_appointments = BooleanField(required=True)
    videos = ListField(EmbeddedDocumentField(Video))
    availability = ListField(EmbeddedDocumentField(Availability))
    text_notifications = BooleanField(required=True)
    email_notifications = BooleanField(required=True)

    def __repr__(self):
        return f"""<MentorProfile user_id:{self.user_id} \n name: {self.name} 
                \n professional title: {self.professional_title} 
                \n linkedin: {self.linkedin} \n website: {self.website}
                \n image: {self.image} \n biography: {self.biography} 
                \n offers_in_person: {self.offers_in_person} 
                \n offers_group_appointments: {self.offers_group_appointments}>"""
