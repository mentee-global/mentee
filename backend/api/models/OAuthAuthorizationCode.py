import datetime

from flask_mongoengine import Document
from mongoengine import StringField, DateTimeField


class OAuthAuthorizationCode(Document):
    meta = {
        "collection": "oauth_authorization_codes",
        "indexes": [
            {"fields": ["code"], "unique": True},
            {"fields": ["expires_at"], "expireAfterSeconds": 0},
        ],
    }

    code = StringField(required=True, unique=True, max_length=128)
    client_id = StringField(required=True, max_length=128)
    user_id = StringField(required=True, max_length=64)
    redirect_uri = StringField(required=True)
    scope = StringField(required=True)
    code_challenge = StringField(required=True)
    code_challenge_method = StringField(required=True, choices=["S256"])
    nonce = StringField()
    used_at = DateTimeField()
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    expires_at = DateTimeField(required=True)

    def get_redirect_uri(self):
        return self.redirect_uri

    def get_scope(self):
        return self.scope or ""

    def get_nonce(self):
        return self.nonce

    def get_auth_time(self):
        if self.created_at:
            return int(self.created_at.timestamp())
        return None

    def get_acr(self):
        return None

    def get_amr(self):
        return None

    def is_expired(self):
        if not self.expires_at:
            return True
        return datetime.datetime.utcnow() >= self.expires_at
