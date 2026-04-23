import datetime
import os
import secrets
import time
from urllib.parse import quote_plus, urlencode

from flask import Blueprint, current_app, jsonify, request, redirect, session
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from api.core import logger
from api.models import Users, OAuthClient, OAuthConsent, MentorProfile, MenteeProfile
from api.models import PartnerProfile
from api.utils.oauth_server import (
    authorization,
    issuer,
    require_oauth,
)
from api.utils.oauth_whitelist import user_is_whitelisted
from api.utils.oidc_keys import public_jwks

oauth_bp = Blueprint("oauth", __name__)
wellknown_bp = Blueprint("wellknown", __name__)


ROLE_NAMES = {
    0: "admin",
    1: "mentor",
    2: "mentee",
    3: "partner",
    4: "guest",
    5: "support",
    6: "hub",
    7: "moderator",
}


# Advisory-only hint sent by sibling OAuth clients so Mentee can route
# unauthenticated users to the matching role-scoped login form instead of
# the generic /login. Keep these paths in sync with the routes registered
# in frontend/src/app/App.js. `hub` is intentionally omitted — hub users
# sign in through a path-prefixed flow (REDIRECTS[ACCOUNT_TYPE.HUB]) with
# no standalone landing route; add it here only alongside a matching
# frontend PublicRoute.
_LOGIN_ROLE_TO_PATH = {
    "admin": "/admin",
    "support": "/support",
    "moderator": "/moderator",
    "mentor": "/mentor/login",
    "mentee": "/mentee/login",
    "partner": "/partner/login",
}


# Best-effort in-process replay set for authorize_token jtis. Multi-dyno setups
# get one chance per dyno; the 5-min TTL + user_id binding keeps the window
# narrow. Swap to Redis or a TTL Mongo collection if that ever becomes a real
# attack surface.
_AUTHORIZE_JTI_SEEN: dict = {}
_AUTHORIZE_TOKEN_TTL_SECONDS = 300
_AUTHORIZE_TOKEN_SALT = "oauth-authorize-v1"


def _frontend_url() -> str:
    return os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")


def _authorize_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"], salt=_AUTHORIZE_TOKEN_SALT
    )


def _gc_jti_seen():
    cutoff = time.time() - (_AUTHORIZE_TOKEN_TTL_SECONDS + 60)
    expired = [k for k, v in _AUTHORIZE_JTI_SEEN.items() if v < cutoff]
    for k in expired:
        _AUTHORIZE_JTI_SEEN.pop(k, None)


def _mark_jti_seen(jti: str) -> bool:
    _gc_jti_seen()
    if jti in _AUTHORIZE_JTI_SEEN:
        return False
    _AUTHORIZE_JTI_SEEN[jti] = time.time()
    return True


def _mint_authorize_token(client, scopes, user_id) -> str:
    payload = {
        "client_id": client.client_id,
        "redirect_uri": request.args.get("redirect_uri")
        or client.get_default_redirect_uri(),
        "scope": " ".join(scopes),
        "state": request.args.get("state"),
        "response_type": request.args.get("response_type", "code"),
        "code_challenge": request.args.get("code_challenge"),
        "code_challenge_method": request.args.get("code_challenge_method", "S256"),
        "nonce": request.args.get("nonce"),
        "user_id": str(user_id),
        "jti": secrets.token_urlsafe(16),
    }
    return _authorize_serializer().dumps(payload)


def _load_authorize_token(token: str):
    if not token:
        return None, "missing_token"
    try:
        payload = _authorize_serializer().loads(
            token, max_age=_AUTHORIZE_TOKEN_TTL_SECONDS
        )
    except SignatureExpired:
        return None, "expired_token"
    except BadSignature:
        return None, "invalid_token"
    return payload, None


@wellknown_bp.route("/.well-known/openid-configuration", methods=["GET"])
def openid_configuration():
    iss = issuer()
    return jsonify(
        {
            "issuer": iss,
            "authorization_endpoint": f"{iss}/oauth/authorize",
            "token_endpoint": f"{iss}/oauth/token",
            "userinfo_endpoint": f"{iss}/oauth/userinfo",
            "revocation_endpoint": f"{iss}/oauth/revoke",
            "jwks_uri": f"{iss}/.well-known/jwks.json",
            "response_types_supported": ["code"],
            "grant_types_supported": ["authorization_code", "refresh_token"],
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": ["RS256"],
            "token_endpoint_auth_methods_supported": [
                "client_secret_basic",
                "client_secret_post",
            ],
            "code_challenge_methods_supported": ["S256"],
            "scopes_supported": [
                "openid",
                "email",
                "profile",
                "mentee.role",
                "mentee.api.profile.read",
            ],
            "claims_supported": [
                "sub",
                "email",
                "email_verified",
                "name",
                "picture",
                "preferred_language",
                "timezone",
                "role",
                "role_id",
                "nonce",
                "iss",
                "aud",
                "exp",
                "iat",
            ],
        }
    )


