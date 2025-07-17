
import os
import sys
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from api.utils.secure_config import get_config, is_production


logger = logging.getLogger(__name__)


try:
    from api.utils.secure_communication import (
        SecureCommunicationManager, 
        configure_secure_communication,
        get_ssl_context,
        validate_secure_communication,
        is_https_required
    )
    SECURE_COMM_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Secure communication module not available: {e}")
    SECURE_COMM_AVAILABLE = False

try:
    from api.utils.certificate_manager import (
        CertificateManager,
        get_or_create_certificate,
        validate_ssl_setup,
        setup_certificate_auto_renewal
    )
    CERT_MANAGER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Certificate manager not available: {e}")
    CERT_MANAGER_AVAILABLE = False

try:
    from api.utils.websocket_security import (
        WebSocketSecurityManager,
        configure_socketio_security,
        get_websocket_security_report,
        require_websocket_auth,
        validate_websocket_message
    )
    WS_SECURITY_AVAILABLE = True
except ImportError as e:
    logger.warning(f"WebSocket security not available: {e}")
    WS_SECURITY_AVAILABLE = False

class SecureCommunicationIntegrator:
    
    
    def __init__(self):
        self.config = self._load_integration_config()
        self.components_status = self._check_components()
        self.security_report = {}
    
    def _load_integration_config(self) -> Dict[str, Any]:
        
        return {
            'enable_https': get_config('ENABLE_HTTPS', is_production()),
            'enable_websocket_security': get_config('ENABLE_WS_SECURITY', 'true').lower() == 'true',
            'enable_certificate_management': get_config('ENABLE_CERT_MGMT', is_production()),
            'auto_configure': get_config('AUTO_CONFIGURE_SECURITY', 'true').lower() == 'true',
            'development_ssl': get_config('DEV_SSL', 'false').lower() == 'true',
            'security_audit_enabled': get_config('SECURITY_AUDIT', 'true').lower() == 'true'
        }
    
    def _check_components(self) -> Dict[str, bool]:
        
        return {
            'secure_communication': SECURE_COMM_AVAILABLE,
            'certificate_manager': CERT_MANAGER_AVAILABLE,
            'websocket_security': WS_SECURITY_AVAILABLE,
            'flask_talisman': self._check_talisman_available(),
            'openssl': self._check_openssl_available()
        }
    
    def _check_talisman_available(self) -> bool:
        
        try:
            import flask_talisman
            return True
        except ImportError:
            return False
    
    def _check_openssl_available(self) -> bool:
        
        try:
            import subprocess
            subprocess.run(['openssl', 'version'], 
                         check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    def configure_application_security(self, app, socketio=None) -> Dict[str, Any]:
        
        logger.info("Configuring comprehensive application security...")
        
        configuration_result = {
            'success': False,
            'configured_components': [],
            'errors': [],
            'warnings': []
        }
        
        
        if (self.config['enable_https'] and 
            self.components_status['secure_communication']):
            
            try:
                app = configure_secure_communication(app, socketio)
                configuration_result['configured_components'].append('https_security')
                logger.info("HTTPS and security headers configured")
            except Exception as e:
                error_msg = f"Failed to configure HTTPS security: {e}"
                configuration_result['errors'].append(error_msg)
                logger.error(error_msg)
        
        
        if (self.config['enable_websocket_security'] and 
            socketio and self.components_status['websocket_security']):
            
            try:
                socketio = configure_socketio_security(socketio)
                configuration_result['configured_components'].append('websocket_security')
                logger.info("WebSocket security configured")
            except Exception as e:
                error_msg = f"Failed to configure WebSocket security: {e}"
                configuration_result['errors'].append(error_msg)
                logger.error(error_msg)
        
        
        if (self.config['enable_certificate_management'] and 
            self.components_status['certificate_manager']):
            
            try:
                cert_status = self._configure_certificates()
                if cert_status['success']:
                    configuration_result['configured_components'].append('ssl_certificates')
                    logger.info("SSL certificates configured")
                else:
                    configuration_result['warnings'].extend(cert_status['warnings'])
            except Exception as e:
                error_msg = f"Failed to configure SSL certificates: {e}"
                configuration_result['errors'].append(error_msg)
                logger.error(error_msg)
        
        
        if not self.components_status['flask_talisman']:
            try:
                self._configure_manual_headers(app)
                configuration_result['configured_components'].append('manual_headers')
                logger.info("Manual security headers configured")
            except Exception as e:
                error_msg = f"Failed to configure manual headers: {e}"
                configuration_result['warnings'].append(error_msg)
                logger.warning(error_msg)
        
        configuration_result['success'] = len(configuration_result['errors']) == 0
        
        if configuration_result['success']:
            logger.info(f"Application security configured successfully. "
                       f"Components: {', '.join(configuration_result['configured_components'])}")
        else:
            logger.error(f"Application security configuration completed with errors: "
                        f"{configuration_result['errors']}")
        
        return configuration_result
    
    def _configure_certificates(self) -> Dict[str, Any]:
        
        result = {'success': False, 'warnings': []}
        
        if not CERT_MANAGER_AVAILABLE:
            result['warnings'].append("Certificate manager not available")
            return result
        
        try:
            if is_production():
                
                domain_names = get_config('SSL_DOMAINS', '').split(',')
                if domain_names and domain_names[0]:
                    cert_info = get_or_create_certificate(domain_names[0])
                    result['certificate_info'] = cert_info
                    
                    
                    if setup_certificate_auto_renewal():
                        result['auto_renewal'] = True
                    else:
                        result['warnings'].append("Auto-renewal setup failed")
                else:
                    result['warnings'].append("No domain names configured for SSL")
            else:
                
                if self.config['development_ssl']:
                    cert_info = get_or_create_certificate('localhost')
                    result['certificate_info'] = cert_info
                else:
                    result['warnings'].append("Development SSL not enabled")
            
            result['success'] = True
            
        except Exception as e:
            result['warnings'].append(f"Certificate configuration error: {e}")
        
        return result
    
    def _configure_manual_headers(self, app):
        
        @app.after_request
        def add_manual_security_headers(response):
            
            
            security_headers = {
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
                'X-Permitted-Cross-Domain-Policies': 'none'
            }
            
           
            if is_production():
                csp = ("default-src 'self'; "
                      "script-src 'self' 'unsafe-inline'; "
                      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                      "font-src 'self' https://fonts.gstatic.com; "
                      "img-src 'self' data: https:; "
                      "connect-src 'self' wss: https:; "
                      "frame-ancestors 'none'; "
                      "upgrade-insecure-requests")
            else:
                csp = ("default-src 'self'; "
                      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                      "connect-src 'self' ws: wss: http: https:")
            
            security_headers['Content-Security-Policy'] = csp
            
           
            for header, value in security_headers.items():
                if header not in response.headers:
                    response.headers[header] = value
            
            
            response.headers.pop('Server', None)
            
            return response
        
        
        if is_production() and self.config['enable_https']:
            @app.before_request
            def force_https():
                """Force HTTPS in production."""
                from flask import request, redirect
                
                if (not request.is_secure and 
                    request.headers.get('X-Forwarded-Proto') != 'https'):
                    
                    if request.method == 'GET':
                        return redirect(request.url.replace('http://', 'https://'), code=301)
                    else:
                        return "HTTPS Required", 426
    
    def generate_security_audit(self) -> Dict[str, Any]:
        
        audit = {
            'timestamp': self._get_timestamp(),
            'environment': 'production' if is_production() else 'development',
            'components_status': self.components_status,
            'configuration': self.config,
            'security_checks': {},
            'recommendations': [],
            'compliance_score': 0
        }
        
        
        if SECURE_COMM_AVAILABLE:
            try:
                https_status = validate_secure_communication()
                audit['security_checks']['https'] = https_status
            except Exception as e:
                audit['security_checks']['https'] = {'error': str(e)}
        
        
        if CERT_MANAGER_AVAILABLE:
            try:
                ssl_status = validate_ssl_setup()
                audit['security_checks']['ssl_certificates'] = ssl_status
            except Exception as e:
                audit['security_checks']['ssl_certificates'] = {'error': str(e)}
        
        
        if WS_SECURITY_AVAILABLE:
            try:
                ws_status = get_websocket_security_report()
                audit['security_checks']['websocket'] = ws_status
            except Exception as e:
                audit['security_checks']['websocket'] = {'error': str(e)}
        
       
        audit['recommendations'] = self._generate_security_recommendations(audit)
        
        
        audit['compliance_score'] = self._calculate_compliance_score(audit)
        
        return audit
    
    def _generate_security_recommendations(self, audit: Dict[str, Any]) -> List[str]:
       
        recommendations = []
        
        
        if not self.components_status['flask_talisman']:
            recommendations.append("Install Flask-Talisman for enhanced security headers")
        
        if not self.components_status['openssl']:
            recommendations.append("Install OpenSSL for certificate management")
        
       
        if is_production():
            if not self.config['enable_https']:
                recommendations.append("Enable HTTPS enforcement in production")
            
            if not self.config['enable_certificate_management']:
                recommendations.append("Enable certificate management for production")
            
           
            domains = get_config('SSL_DOMAINS', '')
            if not domains:
                recommendations.append("Configure SSL domain names for certificate generation")
        
        
        for check_name, check_result in audit['security_checks'].items():
            if isinstance(check_result, dict) and 'recommendations' in check_result:
                recommendations.extend(check_result['recommendations'])
        
        return list(set(recommendations))  
    
    def _calculate_compliance_score(self, audit: Dict[str, Any]) -> int:
        
        score = 0
        max_score = 100
        
       
        component_score = sum(1 for status in self.components_status.values() if status)
        score += (component_score / len(self.components_status)) * 20
        
        
        if self.config['enable_https']:
            score += 10
        if self.config['enable_websocket_security']:
            score += 10
        if self.config['enable_certificate_management'] or not is_production():
            score += 10
        
        
        security_checks = audit['security_checks']
        if security_checks:
            
            if 'https' in security_checks and not security_checks['https'].get('error'):
                score += 15
            
           
            if 'ssl_certificates' in security_checks and not security_checks['ssl_certificates'].get('error'):
                score += 15
            
            
            if 'websocket' in security_checks and not security_checks['websocket'].get('error'):
                score += 20
        
        return min(score, max_score)
    
    def _get_timestamp(self) -> str:
        
        from datetime import datetime
        return datetime.now().isoformat()
    
    def get_integration_status(self) -> Dict[str, Any]:
        """Get integration status summary."""
        return {
            'components_available': self.components_status,
            'configuration': self.config,
            'ready_for_production': self._is_production_ready(),
            'missing_components': [
                comp for comp, available in self.components_status.items() 
                if not available
            ]
        }
    
    def _is_production_ready(self) -> bool:
        
        if not is_production():
            return True  
        
        
        required_components = ['secure_communication']
        
        
        for component in required_components:
            if not self.components_status.get(component, False):
                return False
        
        
        if not self.config['enable_https']:
            return False
        
        return True


secure_comm_integrator = SecureCommunicationIntegrator()

def configure_app_security(app, socketio=None) -> Dict[str, Any]:
    
    return secure_comm_integrator.configure_application_security(app, socketio)

def get_security_status() -> Dict[str, Any]:
    
    return secure_comm_integrator.get_integration_status()

def generate_security_audit() -> Dict[str, Any]:
   
    return secure_comm_integrator.generate_security_audit()

def is_production_ready() -> bool:
    
    return secure_comm_integrator._is_production_ready()

def get_security_recommendations() -> List[str]:
    
    audit = generate_security_audit()
    return audit.get('recommendations', [])
