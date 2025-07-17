from functools import wraps
from flask import request
from firebase_admin import auth as firebase_admin_auth
try:
    from firebase_admin.auth import InvalidIdTokenError, ExpiredIdTokenError, RevokedIdTokenError
except ImportError:
    
    InvalidIdTokenError = Exception
    ExpiredIdTokenError = Exception
    RevokedIdTokenError = Exception

try:
    from firebase_admin.exceptions import InvalidArgumentError
except ImportError:
    
    InvalidArgumentError = Exception

from api.core import create_response, logger
from api.utils.constants import Account
from api.utils.token_security import token_manager, extract_token_id, validate_token_security

AUTHORIZED = True
UNAUTHORIZED = False
ALL_USERS = True


def verify_user(required_role, allow_support_bypass=False):
   
    headers = request.headers
    role = None
    user_id = None

    
    token = headers.get("Authorization")
    if not token:
        msg = "Missing authorization token"
        logger.warning(f"Authentication failed: {msg}")
        return UNAUTHORIZED, create_response(status=401, message=msg)

    
    if token.startswith('Bearer '):
        token = token[7:]

    try:
       
        claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)
        role = claims.get("role")
        user_id = claims.get("uid")
        
        
        is_valid, error_msg = validate_token_security(claims)
        if not is_valid:
            logger.warning(f"Token security validation failed for user {user_id}: {error_msg}")
            return UNAUTHORIZED, create_response(status=401, message="Token validation failed")
        
        
        token_id = extract_token_id(claims)
        if token_manager.is_token_revoked(token_id):
            msg = "Token has been revoked"
            logger.warning(f"Authentication failed for user {user_id}: {msg}")
            return UNAUTHORIZED, create_response(status=401, message=msg)
        
        
        if user_id:
            token_manager.register_token(token_id, user_id)
        
        
        if role is None:
            msg = "User role not found in token claims"
            logger.warning(f"Authorization failed for user {user_id}: {msg}")
            return UNAUTHORIZED, create_response(status=403, message=msg)
            
    except ExpiredIdTokenError:
        msg = "Token has expired"
        logger.warning(f"Authentication failed: {msg}")
        return UNAUTHORIZED, create_response(status=401, message=msg)
    except RevokedIdTokenError:
        msg = "Token has been revoked"
        logger.warning(f"Authentication failed: {msg}")
        return UNAUTHORIZED, create_response(status=401, message=msg)
    except InvalidArgumentError:
        msg = "Invalid token format"
        logger.warning(f"Authentication failed: {msg}")
        return UNAUTHORIZED, create_response(status=401, message=msg)
    except Exception as e:
        msg = "Invalid or missing JWT token"
        logger.warning(f"Authentication failed: {msg}. Error: {str(e)}")
        return UNAUTHORIZED, create_response(status=401, message=msg)

   
    try:
        user_role = int(role)
    except (ValueError, TypeError):
        msg = "Invalid role format in token"
        logger.warning(f"Authorization failed for user {user_id}: {msg}")
        return UNAUTHORIZED, create_response(status=403, message=msg)

    
    if required_role == ALL_USERS:
        return AUTHORIZED, None
    
   
    if user_role == required_role:
        return AUTHORIZED, None
    
   
    if allow_support_bypass and user_role == Account.SUPPORT:
        logger.info(f"SUPPORT user {user_id} accessing resource with role bypass")
        return AUTHORIZED, None
    
   
    if user_role == Account.ADMIN:
        return AUTHORIZED, None
    
    
    msg = "Insufficient permissions to access this resource"
    logger.warning(f"Authorization failed for user {user_id}: role {user_role} insufficient for required role {required_role}")
    return UNAUTHORIZED, create_response(status=403, message=msg)


def admin_only(fn):
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.ADMIN, allow_support_bypass=False)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def mentee_only(fn):
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.MENTEE, allow_support_bypass=False)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def mentor_only(fn):
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.MENTOR, allow_support_bypass=False)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def partner_only(fn):
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.PARTNER, allow_support_bypass=False)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def support_only(fn):
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.SUPPORT, allow_support_bypass=False)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def moderator_only(fn):
    
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(Account.MODERATOR, allow_support_bypass=False)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def all_users(fn):
   
    @wraps(fn)
    def wrapper(*args, **kwargs):
        authorized, response = verify_user(ALL_USERS, allow_support_bypass=False)

        if authorized:
            return fn(*args, **kwargs)
        else:
            return response

    return wrapper


def require_role(required_role, allow_support_bypass=True):

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            authorized, response = verify_user(required_role, allow_support_bypass)

            if authorized:
                return fn(*args, **kwargs)
            else:
                return response

        return wrapper
    return decorator