@wellknown_bp.route("/.well-known/jwks.json", methods=["GET"])
def jwks():
    return jsonify(public_jwks())


def _current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return Users.objects(id=uid).first()


def _resolve_user_display(user_doc):
    profile = _resolve_profile(user_doc)
    name = None
    if profile is not None:
        name = getattr(profile, "name", None) or getattr(profile, "person_name", None)
    return name or (user_doc.email.split("@")[0] if user_doc.email else "")


def _resolve_user_picture(user_doc):
    profile = _resolve_profile(user_doc)
    if profile is None:
        return None
    return _picture_url(getattr(profile, "image", None))


def _redirect_error_to_client(client, error, description, state):
    redirect_uri = request.args.get("redirect_uri")
    if not redirect_uri or not client or not client.check_redirect_uri(redirect_uri):
        return None
    sep = "&" if "?" in redirect_uri else "?"
    loc = (
        f"{redirect_uri}{sep}error={quote_plus(error)}"
        f"&error_description={quote_plus(description)}"
    )
    if state:
        loc += f"&state={quote_plus(state)}"
    return redirect(loc)


@oauth_bp.route("/authorize", methods=["GET"])
def authorize():
    if not session.get("user_id"):
        hint = (request.args.get("mentee_login_role") or "").lower()
        login_path = _LOGIN_ROLE_TO_PATH.get(hint, "/login")
        return redirect(
            f"{_frontend_url()}{login_path}?next={quote_plus(request.full_path)}"
        )

    try:
        grant = authorization.get_consent_grant(end_user=_current_user())
    except Exception as e:
        error = getattr(e, "error", None) or "invalid_request"
        description = getattr(e, "description", None) or str(e)
        status = getattr(e, "status_code", 400) or 400

        # Security-critical pre-redirect failures (bad client, bad redirect_uri,
        # PKCE problems) must return JSON rather than redirecting, so we never
        # hand error details to an attacker-controlled redirect_uri.
        pkce_error = "code_challenge" in (description or "") or "code_verifier" in (
            description or ""
        )
        if error in ("invalid_client",) or pkce_error:
            return jsonify({"error": error, "error_description": description}), 400

        redirect_uri = request.args.get("redirect_uri")
        client_id = request.args.get("client_id")
        if redirect_uri and client_id:
            client = OAuthClient.objects(client_id=client_id, is_active=True).first()
            err_redirect = _redirect_error_to_client(
                client, error, description, request.args.get("state")
            )
            if err_redirect is not None:
                return err_redirect
        return jsonify({"error": error, "error_description": description}), status

    client = grant.client
    # Dedupe while preserving first-occurrence order. OAuth 2.0 scopes are
    # case-sensitive (RFC 6749 §3.3), so no lowercasing — but a client that
    # requests "openid openid email" shouldn't inflate the signed authorize
    # token or the stored consent.
    _seen = set()
    scopes = [
        s
        for s in (grant.request.scope or "").split()
        if not (s in _seen or _seen.add(s))
    ]
    user_id = session["user_id"]

    # Whitelist gate: must run BEFORE first-party auto-consent so first-party
    # clients still honor per-client access restrictions.
    current_user = _current_user()
    if not user_is_whitelisted(client, current_user):
        logger.info(
            "oauth.whitelist_denied client_id=%s user_id=%s",
            client.client_id,
            user_id,
        )
        err_redirect = _redirect_error_to_client(
            client,
            "access_denied",
            "user not permitted to authorize this client",
            request.args.get("state"),
        )
        if err_redirect is not None:
            return err_redirect
        return (
            jsonify(
                {
                    "error": "access_denied",
                    "error_description": "user not permitted to authorize this client",
                }
            ),
            403,
        )

    allowed = set(client.allowed_scopes or [])
    unknown = [s for s in scopes if s not in allowed]
    if unknown:
        return (
            jsonify(
                {
                    "error": "invalid_scope",
                    "error_description": (
                        "Scope(s) not registered for this client: "
                        + " ".join(sorted(unknown))
                    ),
                }
            ),
            400,
        )

    consent = OAuthConsent.objects(
        user_id=user_id, client_id=client.client_id, revoked_at=None
    ).first()
    already_consented = bool(
        consent and set(scopes).issubset(set(consent.granted_scopes or []))
    )

    if already_consented:
        return authorization.create_authorization_response(grant_user=_current_user())

    # First-party clients are owned by Mentee and trusted implicitly, so
    # we skip the interactive consent prompt and auto-persist the grant.
    # Admins must only flag `is_first_party=true` on clients Mentee itself
    # ships — never on third-party integrations.
    if client.is_first_party:
        _persist_consent(user_id, client.client_id, scopes)
        logger.info(
            "oauth.consent_granted client_id=%s user_id=%s scopes=%s first_party=true",
            client.client_id,
            user_id,
            " ".join(scopes),
        )
        return authorization.create_authorization_response(grant_user=_current_user())

    authorize_token = _mint_authorize_token(client, scopes, user_id)
    return redirect(
        f"{_frontend_url()}/oauth/consent?authorize_token={quote_plus(authorize_token)}"
    )


