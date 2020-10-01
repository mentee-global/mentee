from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *

class VideoLinks(Document, Mixin):
    """Video Links Collection"""

    Link = StringField(required=True)
    Tag = StringField(required=True)

    def __repr__(self):
        return f"<VideoLink {self.Link}>"