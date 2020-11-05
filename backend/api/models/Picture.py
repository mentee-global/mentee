from api.core import Mixin
from .base import db
from mongoengine import *


class Picture(EmbeddedDocument, Mixin):
    """Picture embedded within Mentor."""

    url = StringField(required=True)
    picture_hash = StringField(required=True)

    def __repr__(self):
        return f"""<Picture {self.url}>"""
