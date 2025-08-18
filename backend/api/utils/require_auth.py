from functools import wraps
from flask import request
from firebase_admin import auth as firebase_admin_auth
from api.core import create_response, logger
from api.utils.constants import Account
import time

AUTHORIZED = True
UNAUTHORIZED = False
ALL_USERS = True


def _safe_float(x, default=0.0):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


def verify_token_with_expiry(token):
    try:
        # Verify token (checks revocation)
        claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)

        now = time.time()  # float
        token_exp = _safe_float(claims.get("exp"), 0.0)
        token_iat = _safe_float(claims.get("iat"), 0.0)  # issued at

        # 60s skew tolerance for 'iat'
        if token_iat > now + 60.0:
            raise Exception("Token used too early - clock skew detected")

        if now >= token_exp:
            raise Exception("Token has expired")

        return claims

    except Exception as e:
        # Be lenient on skew in dev: retry without revocation check
        err = str(e)
        if "Token used too early" in err or "Clock skew" in err:
            try:
                claims = firebase_admin_auth.verify_id_token(token, check_revoked=False)
                now = time.time()
                token_exp = _safe_float(claims.get("exp"), 0.0)
                if now >= token_exp:
                    raise Exception("Token has expired")
                return claims
            except Exception:
                pass
        raise e


def verify_user(required_role):
    headers = request.headers
    role = None

    try:
        auth_header = headers.get("Authorization", "")
        token = (
            auth_header.split(" ", 1)[1]
            if auth_header.startswith("Bearer ")
            else auth_header
        )
        if not token:
            raise ValueError("Missing Authorization token")

        claims = verify_token_with_expiry(token)
        role = claims.get("role")
    except Exception as e:
        msg = "Invalid or missing authentication token"
        logger.info(msg)
        logger.info(e)
        return UNAUTHORIZED, create_response(status=401, message=msg)

    if required_role == ALL_USERS or int(role) == required_role:
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


def support_only(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.SUPPORT)

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
