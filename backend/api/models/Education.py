from api.core import Mixin
from .base import db
from mongoengine import *


class Education(EmbeddedDocument, Mixin):
    """Education embedded within Mentor."""

    education_level = StringField(required=True)
    majors = ListField(StringField(), required=True)
    school = StringField(required=True)
    graduation_year = IntField(required=True)

    def __repr__(self):
        return f"""<Education level: {self.education_level}, 
                    majors: {self.majors}, school: {self.school}, 
                    graduation year: {self.graduation_year}>"""