@oauth_bp.route("/authorize", methods=["POST"])
def authorize_decision():
    if not session.get("user_id"):
        return jsonify({"error": "login_required"}), 401

    token = request.form.get("authorize_token")
    decision = (request.form.get("decision") or "").lower()
    payload, err = _load_authorize_token(token)
    if err:
        return jsonify({"error": err}), 400

    if payload.get("user_id") != session.get("user_id"):
        return jsonify({"error": "user_mismatch"}), 400

    if not _mark_jti_seen(payload.get("jti", "")):
        return jsonify({"error": "replayed_token"}), 400

    client = OAuthClient.objects(client_id=payload["client_id"], is_active=True).first()
    if not client:
        return jsonify({"error": "invalid_client"}), 400

    redirect_uri = payload.get("redirect_uri")
    if not redirect_uri or not client.check_redirect_uri(redirect_uri):
        return jsonify({"error": "invalid_redirect_uri"}), 400

    scopes = (payload.get("scope") or "").split()
    state = payload.get("state")

    # Defense in depth: re-check whitelist on POST in case the admin tightened
    # it while the user was on the consent screen.
    if not user_is_whitelisted(client, _current_user()):
        logger.info(
            "oauth.whitelist_denied_on_decision client_id=%s user_id=%s",
            client.client_id,
            session["user_id"],
        )
        sep = "&" if "?" in redirect_uri else "?"
        loc = f"{redirect_uri}{sep}error=access_denied"
        if state:
            loc += f"&state={quote_plus(state)}"
        return redirect(loc)

    if decision == "approve":
        _persist_consent(session["user_id"], client.client_id, scopes)
        logger.info(
            "oauth.consent_granted client_id=%s user_id=%s scopes=%s first_party=false",
            client.client_id,
            session["user_id"],
            " ".join(scopes),
        )
    else:
        logger.info(
            "oauth.consent_denied client_id=%s user_id=%s",
            client.client_id,
            session["user_id"],
        )
        sep = "&" if "?" in redirect_uri else "?"
        loc = f"{redirect_uri}{sep}error=access_denied"
        if state:
            loc += f"&state={quote_plus(state)}"
        return redirect(loc)

    # Replay the original /oauth/authorize GET so Authlib's grant pipeline picks
    # up the consent we just persisted and issues the code.
    params = {
        "client_id": payload["client_id"],
        "redirect_uri": redirect_uri,
        "response_type": payload.get("response_type", "code"),
        "scope": " ".join(scopes),
        "code_challenge": payload.get("code_challenge"),
        "code_challenge_method": payload.get("code_challenge_method", "S256"),
    }
    if state:
        params["state"] = state
    if payload.get("nonce"):
        params["nonce"] = payload["nonce"]
    qs = urlencode({k: v for k, v in params.items() if v is not None})
    return redirect(f"/oauth/authorize?{qs}", code=303)


@oauth_bp.route("/consent-request", methods=["GET"])
def consent_request():
    if not session.get("user_id"):
        return jsonify({"error": "login_required"}), 401

    token = request.args.get("authorize_token")
    payload, err = _load_authorize_token(token)
    if err:
        return jsonify({"error": err}), 400

    if payload.get("user_id") != session.get("user_id"):
        return jsonify({"error": "user_mismatch"}), 400

    client = OAuthClient.objects(client_id=payload["client_id"], is_active=True).first()
    if not client:
        return jsonify({"error": "invalid_client"}), 400

    user_doc = _current_user()
    if not user_doc:
        return jsonify({"error": "login_required"}), 401

    if not user_is_whitelisted(client, user_doc):
        return jsonify({"error": "access_denied"}), 403

    return jsonify(
        {
            "result": {
                "client_name": client.client_name,
                "client_logo_url": client.client_logo_url,
                "is_first_party": bool(client.is_first_party),
                "scopes": (payload.get("scope") or "").split(),
                "user": {
                    "name": _resolve_user_display(user_doc),
                    "email": user_doc.email,
                    "picture": _resolve_user_picture(user_doc),
                },
            }
        }
    )


