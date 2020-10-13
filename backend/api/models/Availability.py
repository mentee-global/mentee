from api.core import Mixin
from .base import db
from mongoengine import *


class Availability(EmbeddedDocument, Mixin):
    """Availability embedded within Mentor."""

    start_time = DateTimeField(required=True)
    end_time = DateTimeField(required=True)

    def __repr__(self):
        return f"""<start time: {self.start_time}, 
                    end_time: {self.end_time}>"""
