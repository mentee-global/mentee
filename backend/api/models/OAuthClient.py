import datetime
import bcrypt

from flask_mongoengine import Document
from mongoengine import (
    StringField,
    ListField,
    DateTimeField,
    BooleanField,
)


class OAuthClient(Document):
    meta = {
        "collection": "oauth_clients",
        "indexes": [{"fields": ["client_id"], "unique": True}],
    }

    client_id = StringField(required=True, unique=True, max_length=128)
    client_secret_hash = StringField(required=True)
    client_name = StringField(required=True, max_length=255)
    client_logo_url = StringField()
    redirect_uris = ListField(StringField(), required=True)
    allowed_scopes = ListField(StringField(), default=list)
    response_types = ListField(StringField(), default=lambda: ["code"])
    grant_types = ListField(
        StringField(), default=lambda: ["authorization_code", "refresh_token"]
    )
    token_endpoint_auth_method = StringField(
        default="client_secret_basic",
        choices=["client_secret_basic", "client_secret_post"],
    )
    is_first_party = BooleanField(default=False)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    created_by = StringField()
    updated_at = DateTimeField(default=datetime.datetime.utcnow)

    def verify_secret(self, plaintext: str) -> bool:
        if not plaintext or not self.client_secret_hash:
            return False
        try:
            return bcrypt.checkpw(
                plaintext.encode("utf-8"), self.client_secret_hash.encode("utf-8")
            )
        except ValueError:
            return False

    def get_client_id(self):
        return self.client_id

    def get_default_redirect_uri(self):
        return self.redirect_uris[0] if self.redirect_uris else None

    def get_allowed_scope(self, scope):
        if not scope:
            return ""
        requested = set(scope.split())
        allowed = set(self.allowed_scopes or [])
        return " ".join(s for s in scope.split() if s in allowed or not allowed)

    def check_redirect_uri(self, redirect_uri):
        return redirect_uri in (self.redirect_uris or [])

    def check_client_secret(self, client_secret):
        return self.verify_secret(client_secret)

    def check_endpoint_auth_method(self, method, endpoint):
        if endpoint == "token":
            return self.token_endpoint_auth_method == method
        return True

    def check_response_type(self, response_type):
        return response_type in (self.response_types or [])

    def check_grant_type(self, grant_type):
        return grant_type in (self.grant_types or [])
