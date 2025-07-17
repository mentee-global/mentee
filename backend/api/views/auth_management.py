
from flask import Blueprint, request
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
from api.utils.require_auth import all_users, admin_only, verify_user, ALL_USERS
from api.utils.token_security import token_manager, extract_token_id
from api.utils.constants import Account

auth_bp = Blueprint("auth_management", __name__, url_prefix="/auth")


@auth_bp.route("/logout", methods=["POST"])
@all_users
def logout():
    
    try:
        
        token = request.headers.get("Authorization")
        if not token:
            return create_response(status=400, message="Missing authorization token")
        
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        
        claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)
        user_id = claims.get("uid")
        token_id = extract_token_id(claims)
        
        
        token_manager.revoke_token(token_id, user_id)
        
        logger.info(f"User {user_id} logged out successfully")
        return create_response(message="Logged out successfully")
        
    except (ExpiredIdTokenError, RevokedIdTokenError, InvalidArgumentError):
        return create_response(status=401, message="Invalid token")
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return create_response(status=500, message="Logout failed")


@auth_bp.route("/logout-all", methods=["POST"])
@all_users
def logout_all_sessions():
    
    try:
        
        token = request.headers.get("Authorization")
        if not token:
            return create_response(status=400, message="Missing authorization token")
        
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        
        claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)
        user_id = claims.get("uid")
        
        
        revoked_count = token_manager.revoke_all_user_tokens(user_id)
        
        logger.info(f"User {user_id} logged out from all sessions ({revoked_count} tokens revoked)")
        return create_response(
            data={"revoked_tokens": revoked_count},
            message="Logged out from all sessions successfully"
        )
        
    except (ExpiredIdTokenError, RevokedIdTokenError, InvalidArgumentError):
        return create_response(status=401, message="Invalid token")
    except Exception as e:
        logger.error(f"Logout all sessions error: {str(e)}")
        return create_response(status=500, message="Logout failed")


@auth_bp.route("/revoke-user-tokens", methods=["POST"])
@admin_only
def admin_revoke_user_tokens():
 
    try:
        data = request.get_json()
        if not data or "user_id" not in data:
            return create_response(status=400, message="Missing user_id parameter")
        
        target_user_id = data["user_id"]
        if not target_user_id:
            return create_response(status=400, message="Invalid user_id parameter")
        
       
        revoked_count = token_manager.revoke_all_user_tokens(target_user_id)
        
        logger.info(f"Admin revoked {revoked_count} tokens for user {target_user_id}")
        return create_response(
            data={"user_id": target_user_id, "revoked_tokens": revoked_count},
            message=f"Successfully revoked {revoked_count} tokens for user"
        )
        
    except Exception as e:
        logger.error(f"Admin token revocation error: {str(e)}")
        return create_response(status=500, message="Token revocation failed")


@auth_bp.route("/validate-token", methods=["POST"])
@all_users
def validate_current_token():
    
    try:
        
        token = request.headers.get("Authorization")
        if not token:
            return create_response(status=400, message="Missing authorization token")
        
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        
        claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)
        user_id = claims.get("uid")
        role = claims.get("role")
        email = claims.get("email")
        
        return create_response(
            data={
                "user_id": user_id,
                "role": role,
                "email": email,
                "valid": True
            },
            message="Token is valid"
        )
        
    except ExpiredIdTokenError:
        return create_response(status=401, message="Token has expired")
    except RevokedIdTokenError:
        return create_response(status=401, message="Token has been revoked")
    except InvalidArgumentError:
        return create_response(status=401, message="Invalid token format")
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        return create_response(status=401, message="Token validation failed")


@auth_bp.route("/security-info", methods=["GET"])
@admin_only
def get_security_info():
   
    try:
        
        return create_response(
            data={
                "revoked_tokens_count": len(token_manager._revoked_tokens),
                "active_sessions_count": len(token_manager._user_sessions),
                "security_features": [
                    "Token revocation support",
                    "Session management",
                    "Role-based access control",
                    "Token expiration validation",
                    "Secure error responses"
                ]
            },
            message="Security information retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Security info error: {str(e)}")
        return create_response(status=500, message="Failed to retrieve security information")
