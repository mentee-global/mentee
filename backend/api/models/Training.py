from tokenize import String
<<<<<<< HEAD

=======
>>>>>>> 8801e225af5664508c6b57f8b15e0265d73df029
from api.core import Mixin
from .base import db
from mongoengine import *


class Training(Document, Mixin):
    """Model for mentor application."""

    name = StringField(required=True)
<<<<<<< HEAD
    url = StringField()
    description = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    role=StringField(required=True)
    filee=FileField()
    isVideo=BooleanField(required=True)
    file_name=StringField()
=======
    url = StringField(required=True)
    description = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    role=StringField(required=True)
>>>>>>> 8801e225af5664508c6b57f8b15e0265d73df029

    def __repr__(self):
        return f"""<Training  : {self.name}
                \n name: {self.name}
                \n url: {self.url}
                \n description: {self.description}
                \n date_submitted: {self.date_submitted}>"""
