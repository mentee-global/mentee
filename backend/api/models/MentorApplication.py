from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class MentorApplication(Document, Mixin):
    """Model for mentor application."""

    email = StringField(required=True)
    name = StringField(required=True)
    cell_number = StringField(required=True)
    hear_about_us = StringField(required=True)
    offer_donation = BooleanField(required=True)
    employer_name = StringField(required=True)
    role_description = StringField(required=True)
    immigrant_status = StringField(required=True)
    languages = StringField(required=True)
    referral = StringField()
    knowledge_location = StringField(required=True)
    isColorPerson = BooleanField(required=True)
    isMarginalized = BooleanField(required=True)
    isFamilyNative = BooleanField(required=True)
    isEconomically = BooleanField(required=True)
    identify = StringField()
    pastLiveLocation = StringField(required=True)
    application_state = StringField(required=True)
    date_submitted = DateTimeField(required=True)

    def __repr__(self):
        return f"""<Mentor Application email: {self.email}
                \n name: {self.name}
                \n business_number: {self.business_number}
                \n cell_number: {self.cell_number}
                \n hear_about_us: {self.hear_about_us}
                \n offer_donation: {self.offer_donation} 
                \n employer_name: {self.employer_name}
                \n role_description: {self.role_description}
                \n time_at_current_company: {self.time_at_current_company}
                \n linkedin: {self.linkedin}
                \n why_join_mentee: {self.why_join_mentee}
                \n commit_time: {self.commit_time}
              
                \n immigrant_status: {self.immigrant_status}
                \n languages: {self.languages}
                \n referral: {self.referral}
                \n knowledge_location: {self. immigrant_status}
                \n date_submitted: {self.date_submitted}
                \n notes: {self.notes}
                \n application_state: {self.application_state}>"""
