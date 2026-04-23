import datetime

from flask_mongoengine import Document
from mongoengine import StringField, DateTimeField, BooleanField, IntField


class OAuthRefreshToken(Document):
    meta = {
        "collection": "oauth_refresh_tokens",
        "indexes": [
            {"fields": ["token_hash"], "unique": True},
            {"fields": ["user_id"]},
        ],
    }

    token_hash = StringField(required=True, unique=True)
    client_id = StringField(required=True)
    user_id = StringField(required=True)
    scope = StringField(required=True)
    rotated_from = StringField()
    revoked = BooleanField(default=False)
    # Snapshot of Users.token_version at issuance. A password-reset bumps the
    # user-level counter; the refresh-token grant compares against it and
    # rejects tokens issued before the bump.
    token_version = IntField(default=0)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    expires_at = DateTimeField(required=True)
    last_used_at = DateTimeField()

    def is_expired(self):
        if not self.expires_at:
            return True
        return datetime.datetime.utcnow() >= self.expires_at

    def is_revoked(self):
        return bool(self.revoked)

    def check_client(self, client):
        return self.client_id == client.client_id

    def get_scope(self):
        return self.scope or ""
