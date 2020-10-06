from api.core import Mixin
from .base import db
from mongoengine import *


class Education(EmbeddedDocument, Mixin):
    """Education embedded within Mentor."""

    education_level = StringField(max_length=200, required=True)
    majors = ListField(StringField(), min_length=1, required=True)
    school = StringField(max_length=200, required=True)
    graduation_year = IntField(required=True)

    def __init__(self, education_level, majors, school, graduation_year):
        self.education_level = education_level
        self.majors = majors
        self.school = school
        self.graduation_year = graduation_year

    def __repr__(self):
        return f"""<Education level: {self.education_level}, 
                    majors: {self.majors}, school: {self.school}, 
                    graduation year: {self.graduation_year}>"""
