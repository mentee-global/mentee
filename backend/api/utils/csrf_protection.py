
import logging
import secrets
from functools import wraps
from typing import Optional, Dict, Any
from flask import request, jsonify, session, current_app
from flask_wtf.csrf import CSRFProtect, validate_csrf, ValidationError
from api.core import create_response

logger = logging.getLogger(__name__)

class CSRFManager:
    
    
    def __init__(self, app=None):
        self.csrf = CSRFProtect()
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
       
        self.app = app
        
       
        app.config.setdefault('SECRET_KEY', secrets.token_hex(32))
        app.config.setdefault('WTF_CSRF_ENABLED', True)
        app.config.setdefault('WTF_CSRF_TIME_LIMIT', 3600)  
        app.config.setdefault('WTF_CSRF_SSL_STRICT', True)
        app.config.setdefault('WTF_CSRF_CHECK_DEFAULT', True)
        
       
        self.csrf.init_app(app)
        
        
        @self.csrf.error_handler
        def csrf_error(reason):
            from api.utils.secure_logging import log_security_warning
            log_security_warning(
                "CSRF validation failed", 
                protection_type="csrf",
                validation_reason=reason
            )
            return create_response(
                status=400,
                message="CSRF token validation failed. Please refresh the page and try again.",
                data={"error_type": "csrf_error", "reason": reason}
            )
        
        logger.info("CSRF protection initialized successfully")
    
    def generate_csrf_token(self) -> str:
        
        from flask_wtf.csrf import generate_csrf
        return generate_csrf()
    
    def validate_csrf_token(self, token: str) -> bool:
       
        try:
            validate_csrf(token)
            return True
        except ValidationError as e:
            from api.utils.secure_logging import log_security_warning
            log_security_warning(
                "CSRF token validation failed", 
                protection_type="csrf",
                validation_error=str(e)
            )
            return False


csrf_manager = CSRFManager()

def csrf_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            
            csrf_token = request.headers.get('X-CSRFToken') or request.form.get('csrf_token')
            
            if not csrf_token:
                from api.utils.secure_logging import log_security_warning
                log_security_warning(
                    "Missing CSRF token", 
                    protection_type="csrf",
                    http_method=request.method
                )
                return create_response(
                    status=400,
                    message="CSRF token required"
                )
            
            
            if not csrf_manager.validate_csrf_token(csrf_token):
                return create_response(
                    status=400,
                    message="Invalid CSRF token"
                )
            
            logger.debug(f"CSRF validation successful for {f.__name__}")
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"CSRF validation error: {str(e)}")
            return create_response(
                status=500,
                message="CSRF validation error"
            )
    
    return decorated_function

def api_csrf_protection(f):
   
    @wraps(f)
    def decorated_function(*args, **kwargs):
        
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return f(*args, **kwargs)
        
        try:
            
            api_header = request.headers.get('X-Requested-With')
            if api_header != 'XMLHttpRequest':
                
                api_key_header = request.headers.get('X-API-Request')
                if not api_key_header:
                    from api.utils.secure_logging import log_security_warning
                    log_security_warning(
                        "Missing required API headers", 
                        protection_type="csrf",
                        api_protection="header_validation"
                    )
                    return create_response(
                        status=400,
                        message="Required API headers missing"
                    )
            
            
            csrf_token_header = request.headers.get('X-CSRFToken')
            csrf_token_cookie = request.cookies.get('csrf_token')
            
            if csrf_token_header and csrf_token_cookie:
                if csrf_token_header != csrf_token_cookie:
                    from api.utils.secure_logging import log_security_warning
                    log_security_warning(
                        "CSRF token mismatch", 
                        protection_type="csrf",
                        api_protection="double_submit_cookie"
                    )
                    return create_response(
                        status=400,
                        message="CSRF token mismatch"
                    )
            
            # Standard CSRF validation
            csrf_token = csrf_token_header or request.form.get('csrf_token')
            if csrf_token and not csrf_manager.validate_csrf_token(csrf_token):
                return create_response(
                    status=400,
                    message="Invalid CSRF token"
                )
            
            logger.debug(f"API CSRF validation successful for {f.__name__}")
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"API CSRF validation error: {str(e)}")
            return create_response(
                status=500,
                message="CSRF validation error"
            )
    
    return decorated_function

def exempt_csrf(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):
        
        f._csrf_exempt = True
        return f(*args, **kwargs)
    
    return decorated_function

def configure_csrf_for_app(app):
   
    
    
    csrf_manager.init_app(app)
    
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        """Endpoint to get CSRF token for AJAX requests."""
        token = csrf_manager.generate_csrf_token()
        response = create_response(
            data={'csrf_token': token},
            message="CSRF token generated"
        )
        

        response.set_cookie(
            'csrf_token',
            token,
            max_age=3600,
            secure=app.config.get('WTF_CSRF_SSL_STRICT', True),
            httponly=False,  
            samesite='Strict'
        )
        
        return response
    
    
    @app.context_processor
    def inject_csrf_token():
       
        return dict(csrf_token=csrf_manager.generate_csrf_token)
    
   
    @app.after_request
    def add_csrf_headers(response):
        
        
        response.headers['X-Frame-Options'] = 'DENY'
        
        
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
    
    logger.info("CSRF protection configured for application")


CSRF_CONFIG = {
    'development': {
        'WTF_CSRF_ENABLED': True,
        'WTF_CSRF_TIME_LIMIT': 3600,
        'WTF_CSRF_SSL_STRICT': False, 
    },
    'production': {
        'WTF_CSRF_ENABLED': True,
        'WTF_CSRF_TIME_LIMIT': 1800,  
        'WTF_CSRF_SSL_STRICT': True,  
    },
    'testing': {
        'WTF_CSRF_ENABLED': False, 
        'WTF_CSRF_TIME_LIMIT': None,
        'WTF_CSRF_SSL_STRICT': False,
    }
}

def get_csrf_config(environment: str = 'production') -> Dict[str, Any]:
   
    return CSRF_CONFIG.get(environment, CSRF_CONFIG['production'])

