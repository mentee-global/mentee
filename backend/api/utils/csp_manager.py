
import logging
from typing import Dict, List, Any, Optional
from flask import current_app, request
from flask_talisman import Talisman

logger = logging.getLogger(__name__)

class CSPManager:
    
    
    def __init__(self, app=None):
        self.app = app
        self.talisman = None
        self.csp_config = self.get_default_csp()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        
        self.app = app
        
        
        environment = app.config.get('ENV', 'production')
        self.csp_config = self.get_csp_for_environment(environment)
        
        
        self.talisman = Talisman(
            app,
            content_security_policy=self.csp_config,
            content_security_policy_nonce_in=['script-src', 'style-src'],
            force_https=app.config.get('FORCE_HTTPS', True),
            strict_transport_security=True,
            strict_transport_security_max_age=31536000,  
            strict_transport_security_include_subdomains=True,
            strict_transport_security_preload=True,
            session_cookie_secure=True,
            session_cookie_http_only=True,
            session_cookie_samesite='Strict'
        )
        
        
        self._setup_csp_violation_reporting(app)
        
        logger.info(f"CSP configured for {environment} environment")
    
    def get_default_csp(self) -> Dict[str, List[str]]:
        """Get default Content Security Policy configuration."""
        return {
            'default-src': ["'self'"],
            'script-src': [
                "'self'",
                "'unsafe-inline'",  
                'https://apis.google.com',
                'https://www.google.com',
                'https://cdnjs.cloudflare.com',
                'https://cdn.jsdelivr.net'
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'",  
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com',
                'https://cdn.jsdelivr.net'
            ],
            'font-src': [
                "'self'",
                'https://fonts.gstatic.com',
                'https://cdnjs.cloudflare.com'
            ],
            'img-src': [
                "'self'",
                'data:',  
                'https:',  
                'blob:'   
            ],
            'connect-src': [
                "'self'",
                'https://api.mentee.app',  
                'https://firebase.googleapis.com',
                'https://identitytoolkit.googleapis.com'
            ],
            'frame-src': [
                "'self'",
                'https://www.google.com',
                'https://accounts.google.com'
            ],
            'object-src': ["'none'"],  
            'base-uri': ["'self'"],    
            'form-action': ["'self'"], 
            'upgrade-insecure-requests': True,  
            'block-all-mixed-content': True     
        }
    
    def get_csp_for_environment(self, environment: str) -> Dict[str, Any]:
        
        base_csp = self.get_default_csp()
        
        if environment == 'development':
            
            base_csp.update({
                'script-src': [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",  
                    'localhost:*',
                    '127.0.0.1:*',
                    'https://apis.google.com',
                    'https://www.google.com'
                ],
                'connect-src': [
                    "'self'",
                    'localhost:*',
                    '127.0.0.1:*',
                    'ws://localhost:*',  
                    'wss://localhost:*',
                    'https://api.mentee.app',
                    'https://firebase.googleapis.com'
                ],
                'upgrade-insecure-requests': False,
                'block-all-mixed-content': False
            })
        
        elif environment == 'testing':
           
            base_csp.update({
                'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'connect-src': ["'self'", 'localhost:*', '127.0.0.1:*'],
                'upgrade-insecure-requests': False,
                'block-all-mixed-content': False
            })
        
        elif environment == 'production':
            
            base_csp.update({
                'script-src': [
                    "'self'",
                    
                    'https://apis.google.com',
                    'https://www.google.com',
                    'https://cdnjs.cloudflare.com'
                ],
                'style-src': [
                    "'self'",
                    "'unsafe-inline'",  
                    'https://fonts.googleapis.com',
                    'https://cdnjs.cloudflare.com'
                ],
                'connect-src': [
                    "'self'",
                    'https://api.mentee.app',
                    'https://firebase.googleapis.com',
                    'https://identitytoolkit.googleapis.com'
                ],
                'report-uri': ['/api/csp-violation-report'], 
                'upgrade-insecure-requests': True,
                'block-all-mixed-content': True
            })
        
        return base_csp
    
    def _setup_csp_violation_reporting(self, app):
        
        
        @app.route('/api/csp-violation-report', methods=['POST'])
        def csp_violation_report():
            
            try:
                violation_data = request.get_json()
                
                if violation_data and 'csp-report' in violation_data:
                    report = violation_data['csp-report']
                    
                    
                    logger.warning(
                        f"CSP Violation: "
                        f"blocked-uri={report.get('blocked-uri', 'unknown')}, "
                        f"document-uri={report.get('document-uri', 'unknown')}, "
                        f"violated-directive={report.get('violated-directive', 'unknown')}, "
                        f"source-file={report.get('source-file', 'unknown')}"
                    )
                    
                    
                    self._store_csp_violation(report)
                
                return '', 204  
                
            except Exception as e:
                logger.error(f"Error processing CSP violation report: {str(e)}")
                return '', 400
    
    def _store_csp_violation(self, report: Dict[str, Any]):

        pass
    
    def update_csp_for_route(self, route_csp: Dict[str, List[str]]):
        
        if self.talisman:
            
            return route_csp
        return self.csp_config


csp_manager = CSPManager()

def custom_csp(csp_override: Dict[str, List[str]]):

    def decorator(f):
        from functools import wraps
        
        @wraps(f)
        def decorated_function(*args, **kwargs):
            
            if hasattr(current_app, 'csp_override'):
                current_app.csp_override.update(csp_override)
            else:
                current_app.csp_override = csp_override
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def relaxed_csp(f):
    
    relaxed_config = {
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
    }
    return custom_csp(relaxed_config)(f)

def strict_csp(f):
    
    strict_config = {
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'self'"]
    }
    return custom_csp(strict_config)(f)

def configure_csp(app):
   
    
    
    csp_manager.init_app(app)
    
   
    @app.before_request
    def generate_csp_nonce():
        
        import secrets
        if not hasattr(request, 'csp_nonce'):
            request.csp_nonce = secrets.token_urlsafe(16)
    
    
    @app.template_global()
    def csp_nonce():
        
        return getattr(request, 'csp_nonce', '')
    
    
    @app.template_global()
    def csp_allows(directive: str, source: str) -> bool:
        
        csp_config = csp_manager.csp_config
        allowed_sources = csp_config.get(directive, [])
        return source in allowed_sources or "'self'" in allowed_sources
    
    logger.info("Content Security Policy configured for application")


def configure_security_headers(app):
    
    
    @app.after_request
    def add_security_headers(response):

        response.headers['X-Frame-Options'] = 'DENY'
        

        response.headers['X-Content-Type-Options'] = 'nosniff'

        response.headers['X-XSS-Protection'] = '1; mode=block'

        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        response.headers['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'gyroscope=(), '
            'accelerometer=()'
        )
        
      
        response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
        response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
        response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'
        
        return response
    
    logger.info("Additional security headers configured")


CSP_PRESETS = {
    'api_only': {
        'default-src': ["'none'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"]
    },
    'minimal_webapp': {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
    },
    'full_webapp': {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://apis.google.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https://api.mentee.app'],
        'frame-src': ["'self'", 'https://www.google.com'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
    }
}

def get_csp_preset(preset_name: str) -> Dict[str, List[str]]:
   
    return CSP_PRESETS.get(preset_name, CSP_PRESETS['minimal_webapp'])
