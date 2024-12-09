from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *
from api.models import Translations


class SignedDocs(Document, Mixin):
    """Model for mentor application."""

    doc_id = StringField(required=False)
    training_id = StringField(required=True)
    date_submitted = DateTimeField(required=True)
    role = StringField(required=False)
    user_email = StringField(required=True)
    filee = FileField(required=True)
    approved = BooleanField(required=False)
    hub_id = StringField(required=False)
    hub_user = DictField(required=False)

    def __repr__(self):
        return f"""<SignedDocs  :
                \n date_submitted: {self.date_submitted}>"""
