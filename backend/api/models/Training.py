from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class Training(Document, Mixin):
    """Model for mentor application."""

    name = StringField(required=True)
    url = StringField()
    description = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    role = StringField(required=True)
    filee = FileField()
    isVideo = BooleanField(required=True)
    typee = StringField(required=True)
    file_name = StringField()

    def __repr__(self):
        return f"""<Training  : {self.name}
                \n name: {self.name}
                \n url: {self.url}
                \n description: {self.description}
                \n date_submitted: {self.date_submitted}>"""
