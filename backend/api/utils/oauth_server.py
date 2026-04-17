import datetime
import hashlib
import os
import secrets

from authlib.integrations.flask_oauth2 import AuthorizationServer, ResourceProtector
from authlib.oauth2.rfc6749 import grants as _grants
from authlib.oauth2.rfc6750 import BearerTokenGenerator, BearerTokenValidator
from authlib.oauth2.rfc7009 import RevocationEndpoint
from authlib.oauth2.rfc7636 import CodeChallenge
from authlib.oidc.core import UserInfo
from authlib.oidc.core import grants as _oidc_grants

from api.models import (
    OAuthClient,
    OAuthAuthorizationCode,
    OAuthAccessToken,
    OAuthRefreshToken,
)
from api.utils.oauth_whitelist import user_is_whitelisted
from api.utils.oidc_keys import private_pem_bytes


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def issuer() -> str:
    return os.environ.get("OAUTH_ISSUER", "http://localhost:8000")


class MenteeAuthorizationCodeGrant(_grants.AuthorizationCodeGrant):
    TOKEN_ENDPOINT_AUTH_METHODS = [
        "client_secret_basic",
        "client_secret_post",
    ]
    RESPONSE_TYPES = {"code"}
    GRANT_TYPE = "authorization_code"

    def save_authorization_code(self, code, request):
        client = request.client
        user = request.user
        user_id = str(getattr(user, "id", user))
        scope = request.scope or ""
        nonce = request.data.get("nonce")
        code_challenge = request.data.get("code_challenge")
        code_challenge_method = request.data.get("code_challenge_method") or "S256"
        redirect_uri = request.redirect_uri or client.get_default_redirect_uri()
        now = datetime.datetime.utcnow()
        doc = OAuthAuthorizationCode(
            code=code,
            client_id=client.client_id,
            user_id=user_id,
            redirect_uri=redirect_uri,
            scope=scope,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            nonce=nonce,
            created_at=now,
            expires_at=now + datetime.timedelta(minutes=10),
        )
        doc.save()
        return code

    def query_authorization_code(self, code, client):
        row = OAuthAuthorizationCode.objects(
            code=code, client_id=client.client_id
        ).first()
        if not row:
            return None
        if row.used_at is not None:
            _revoke_chain_for_code(code)
            return None
        if row.is_expired():
            return None
        return row

    def delete_authorization_code(self, authorization_code):
        authorization_code.used_at = datetime.datetime.utcnow()
        authorization_code.save()

    def authenticate_user(self, authorization_code):
        from api.models import Users

        user = Users.objects(id=authorization_code.user_id).first()
        # Re-check the whitelist at token-exchange time: the admin may have
        # de-whitelisted or deactivated the client after the code was issued.
        # Returning None maps to Authlib's invalid_grant error.
        client = OAuthClient.objects(
            client_id=authorization_code.client_id, is_active=True
        ).first()
        if not client:
            return None
        if not user_is_whitelisted(client, user):
            return None
        # TODO(oauth-whitelist): MenteeRefreshTokenGrant is not yet registered
        # (see backend/docs/oauth/operations.md). When it lands, its
        # authenticate_user must perform the same whitelist + is_active check
        # so refresh flows can't outlive a tightened whitelist.
        return user


def _revoke_chain_for_code(code: str):
    OAuthAccessToken.objects(
        parent_refresh_token_id=f"code:{code}", revoked=False
    ).update(set__revoked=True)
    OAuthRefreshToken.objects(rotated_from=f"code:{code}", revoked=False).update(
        set__revoked=True
    )


class MenteeOpenIDCode(_oidc_grants.OpenIDCode):
    def __init__(self, require_nonce=False):
        super().__init__(require_nonce=require_nonce)

    def exists_nonce(self, nonce, request):
        if not nonce:
            return False
        return bool(
            OAuthAuthorizationCode.objects(
                client_id=request.client_id, nonce=nonce
            ).first()
        )

    def get_jwt_config(self, grant):
        return {
            "key": private_pem_bytes(),
            "alg": "RS256",
            "iss": issuer(),
            "exp": 3600,
        }

    def generate_user_info(self, user, scope):
        scopes = set((scope or "").split())
        claims = {"sub": str(user.id)}
        if "email" in scopes and getattr(user, "email", None):
            claims["email"] = user.email
            claims["email_verified"] = bool(getattr(user, "verified", False))
        return UserInfo(claims)


