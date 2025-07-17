
import logging
import time
from typing import Dict, Any, Optional, Callable
from functools import wraps
from flask import request, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from api.core import create_response

logger = logging.getLogger(__name__)

class RateLimitManager:
    
    
    def __init__(self, app=None):
        self.limiter = None
        self.app = app
        self.custom_limits = {}
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        
        self.app = app
        
        
        storage_uri = app.config.get('RATELIMIT_STORAGE_URL', 'memory://')
        
        
        self.limiter = Limiter(
            app,
            key_func=self.get_limiter_key,
            default_limits=self.get_default_limits(),
            storage_uri=storage_uri,
            headers_enabled=True,
            on_breach=self.rate_limit_handler,
            swallow_errors=True  
        )
        
        
        @app.errorhandler(429)
        def rate_limit_error(error):
            return self.rate_limit_handler(error)
        
        logger.info("Rate limiting initialized successfully")
    
    def get_limiter_key(self) -> str:
        
        try:
            from api.utils.require_auth import get_current_user_id
            user_id = get_current_user_id()
            if user_id:
                return f"user:{user_id}"
        except:
            pass
        
        
        return get_remote_address()
    
    def get_default_limits(self) -> list:
        
        environment = current_app.config.get('ENV', 'production')
        
        if environment == 'development':
            return [
                "1000 per day",
                "200 per hour",
                "50 per minute"
            ]
        elif environment == 'testing':
            return [
                "10000 per day",
                "1000 per hour"
            ]
        else:  
            return [
                "500 per day",
                "100 per hour",
                "20 per minute"
            ]
    
    def rate_limit_handler(self, error) -> tuple:
        
        client_id = self.get_limiter_key()
        from api.utils.secure_logging import log_security_warning
        log_security_warning(
            "Rate limit exceeded", 
            protection_type="rate_limiting",
            client_identifier=client_id[:10] + "..." if len(client_id) > 10 else client_id  # Truncate for privacy
        )
        
        
        retry_after = getattr(error, 'retry_after', None)
        
        response_data = {
            "error_type": "rate_limit_exceeded",
            "message": "Rate limit exceeded. Please try again later.",
            "retry_after": retry_after
        }
        
        if retry_after:
            response_data["retry_after_seconds"] = int(retry_after)
        
        response = create_response(
            status=429,
            message="Too many requests",
            data=response_data
        )
        
        
        if hasattr(error, 'limit'):
            response.headers['X-RateLimit-Limit'] = str(error.limit)
        if hasattr(error, 'remaining'):
            response.headers['X-RateLimit-Remaining'] = str(error.remaining)
        if retry_after:
            response.headers['Retry-After'] = str(int(retry_after))
        
        return response, 429


rate_limit_manager = RateLimitManager()

def rate_limit(limit_string: str):
   
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if rate_limit_manager.limiter:
                
                limiter_decorator = rate_limit_manager.limiter.limit(limit_string)
                return limiter_decorator(f)(*args, **kwargs)
            else:
                
                logger.warning("Rate limiting not initialized, skipping limit check")
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def strict_rate_limit(limit_string: str):
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if rate_limit_manager.limiter:
                
                limiter_decorator = rate_limit_manager.limiter.limit(
                    limit_string,
                    per_method=True,
                    methods=['POST', 'PUT', 'PATCH', 'DELETE']
                )
                return limiter_decorator(f)(*args, **kwargs)
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def dynamic_rate_limit(limit_func: Callable[[], str]):
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if rate_limit_manager.limiter:
                current_limit = limit_func()
                limiter_decorator = rate_limit_manager.limiter.limit(current_limit)
                return limiter_decorator(f)(*args, **kwargs)
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def get_user_rate_limit() -> str:
    
    try:
        from api.utils.require_auth import get_current_user_role
        user_role = get_current_user_role()
        
        if user_role == 'admin':
            return "1000 per hour"
        elif user_role == 'premium':
            return "500 per hour"
        else:
            return "100 per hour"
    except:
        return "50 per hour"  


auth_rate_limit = strict_rate_limit("5 per minute")  
api_rate_limit = rate_limit("60 per minute")         
upload_rate_limit = strict_rate_limit("10 per hour") 
search_rate_limit = rate_limit("30 per minute")      

def configure_rate_limiting(app):
    
    
    
    rate_limit_manager.init_app(app)
    
    
    @app.route('/api/rate-limit-status', methods=['GET'])
    @rate_limit("10 per minute")
    def get_rate_limit_status():
        """Get current rate limit status for the client."""
        try:
            if rate_limit_manager.limiter:
                
                client_id = rate_limit_manager.get_limiter_key()
                
                return create_response(
                    data={
                        "client_id": client_id,
                        "default_limits": rate_limit_manager.get_default_limits(),
                        "status": "active"
                    },
                    message="Rate limiting is active"
                )
            else:
                return create_response(
                    data={"status": "inactive"},
                    message="Rate limiting is not active"
                )
        except Exception as e:
            logger.error(f"Error getting rate limit status: {str(e)}")
            return create_response(
                status=500,
                message="Error getting rate limit status"
            )
    
    
    @app.before_request
    def log_rate_limit_info():
        """Log rate limit information for monitoring."""
        if rate_limit_manager.limiter:
            try:
                
                client_id = rate_limit_manager.get_limiter_key()
                endpoint = request.endpoint
                
                
                if hasattr(request, '_rate_limit_key'):
                    logger.debug(f"Rate limit check for {client_id} accessing {endpoint}")
            except Exception:
                pass  
    
    logger.info("Rate limiting configured for application")


RATE_LIMIT_CONFIG = {
    'development': {
        'RATELIMIT_STORAGE_URL': 'memory://',
        'RATELIMIT_HEADERS_ENABLED': True,
        'RATELIMIT_SWALLOW_ERRORS': True,
    },
    'production': {
        'RATELIMIT_STORAGE_URL': 'redis://localhost:6379',  
        'RATELIMIT_HEADERS_ENABLED': True,
        'RATELIMIT_SWALLOW_ERRORS': False,  
    },
    'testing': {
        'RATELIMIT_STORAGE_URL': 'memory://',
        'RATELIMIT_HEADERS_ENABLED': False,
        'RATELIMIT_SWALLOW_ERRORS': True,
    }
}

def get_rate_limit_config(environment: str = 'production') -> Dict[str, Any]:
    
    return RATE_LIMIT_CONFIG.get(environment, RATE_LIMIT_CONFIG['production'])
