from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class Languages(Document, Mixin):
    """Model for Languages Options."""

    name = StringField(required=True)
    translations = DictField()
    updated_at = DateTimeField(required=True)

    def __repr__(self):
        return f"""<Languages  : {self.name}
                >"""
