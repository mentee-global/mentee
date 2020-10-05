from api.core import Mixin
from .base import db
from mongoengine import *


class VideoInfo(EmbeddedDocument, Mixin):
    """Video Information Collection"""

    def __init__(self, title, url, tags):
        self.title = title
        self.url = url
        self.tags = tags

    title = StringField(required=True)
    url = StringField(required=True)
    tags = StringField(required=True)

    def __repr__(self):
        return f"<VideoInfo title: {self.title} URL: {self.url} tags: {self.tags}>"
