from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class NewMentorApplication(Document, Mixin):
    """Model for mentor application."""

    email = StringField(required=True)
    name = StringField(required=True)
    cell_number = StringField(required=True)
    hear_about_us = StringField(required=True)
    offer_donation = StringField(required=True)
    employer_name = StringField(required=True)
    role_description = StringField(required=True)
    immigrant_status = BooleanField(required=True)
    languages = StringField(required=True)
    referral = StringField()
    companyTime=StringField()
    specialistTime=StringField()
    knowledge_location = StringField(required=True)
    isColorPerson = BooleanField(required=True)
    isMarginalized = BooleanField(required=True)
    isFamilyNative = BooleanField(required=True)
    isEconomically = BooleanField(required=True)
    identify = StringField()
    pastLiveLocation = StringField(required=True)
    application_state = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    notes = StringField()


    def __repr__(self):
        return f"""<Mentor Application email: {self.email}
                \n name: {self.name}
                \n cell_number: {self.cell_number}
                \n hear_about_us: {self.hear_about_us}
                \n offer_donation: {self.offer_donation} 
                \n employer_name: {self.employer_name}
                \n role_description: {self.role_description}              
                \n immigrant_status: {self.immigrant_status}
                \n languages: {self.languages}
                \n referral: {self.referral}
                \n knowledge_location: {self. immigrant_status}
                \n date_submitted: {self.date_submitted}
                \n isColorPerson: {self.isColorPerson}
                \n isMarginalized: {self.isMarginalized}
                \n isFamilyNative: {self.isFamilyNative}
                \n isEconomically: {self.isEconomically}
                \n identify: {self.identify}
                \n pastLiveLocation: {self.pastLiveLocation}
                \n application_state: {self.application_state}>"""
