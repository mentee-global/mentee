from functools import wraps
from flask import request, g
from firebase_admin import auth as firebase_admin_auth
from api.core import create_response, logger
from api.utils.constants import Account

AUTHORIZED = True
UNAUTHORIZED = False
ALL_USERS = True


def verify_user(required_role):
    headers = request.headers
    role = None

    token = headers.get("Authorization")
    if not token:
        return UNAUTHORIZED, create_response(
            status=401, message="Missing Authorization header"
        )
    try:
        claims = firebase_admin_auth.verify_id_token(token)
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
    token = request.headers.get("Authorization")
    if not token:
        return None
    try:
        claims = firebase_admin_auth.verify_id_token(token)
    except Exception as e:
        logger.info(f"Ignoring invalid optional auth: {e}")
        return None
    g.auth_claims = claims
    return claims


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
