from api.core import Mixin
from .base import db
from api.models import Email
from flask_mongoengine import Document
from mongoengine import *

class MentorProfile(Document, Mixin):
    """"Mentor Profile Collection."""
    
    uid = "" # TBD later
    name = StringField(required=True)
    professional_title = StringField(required=True)
    linkedin = StringField(required=True)
    website = StringField(required=True)
    picture = StringField(required=True)
    education = EmbeddedDocumentField(Education)
    languages = ListField(StringField(required=True))
    specializations = ListField(StringField(required=True))
    biography = StringField(required=False)
    offers_in_person = BooleanField(required=True)
    offers_group_appointments = BooleanField(required=True)
    video_links = EmbeddedDocumentField(VideoLinks)

    def __repr__(self):
        return f"""<Mentor id:{self.uid} \n name: {self.name} 
                \n professional title: {self.professional_title} 
                \n linkedin: {self.linkedin} \n website: {self.website}
                \n picture: {self.picture} \n biography: {self.biography} 
                \n offers_in_person: {self.offers_in_person} 
                \n offers_group_appointments: {self.offers_group_appointments}>"""