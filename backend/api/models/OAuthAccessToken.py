import datetime

from flask_mongoengine import Document
from mongoengine import StringField, DateTimeField, BooleanField


class OAuthAccessToken(Document):
    meta = {
        "collection": "oauth_access_tokens",
        "indexes": [
            {"fields": ["token_hash"], "unique": True},
            {"fields": ["expires_at"], "expireAfterSeconds": 0},
        ],
    }

    token_hash = StringField(required=True, unique=True)
    client_id = StringField(required=True)
    user_id = StringField(required=True)
    scope = StringField(required=True)
    parent_refresh_token_id = StringField()
    revoked = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    expires_at = DateTimeField(required=True)

    def get_client_id(self):
        return self.client_id

    def get_scope(self):
        return self.scope or ""

    def get_expires_in(self):
        if not self.expires_at:
            return 0
        return int((self.expires_at - datetime.datetime.utcnow()).total_seconds())

    def is_expired(self):
        if not self.expires_at:
            return True
        return datetime.datetime.utcnow() >= self.expires_at

    def is_revoked(self):
        return bool(self.revoked)

    def get_user_id(self):
        return self.user_id

    def check_client(self, client):
        return self.client_id == client.client_id