def _persist_consent(user_id, client_id, scopes):
    # Atomic upsert avoids a check-then-insert race: two concurrent /authorize
    # requests for the same (user, client) can't trip the unique index or
    # clobber each other's scope list. MongoEngine's add_to_set with a list
    # compiles to $addToSet + $each, so scopes are unioned — re-granting a
    # subset never drops previously granted scopes. unset__revoked_at
    # re-activates a previously revoked consent.
    unique_scopes = sorted(set(scopes or []))
    OAuthConsent.objects(user_id=user_id, client_id=client_id).update_one(
        add_to_set__granted_scopes=unique_scopes,
        set__granted_at=datetime.datetime.utcnow(),
        unset__revoked_at=1,
        upsert=True,
    )


@oauth_bp.route("/token", methods=["POST"])
def issue_token():
    return authorization.create_token_response()


def _resolve_profile(user_doc):
    try:
        role = int(user_doc.role)
    except (TypeError, ValueError):
        return None
    if role == 1:
        return MentorProfile.objects(firebase_uid=user_doc.firebase_uid).first()
    if role == 2:
        return MenteeProfile.objects(firebase_uid=user_doc.firebase_uid).first()
    if role == 3:
        return PartnerProfile.objects(firebase_uid=user_doc.firebase_uid).first()
    return None


def _picture_url(image):
    if not image:
        return None
    for attr in ("url", "imageUrl", "image_url"):
        val = getattr(image, attr, None)
        if val:
            return val
    return None


@oauth_bp.route("/userinfo", methods=["GET", "POST"])
@require_oauth("openid")
def userinfo():
    from authlib.integrations.flask_oauth2 import current_token

    user_id = current_token.user_id
    scopes = set((current_token.scope or "").split())

    user_doc = Users.objects(id=user_id).first()
    if not user_doc:
        # RFC 6750 §3: a bearer error response must include WWW-Authenticate.
        # Authlib sets this automatically via InvalidTokenError; mirror that
        # here so clients that only inspect the header see a consistent
        # failure mode even on this (rare) user-deleted-after-issuance edge.
        resp = jsonify({"error": "invalid_token"})
        resp.status_code = 401
        resp.headers["WWW-Authenticate"] = (
            'Bearer error="invalid_token", '
            'error_description="The access token is invalid"'
        )
        return resp

    claims = {"sub": str(user_doc.id)}
    if "email" in scopes:
        claims["email"] = user_doc.email
        claims["email_verified"] = bool(getattr(user_doc, "verified", False))

    if "profile" in scopes:
        profile = _resolve_profile(user_doc)
        if profile:
            name = getattr(profile, "name", None) or getattr(
                profile, "person_name", None
            )
            if name:
                claims["name"] = name
            picture = _picture_url(getattr(profile, "image", None))
            if picture:
                claims["picture"] = picture
            lang = getattr(profile, "preferred_language", None)
            if lang:
                claims["preferred_language"] = lang
            tz = getattr(profile, "timezone", None)
            if tz:
                claims["timezone"] = tz

    if "mentee.role" in scopes:
        try:
            role_id = int(user_doc.role)
            claims["role"] = ROLE_NAMES.get(role_id, str(role_id))
            claims["role_id"] = role_id
        except (TypeError, ValueError):
            pass

    return jsonify(claims)


@oauth_bp.route("/profile", methods=["GET"])
@require_oauth("mentee.api.profile.read")
def profile():
    from authlib.integrations.flask_oauth2 import current_token
    from api.utils.oauth_profile import assemble_profile_dto, ProfileNotFound

    try:
        data = assemble_profile_dto(current_token.user_id)
    except ProfileNotFound:
        return jsonify({"error": "profile_not_found"}), 404
    return jsonify({"version": 1, "data": data}), 200


@oauth_bp.route("/revoke", methods=["POST"])
def revoke_token():
    from api.utils.oauth_server import MenteeRevocationEndpoint

    return authorization.create_endpoint_response(
        MenteeRevocationEndpoint.ENDPOINT_NAME
    )
