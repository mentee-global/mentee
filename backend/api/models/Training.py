from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *
from api.models import Translations


class Training(Document, Mixin):
    """Model for mentor application."""

    name = StringField(required=True)
    url = StringField()
    description = StringField(required=True)
    nameTranslated = DictField(required=False)
    descriptionTranslated = DictField(required=False)
    date_submitted = DateTimeField(required=True)
    role = StringField(required=True)
    filee = FileField()
    translations = EmbeddedDocumentField(Translations, required=False)
    isVideo = BooleanField(required=True)
    requried_sign = BooleanField(required=False)
    typee = StringField(required=True)
    file_name = StringField()
    hub_id = StringField(required=False)
    hub_user = DictField(required=False)
    signed_data = DictField(required=False)
    partner_id = StringField(required=False)
    mentor_id = StringField(required=False)
    mentee_id = StringField(required=False)

    def __repr__(self):
        return f"""<Training  : {self.name}
                \n name: {self.name}
                \n url: {self.url}
                \n description: {self.description}
                \n date_submitted: {self.date_submitted}>"""
