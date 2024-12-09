from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *
from api.models import Translations


class SignOrigin(Document, Mixin):
    """Model for mentor application."""

    name = StringField(required=True)
    description = StringField(required=True)
    nameTranslated = DictField(required=False)
    descriptionTranslated = DictField(required=False)
    date_submitted = DateTimeField(required=True)
    role = StringField(required=False)
    filee = FileField()
    translations = EmbeddedDocumentField(Translations, required=False)
    file_name = StringField()
    hub_id = StringField(required=False)
    hub_user = DictField(required=False)

    def __repr__(self):
        return f"""<SignOrigin  : {self.name}
                \n name: {self.name}
                \n url: {self.url}
                \n description: {self.description}
                \n date_submitted: {self.date_submitted}>"""
