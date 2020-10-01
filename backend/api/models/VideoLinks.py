from api.core import Mixin
from .base import db
from flask_mongoengine import Document
from mongoengine import *

class VideoLinks(Document, Mixin):
    """Video Links Collection"""
    def __init__(self, link, tag):
        self.link = link
        self.tag = tag

    link = StringField(required=True)
    tag = StringField(required=True)

    def __repr__(self):
        return f"<VideoLink {self.link}>"