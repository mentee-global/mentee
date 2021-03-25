from api.core import Mixin
from flask_mongoengine import Document
from mongoengine import *


class Admin(Document, Mixin):
    """Admin Collection."""

    email = StringField(required=True)
    name = StringField(required=True)

    def __repr__(self):
        return f"""<User id:{self.id} 
                \n email:{self.email}
                \n name:{self.name}>"""
