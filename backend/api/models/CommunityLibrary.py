from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *
from api.models import Translations


class CommunityLibrary(Document, Mixin):
    """Model for mentor application."""

    name = StringField(required=True)
    description = StringField(required=True)
    nameTranslated = DictField(required=False)
    descriptionTranslated = DictField(required=False)
    date_submitted = DateTimeField(required=True)
    filee = FileField()
    translations = EmbeddedDocumentField(Translations, required=False)
    file_name = StringField()
    hub_id = StringField(required=True)
    user_id = StringField(required=True)
    user_name = StringField(required=True)

    def __repr__(self):
        return f"""<CommunityLibrary  : {self.name}
                \n name: {self.name}
                \n description: {self.description}
                \n date_submitted: {self.date_submitted}>"""
