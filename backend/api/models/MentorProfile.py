from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *
from api.models import Education, Video


class MentorProfile(Document, Mixin):
    """"Mentor Profile Collection."""

    uid = ""  # TODO: Add Uid field
    name = StringField(required=True)
    professional_title = StringField(required=True)
    linkedin = StringField(required=True)
    website = StringField(required=True)
    picture = StringField(required=True)
    education = EmbeddedDocumentField(Education)
    languages = ListField(StringField(), required=True)
    specializations = ListField(StringField(), required=True)
    biography = StringField(required=False)
    offers_in_person = BooleanField(required=True)
    offers_group_appointments = BooleanField(required=True)
    video = EmbeddedDocumentField(Video)

    def __init__(
        self,
        uid="",
        name="",
        professional_title="",
        linkedin="",
        website="",
        picture="",
        education=None,
        languages=None,
        specializations=None,
        biography="",
        offers_in_person=False,
        offers_group_appointments=False,
        video=None,
    ):
        Document.__init__(self)
        self.uid = uid
        self.name = name
        self.professional_title = professional_title
        self.linkedin = linkedin
        self.website = website
        self.picture = picture
        self.education = education
        self.languages = languages
        self.specializations = specializations
        self.biography = biography
        self.offers_in_person = offers_in_person
        self.offers_group_appointments = offers_group_appointments
        self.video = video

    def __repr__(self):
        return f"""<Mentor id:{self.uid} \n name: {self.name} 
                \n professional title: {self.professional_title} 
                \n linkedin: {self.linkedin} \n website: {self.website}
                \n picture: {self.picture} \n biography: {self.biography} 
                \n offers_in_person: {self.offers_in_person} 
                \n offers_group_appointments: {self.offers_group_appointments}>"""
