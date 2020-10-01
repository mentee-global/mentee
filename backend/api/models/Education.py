from api.core import Mixin
from .base import db
from mongoengine import *


class Email(EmbeddedDocument, Mixin):
    """Education embedded within Mentor."""

    education_level = StringField()
    majors = ListField(StringField())
    school = StringField()
    graduation_year = IntField()

    def __init__(self, education_level, majors, school, graduation_year):
        self.education_level = education_level
        self.majors = majors
        self.school = school
        self.graduation_year = graduation_year

    def __repr__(self):
        return f"""<Highest degree {self.education_level}, 
                    majors {self.majors}, school {self.school}, 
                    graduation date {self.graduation_year}>"""
