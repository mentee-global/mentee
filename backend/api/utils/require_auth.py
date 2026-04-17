from functools import wraps
from flask import request
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
