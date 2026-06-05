from functools import wraps
import time

from flask import request, g
from firebase_admin import auth as firebase_admin_auth
from api.core import create_response, logger
from api.utils.constants import Account

AUTHORIZED = True
UNAUTHORIZED = False
ALL_USERS = True

# Roles that may act across any hub (no per-hub ownership restriction).
STAFF_ROLES = {Account.ADMIN.value, Account.SUPPORT.value}

# Sentinel returned by caller_hub_id() for staff callers (= "all hubs").
STAFF_ALL = object()


def _safe_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _extract_authorization_token(headers):
    auth_header = headers.get("Authorization")
    if not auth_header:
        return None

    auth_header = auth_header.strip()
    if auth_header.lower().startswith("bearer "):
        auth_header = auth_header[7:].strip()

    return auth_header or None


def verify_token_with_expiry(token):
    claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)

    now = time.time()
    token_iat = _safe_float(claims.get("iat"))
    token_exp = _safe_float(claims.get("exp"))

    if token_iat is not None and token_iat > now + 60.0:
        raise ValueError("Token used before issued time")
    if token_exp is None or now > token_exp + 60.0:
        raise ValueError("Token has expired")

    return claims


def verify_user(required_role):
    headers = request.headers
    role = None

    token = _extract_authorization_token(headers)
    if not token:
        return UNAUTHORIZED, create_response(
            status=401, message="Missing Authorization header"
        )
    try:
        claims = verify_token_with_expiry(token)
        role = claims.get("role")
    except Exception as e:
        # A bad/expired/revoked token is a client auth failure, not a server
        # fault. Returning 401 lets clients trigger their refresh-and-retry
        # flow instead of showing a red-alert 500.
        logger.info(f"Rejected auth: {e}")
        return UNAUTHORIZED, create_response(status=401, message="Invalid token")

    # Expose the verified claims (uid, role, ...) to the request so views can
    # derive the caller's identity for per-record authorization without
    # re-verifying the token or trusting client-supplied ids.
    g.auth_claims = claims

    if (
        required_role == ALL_USERS
        or int(role) == required_role
        or int(role) == Account.SUPPORT
    ):
        return AUTHORIZED, None
    else:
        msg = "Unauthorized"
        logger.info(msg)
        return UNAUTHORIZED, create_response(status=401, message=msg)


def get_optional_claims():
    """Decode the Firebase token if one is present, without rejecting anonymous
    callers. Returns the verified claims dict (uid, role, ...) when a valid token
    is supplied, otherwise None. Use this on endpoints that must serve both
    anonymous and authenticated callers but want to tailor the response (e.g.
    return full vs sanitized data) based on the caller's role.
    """
    token = _extract_authorization_token(request.headers)
    if not token:
        return None
    try:
        claims = verify_token_with_expiry(token)
    except Exception as e:
        logger.info(f"Ignoring invalid optional auth: {e}")
        return None
    g.auth_claims = claims
    return claims


def caller_hub_id():
    """Resolve which hub the authenticated caller belongs to, from the verified
    claims on `g` (set by verify_user / get_optional_claims). The caller's
    profile is looked up by firebase_uid, so a caller can never assert a hub
    they don't own by passing ids in the request.

    Returns:
      - STAFF_ALL for admin/support (allowed across all hubs),
      - the hub id (str) for a hub account or a partner attached to a hub,
      - None if unauthenticated or not associated with a hub.
    """
    claims = getattr(g, "auth_claims", None) or {}
    try:
        role = int(claims.get("role"))
    except (TypeError, ValueError):
        return None
    if role in STAFF_ROLES:
        return STAFF_ALL
    uid = claims.get("uid")
    if not uid:
        return None
    # Lazy import to avoid any import-order coupling with the models package.
    from api.models import Hub, PartnerProfile

    # A hub OWNER logs in with role HUB and has a Hub record. A hub MEMBER also
    # logs in with role HUB (the login form sends role=6) but is actually a
    # PartnerProfile attached to the hub — so fall back to that.
    if role == Account.HUB.value:
        hub = Hub.objects(firebase_uid=uid).only("id").first()
        if hub:
            return str(hub.id)
        partner = PartnerProfile.objects(firebase_uid=uid).only("hub_id").first()
        return partner.hub_id if partner and partner.hub_id else None
    if role == Account.PARTNER.value:
        partner = PartnerProfile.objects(firebase_uid=uid).only("hub_id").first()
        return partner.hub_id if partner and partner.hub_id else None
    return None


def hub_access_error(hub_id):
    """Return a 403 response unless the caller is staff or belongs to hub_id.
    Returns None when access is allowed. Requires g.auth_claims to be set (use
    on endpoints decorated with @all_users / after get_optional_claims())."""
    caller = caller_hub_id()
    if caller is STAFF_ALL:
        return None
    if caller is not None and hub_id is not None and str(caller) == str(hub_id):
        return None
    logger.info("Hub ownership check failed")
    return create_response(status=403, message="Forbidden")


def admin_only(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.ADMIN)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def mentee_only(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.MENTEE)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def mentor_only(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.MENTOR)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def partner_only(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.PARTNER)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def all_users(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(ALL_USERS)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper
