
import logging
from typing import Optional, Dict, Any
from flask import Flask


from api.utils.csrf_protection import configure_csrf_for_app, csrf_manager
from api.utils.rate_limiting import configure_rate_limiting, rate_limit_manager
from api.utils.xss_protection import configure_xss_protection, xss_protection
from api.utils.csp_manager import configure_csp, configure_security_headers, csp_manager
from api.utils.security_linter import SecurityScanner

logger = logging.getLogger(__name__)

class ComprehensiveSecurityManager:
    
    
    def __init__(self, app: Optional[Flask] = None):
        self.app = app
        self.csrf_manager = csrf_manager
        self.rate_limit_manager = rate_limit_manager
        self.xss_protection = xss_protection
        self.csp_manager = csp_manager
        self.security_scanner = None
        self.security_status = {}
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        
        self.app = app
        
        try:
            logger.info("🛡️ Initializing Comprehensive Security Framework...")
            
           
            logger.info("Configuring CSRF protection...")
            configure_csrf_for_app(app)
            self.security_status['csrf'] = 'enabled'
            
            
            logger.info("Configuring rate limiting...")
            configure_rate_limiting(app)
            self.security_status['rate_limiting'] = 'enabled'
            
            
            logger.info("Configuring XSS protection...")
            configure_xss_protection(app)
            self.security_status['xss_protection'] = 'enabled'
            
           
            logger.info("Configuring Content Security Policy...")
            configure_csp(app)
            configure_security_headers(app)
            self.security_status['csp'] = 'enabled'
            self.security_status['security_headers'] = 'enabled'
            
           
            logger.info("Initializing security scanner...")
            self.security_scanner = SecurityScanner()
            self.security_status['security_scanner'] = 'enabled'
            
           
            self._add_security_endpoints(app)
            
           
            self._configure_security_middleware(app)
            
            logger.info("✅ Comprehensive Security Framework initialized successfully!")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize security framework: {str(e)}")
            raise
    
    def _add_security_endpoints(self, app: Flask):
        
        
        @app.route('/api/security/status', methods=['GET'])
        def security_status():
            
            from api.core import create_response
            from api.utils.require_auth import admin_only
            
            @admin_only
            def get_status():
                status = {
                    'security_components': self.security_status,
                    'timestamp': app.config.get('SECURITY_INIT_TIME'),
                    'environment': app.config.get('ENV', 'unknown')
                }
                return create_response(data=status, message="Security status retrieved")
            
            return get_status()
        
        @app.route('/api/security/scan', methods=['POST'])
        def trigger_security_scan():
          
            from api.core import create_response
            from api.utils.require_auth import admin_only
            
            @admin_only
            def run_scan():
                try:
                    if self.security_scanner:
                        results = self.security_scanner.run_comprehensive_scan()
                        return create_response(
                            data=results['summary'],
                            message="Security scan completed"
                        )
                    else:
                        return create_response(
                            status=500,
                            message="Security scanner not available"
                        )
                except Exception as e:
                    logger.error(f"Security scan failed: {str(e)}")
                    return create_response(
                        status=500,
                        message="Security scan failed"
                    )
            
            return run_scan()
        
        @app.route('/api/security/config', methods=['GET'])
        def get_security_config():
            
            from api.core import create_response
            from api.utils.require_auth import admin_only
            
            @admin_only
            def get_config():
                config = {
                    'csrf_enabled': app.config.get('WTF_CSRF_ENABLED', False),
                    'rate_limiting_enabled': bool(self.rate_limit_manager.limiter),
                    'xss_protection_enabled': bool(self.xss_protection.app),
                    'csp_enabled': bool(self.csp_manager.talisman),
                    'environment': app.config.get('ENV', 'unknown')
                }
                return create_response(data=config, message="Security configuration retrieved")
            
            return get_config()
    
    def _configure_security_middleware(self, app: Flask):
        
        
        @app.before_request
        def security_before_request():
            
            from flask import request
            
            
            if app.config.get('SECURITY_LOGGING_ENABLED', True):
                logger.debug(
                    f"Request: {request.method} {request.path} "
                    f"from {request.remote_addr} "
                    f"User-Agent: {request.headers.get('User-Agent', 'Unknown')}"
                )
        
        @app.after_request
        def security_after_request(response):
           
            
           
            if app.config.get('ENV') == 'development':
                response.headers['X-Security-Framework'] = 'Comprehensive-Security-v1.0'
            
            return response
        
        @app.teardown_request
        def security_teardown_request(exception):
            
            if exception:
                logger.error(f"Request failed with exception: {str(exception)}")
    
    def get_security_report(self) -> Dict[str, Any]:
        
        try:
            report = {
                'timestamp': self._get_current_timestamp(),
                'security_status': self.security_status.copy(),
                'components': {
                    'csrf_protection': {
                        'enabled': bool(self.csrf_manager.app),
                        'configuration': self._get_csrf_config()
                    },
                    'rate_limiting': {
                        'enabled': bool(self.rate_limit_manager.limiter),
                        'configuration': self._get_rate_limit_config()
                    },
                    'xss_protection': {
                        'enabled': bool(self.xss_protection.app),
                        'configuration': self._get_xss_config()
                    },
                    'csp': {
                        'enabled': bool(self.csp_manager.talisman),
                        'configuration': self._get_csp_config()
                    }
                },
                'scan_results': None
            }
            
            
            if self.security_scanner:
                scan_results = self.security_scanner.run_comprehensive_scan()
                report['scan_results'] = scan_results['summary']
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate security report: {str(e)}")
            return {'error': str(e)}
    
    def _get_current_timestamp(self) -> str:
        
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _get_csrf_config(self) -> Dict[str, Any]:
        
        if not self.app:
            return {}
        
        return {
            'enabled': self.app.config.get('WTF_CSRF_ENABLED', False),
            'time_limit': self.app.config.get('WTF_CSRF_TIME_LIMIT', 3600),
            'ssl_strict': self.app.config.get('WTF_CSRF_SSL_STRICT', True)
        }
    
    def _get_rate_limit_config(self) -> Dict[str, Any]:
       
        if not self.rate_limit_manager.limiter:
            return {'enabled': False}
        
        return {
            'enabled': True,
            'default_limits': self.rate_limit_manager.get_default_limits(),
            'storage_uri': getattr(self.rate_limit_manager.limiter, 'storage_uri', 'unknown')
        }
    
    def _get_xss_config(self) -> Dict[str, Any]:
        
        return {
            'allowed_tags': self.xss_protection.allowed_tags,
            'allowed_attributes': self.xss_protection.allowed_attributes,
            'allowed_protocols': self.xss_protection.allowed_protocols
        }
    
    def _get_csp_config(self) -> Dict[str, Any]:
        
        return {
            'policy': self.csp_manager.csp_config,
            'talisman_enabled': bool(self.csp_manager.talisman)
        }


security_manager = ComprehensiveSecurityManager()

def configure_comprehensive_security(app: Flask, config: Optional[Dict[str, Any]] = None):
    
    
    
    if config:
        for key, value in config.items():
            app.config[key] = value
    
    
    from datetime import datetime
    app.config['SECURITY_INIT_TIME'] = datetime.now().isoformat()
    
   
    security_manager.init_app(app)
    
    logger.info("Comprehensive security configuration completed!")

def get_security_decorators():
    
    from api.utils.csrf_protection import csrf_required, api_csrf_protection
    from api.utils.rate_limiting import auth_rate_limit, api_rate_limit, upload_rate_limit
    from api.utils.xss_protection import sanitize_input, require_clean_input
    
    return {
        'csrf_required': csrf_required,
        'api_csrf_protection': api_csrf_protection,
        'auth_rate_limit': auth_rate_limit,
        'api_rate_limit': api_rate_limit,
        'upload_rate_limit': upload_rate_limit,
        'sanitize_input': sanitize_input,
        'require_clean_input': require_clean_input
    }

def create_secure_app_factory():
    
    
    def create_app(config_name: str = 'production'):
        
        app = Flask(__name__)
        
        
        if config_name == 'development':
            app.config.update({
                'ENV': 'development',
                'DEBUG': True,
                'TESTING': False,
                'WTF_CSRF_SSL_STRICT': False,
                'FORCE_HTTPS': False
            })
        elif config_name == 'testing':
            app.config.update({
                'ENV': 'testing',
                'DEBUG': False,
                'TESTING': True,
                'WTF_CSRF_ENABLED': False,
                'FORCE_HTTPS': False
            })
        else:  
            app.config.update({
                'ENV': 'production',
                'DEBUG': False,
                'TESTING': False,
                'WTF_CSRF_SSL_STRICT': True,
                'FORCE_HTTPS': True
            })
        
        
        configure_comprehensive_security(app)
        
        return app
    
    return create_app


