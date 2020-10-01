from api.core import Mixin
from .base import db
from mongoengine import *


class Email(EmbeddedDocument, Mixin):
    """Education embedded within Mentor."""

    educationLevel = StringField()
    majors = ListField(StringField())
    school = StringField()
    graduationYear = IntField()

    def __init__(self, educationLevel, majors, school, graduationYear):
        self.educationLevel = education_level
        self.majors = majors
        self.school = school
        self.graduationYear = graduationYear

    def __repr__(self):
        return f"""<Highest degree {self.educationLevel}, 
                    majors {self.majors}, school {self.school}, 
                    graduation date {self.graduationYear}>"""
