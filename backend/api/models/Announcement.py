from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *
from api.models import Translations, Image


class Announcement(Document, Mixin):
    """Model for Announcement."""

    name = StringField(required=True)
    description = StringField(required=True)
    nameTranslated = DictField(required=False)
    descriptionTranslated = DictField(required=False)
    date_submitted = DateTimeField(required=True)
    role = StringField(required=True)
    filee = FileField()
    translations = EmbeddedDocumentField(Translations, required=False)
    file_name = StringField()
    image = EmbeddedDocumentField(Image, required=False)
    hub_id = StringField(required=False)
    hub_user = DictField(required=False)
    partner_id = StringField(required=False)
    mentor_id = StringField(required=False)
    mentee_id = StringField(required=False)

    def __repr__(self):
        return f"""<Announcement  : {self.title}
                \n title: {self.title}>"""
