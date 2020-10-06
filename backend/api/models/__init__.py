# this file structure follows http://flask.pocoo.org/docs/1.0/patterns/appfactories/
# initializing db in api.models.base instead of in api.__init__.py
# to prevent circular dependencies
from .base import db
from .Email import Email
from .Person import Person

__all__ = ["db", "Email", "Person", "Education"]

# You must import all of the new Models you create to this page
