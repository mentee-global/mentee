from api.core import Mixin
from .base import db
from mongoengine import *
from flask_mongoengine import Document
from datetime import datetime


class BugReport(Document, Mixin):
    """Bug Report Collection."""

    description = StringField(required=True)
    user_name = StringField(required=True)
    user_email = StringField(required=True)
    user_id = ObjectIdField()  # Link to Users if logged in
    role = StringField()
    context = StringField()  # navigation-header, home-layout, etc.
    page_url = StringField()
    status = StringField(default="new")  # new, in_progress, resolved, closed
    priority = StringField(default="medium")  # low, medium, high, critical
    attachments = ListField(DictField())  # Store file URLs and metadata from GCS
    date_submitted = DateTimeField(required=True, default=datetime.utcnow)
    resolved_date = DateTimeField()
    resolved_by = StringField()
    notes = StringField()  # Admin notes
    email_sent = BooleanField(default=False)
    email_error = StringField()

    def __repr__(self):
        return f"""<BugReport 
                user: {self.user_name} ({self.user_email})
                status: {self.status}
                date: {self.date_submitted}
                description: {self.description[:50]}...>"""
