# this file structure follows http://flask.pocoo.org/docs/1.0/patterns/appfactories/
# initializing db in api.models.base instead of in api.__init__.py
# to prevent circular dependencies
from .base import db
from .Users import Users
from .Education import Education
from .Video import Video
from .Availability import Availability
from .Image import Image
from .MentorProfile import MentorProfile
from .AppointmentRequest import AppointmentRequest
from .VerifiedEmail import VerifiedEmail
from .AdminEmails import AdminEmails

__all__ = [
    "db",
    "Users",
    "Education",
    "Video",
    "MentorProfile",
    "Availability",
    "AppointmentRequest",
    "Image",
    "VerifiedEmail",
    "AdminEmails"
]

# You must import all of the new Models you create to this page
