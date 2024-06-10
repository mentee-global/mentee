from tokenize import String
from api.core import Mixin
from .base import db
from mongoengine import *


class Countries(Document, Mixin):
    """Model for Countries Options."""

    country_code = StringField(required=True)
    country_name = StringField(required=True)

    def __repr__(self):
        return f"""<Countries  : {self.country_name}
                >"""
