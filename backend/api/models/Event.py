import imp
from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *
from api.models import Image


class Event(Document, Mixin):
    user_id = ObjectIdField(required=True)
    title = StringField(required=True)
    start_datetime = DateTimeField(required=False)
    end_datetime = DateTimeField(required=False)
    role = ListField(IntField(), required=True)
    description = StringField(required=False)
    url = StringField(required=False)
    titleTranslated = DictField(required=False)
    descriptionTranslated = DictField(required=False)
    image_file = EmbeddedDocumentField(Image, required=False)
    date_submitted = DateTimeField(required=True)
    hub_id = StringField(required=False)
    partner_ids = ListField(StringField(), required=False)

    def __repr__(self):
        return f"""<Event  : {self.title}
                \n title: {self.title}>"""
