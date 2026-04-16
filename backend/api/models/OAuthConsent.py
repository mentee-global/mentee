import datetime

from flask_mongoengine import Document
from mongoengine import StringField, ListField, DateTimeField


class OAuthConsent(Document):
    meta = {
        "collection": "oauth_consents",
        "indexes": [{"fields": ["user_id", "client_id"], "unique": True}],
    }

    user_id = StringField(required=True)
    client_id = StringField(required=True)
    granted_scopes = ListField(StringField(), required=True)
    granted_at = DateTimeField(default=datetime.datetime.utcnow)
    revoked_at = DateTimeField()
