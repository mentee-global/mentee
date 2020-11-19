from api.core import Mixin
from .base import db
from mongoengine import *


class Image(EmbeddedDocument, Mixin):
    """Image embedded within Mentor."""

    url = StringField(required=True)
    image_hash = StringField(required=True)

    def __repr__(self):
        return f"""<Image {self.url}>"""
