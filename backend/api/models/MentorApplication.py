from api.core import Mixin
from .base import db
from mongoengine import *


class MentorApplication(Document, Mixin):
    """Model for mentor application."""

    email = StringField(required=True)
    name = StringField(required=True)
    cell_number = StringField(required=True)
    business_number = StringField()
    hear_about_us = StringField(required=True)
    offer_donation = BooleanField(required=False)
    mentoring_options = ListField(StringField(), required=True)
    employer_name = StringField(required=True)
    work_sectors = ListField(StringField(), required=True)
    role_description = StringField(required=True)
    time_at_current_company = StringField(required=True)
    linkedin = StringField(required=True)
    why_join_mentee = StringField(required=True)
    commit_time = StringField(required=True)
    specialist_time = StringField()
    immigrant_status = StringField(required=True)
    languages = StringField(required=True)
    specializations = ListField(StringField(), required=True)
    knowledge_location = StringField(required=True)
    referral = StringField()
    application_state = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    notes = StringField()
    traingStatus = DictField(required=False)

    def __repr__(self):
        return f"""<Mentor Application email: {self.email}
                \n name: {self.name}
                \n business_number: {self.business_number}
                \n cell_number: {self.cell_number}
                \n hear_about_us: {self.hear_about_us}
                \n offer_donation: {self.offer_donation}
                \n mentoring_options: {self.mentoring_options} 
                \n employer_name: {self.employer_name}
                \n work_sectors: {self.work_sectors}
                \n role_description: {self.role_description}
                \n time_at_current_company: {self.time_at_current_company}
                \n linkedin: {self.linkedin}
                \n why_join_mentee: {self.why_join_mentee}
                \n commit_time: {self.commit_time}
                \n specializations: {self.specializations}
                \n immigrant_status: {self.immigrant_status}
                \n languages: {self.languages}
                \n referral: {self.referral}
                \n knowledge_location: {self. immigrant_status}
                \n date_submitted: {self.date_submitted}
                \n notes: {self.notes}
                \n application_state: {self.application_state}>"""