def _query_client(client_id):
    return OAuthClient.objects(client_id=client_id, is_active=True).first()


def _save_token(token_data, request):
    client = request.client
    user = request.user
    user_id = str(getattr(user, "id", user))
    scope = token_data.get("scope") or request.scope or ""
    now = datetime.datetime.utcnow()

    code_hint = getattr(request, "_mentee_auth_code", None)
    if not code_hint:
        try:
            code_hint = request.data.get("code")
        except Exception:
            code_hint = None

    access_plain = token_data.get("access_token")
    refresh_plain = token_data.get("refresh_token")
    expires_in = int(token_data.get("expires_in") or 3600)

    if access_plain:
        OAuthAccessToken(
            token_hash=sha256_hex(access_plain),
            client_id=client.client_id,
            user_id=user_id,
            scope=scope,
            parent_refresh_token_id=(f"code:{code_hint}" if code_hint else None),
            created_at=now,
            expires_at=now + datetime.timedelta(seconds=expires_in),
        ).save()

    if refresh_plain:
        OAuthRefreshToken(
            token_hash=sha256_hex(refresh_plain),
            client_id=client.client_id,
            user_id=user_id,
            scope=scope,
            rotated_from=(f"code:{code_hint}" if code_hint else None),
            created_at=now,
            expires_at=now + datetime.timedelta(days=30),
        ).save()


class MenteeBearerTokenValidator(BearerTokenValidator):
    def authenticate_token(self, token_string):
        if not token_string:
            return None
        return OAuthAccessToken.objects(token_hash=sha256_hex(token_string)).first()


class MenteeRevocationEndpoint(RevocationEndpoint):
    CLIENT_AUTH_METHODS = ["client_secret_basic", "client_secret_post"]

    def query_token(self, token_string, token_type_hint):
        th = sha256_hex(token_string)
        if token_type_hint == "access_token":
            return OAuthAccessToken.objects(token_hash=th).first()
        if token_type_hint == "refresh_token":
            return OAuthRefreshToken.objects(token_hash=th).first()
        return (
            OAuthRefreshToken.objects(token_hash=th).first()
            or OAuthAccessToken.objects(token_hash=th).first()
        )

    def revoke_token(self, token, request):
        if token is None:
            return
        token.revoked = True
        token.save()
        if isinstance(token, OAuthRefreshToken):
            OAuthAccessToken.objects(
                parent_refresh_token_id=str(token.id), revoked=False
            ).update(set__revoked=True)


class S256OnlyCodeChallenge(CodeChallenge):
    # The base class silently accepts requests that omit both the challenge
    # and the method, leaving PKCE effectively optional. Reject any request
    # without a challenge; restricting SUPPORTED_CODE_CHALLENGE_METHOD to
    # ["S256"] makes the parent reject any other method.

    DEFAULT_CODE_CHALLENGE_METHOD = "S256"
    SUPPORTED_CODE_CHALLENGE_METHOD = ["S256"]

    def validate_code_challenge(self, grant):
        from authlib.oauth2.rfc6749.errors import InvalidRequestError

        challenge = grant.request.data.get("code_challenge")
        if self.required and not challenge:
            raise InvalidRequestError("Missing 'code_challenge'")
        super().validate_code_challenge(grant)


authorization = AuthorizationServer(
    query_client=_query_client,
    save_token=_save_token,
)

require_oauth = ResourceProtector()
require_oauth.register_token_validator(MenteeBearerTokenValidator())


def _access_token_string():
    return secrets.token_urlsafe(32)


def _refresh_token_string():
    return secrets.token_urlsafe(48)


def _token_expires_in(client, grant_type):
    return 3600


def init_authorization_server(app):
    authorization.init_app(app)
    authorization.register_grant(
        MenteeAuthorizationCodeGrant,
        [S256OnlyCodeChallenge(required=True), MenteeOpenIDCode(require_nonce=False)],
    )
    authorization.register_endpoint(MenteeRevocationEndpoint)

    bearer_generator = BearerTokenGenerator(
        access_token_generator=lambda *a, **kw: _access_token_string(),
        refresh_token_generator=lambda *a, **kw: _refresh_token_string(),
        expires_generator=_token_expires_in,
    )
    authorization.register_token_generator("default", bearer_generator)
