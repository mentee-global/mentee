
import os
import logging
from flask import Flask, request, redirect, url_for
from flask_talisman import Talisman
from typing import Dict, Any, Optional
from api.utils.secure_config import get_config, is_production

logger = logging.getLogger(__name__)

class SecureCommunicationManager:
    def __init__(self):
        self.security_config = self._load_security_config()
        self.talisman_config = self._load_talisman_config()

    def _load_security_config(self) -> Dict[str, Any]:
        return {
            'force_https': get_config('FORCE_HTTPS', is_production()),
            'https_port': int(get_config('HTTPS_PORT', '443')),
            'http_port': int(get_config('HTTP_PORT', '80')),
            'ssl_cert_path': get_config('SSL_CERT_PATH', '/etc/ssl/certs/mentee.crt'),
            'ssl_key_path': get_config('SSL_KEY_PATH', '/etc/ssl/private/mentee.key'),
            'ssl_ca_path': get_config('SSL_CA_PATH'),
            'security_headers': {
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
                'Content-Security-Policy': self._build_csp(),
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
                'X-Permitted-Cross-Domain-Policies': 'none',
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Resource-Policy': 'same-origin'
            },
            'websocket_config': {
                'secure_only': is_production(),
                'same_origin_only': True,
                'allowed_origins': self._get_allowed_origins(),
                'upgrade_insecure': True
            },
            'cert_config': {
                'auto_renew': get_config('SSL_AUTO_RENEW', 'true').lower() == 'true',
                'cert_provider': get_config('SSL_CERT_PROVIDER', 'letsencrypt'),
                'domain_names': get_config('SSL_DOMAINS', '').split(','),
                'email': get_config('SSL_EMAIL', '')
            }
        }

    def _build_csp(self) -> str:
        base_policy = {
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline'",
            'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
            'font-src': "'self' https://fonts.gstatic.com",
            'img-src': "'self' data: https:",
            'connect-src': "'self' wss: https:",
            'frame-ancestors': "'none'",
            'base-uri': "'self'",
            'form-action': "'self'",
            'upgrade-insecure-requests': ""
        }

        if not is_production():
            base_policy.update({
                'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
                'connect-src': "'self' ws: wss: http: https:",
                'upgrade-insecure-requests': ""
            })

        csp_parts = []
        for directive, value in base_policy.items():
            if value:
                csp_parts.append(f"{directive} {value}")
            else:
                csp_parts.append(directive)

        return "; ".join(csp_parts)

    def _get_allowed_origins(self) -> list:
        origins = get_config('ALLOWED_ORIGINS', '').split(',')
        if not origins or origins == ['']:
            if is_production():
                return []
            else:
                return ['http://localhost:3000', 'http://127.0.0.1:3000']

        return [origin.strip() for origin in origins if origin.strip()]

    def _load_talisman_config(self) -> Dict[str, Any]:
        return {
            'force_https': self.security_config['force_https'],
            'force_https_permanent': True,
            'force_file_save': False,
            'strict_transport_security': True,
            'strict_transport_security_preload': True,
            'strict_transport_security_max_age': 31536000,
            'strict_transport_security_include_subdomains': True,
            'content_security_policy': self.security_config['security_headers']['Content-Security-Policy'],
            'content_security_policy_nonce_in': ['script-src', 'style-src'],
            'referrer_policy': 'strict-origin-when-cross-origin',
            'permissions_policy': {
                'geolocation': [],
                'microphone': [],
                'camera': [],
                'fullscreen': ['self'],
                'payment': []
            },
            'session_cookie_secure': True,
            'session_cookie_http_only': True,
            'session_cookie_samesite': 'Lax'
        }

    def configure_app(self, app: Flask) -> Flask:
        talisman = Talisman(app, **self.talisman_config)

        app.config.update({
            'SESSION_COOKIE_SECURE': self.security_config['force_https'],
            'SESSION_COOKIE_HTTPONLY': True,
            'SESSION_COOKIE_SAMESITE': 'Lax',
            'PERMANENT_SESSION_LIFETIME': 3600,
        })

        @app.after_request
        def add_security_headers(response):
            for header, value in self.security_config['security_headers'].items():
                if header not in response.headers:
                    response.headers[header] = value

            response.headers.pop('Server', None)

            return response

        if self.security_config['force_https']:
            @app.before_request
            def force_https():
                if not request.is_secure and request.headers.get('X-Forwarded-Proto') != 'https':
                    if request.method == 'GET':
                        return redirect(request.url.replace('http://', 'https://'), code=301)
                    else:
                        return "HTTPS Required", 426

        @app.before_request
        def websocket_security():
            if request.path.startswith('/socket.io/'):
                origin = request.headers.get('Origin')
                allowed_origins = self.security_config['websocket_config']['allowed_origins']

                if self.security_config['websocket_config']['same_origin_only'] and allowed_origins:
                    if origin not in allowed_origins:
                        logger.warning(f"WebSocket connection from unauthorized origin: {origin}")
                        return "Unauthorized origin", 403

                if (self.security_config['websocket_config']['secure_only'] and 
                    not request.is_secure and 
                    request.headers.get('X-Forwarded-Proto') != 'https'):
                    logger.warning("Insecure WebSocket connection attempted in production")
                    return "Secure connection required", 426

        logger.info("Secure communication configured successfully")
        return app

    def configure_socketio(self, socketio):
        logger.info("Configuring secure SocketIO...")

        socketio_config = {
            'cors_allowed_origins': self.security_config['websocket_config']['allowed_origins'],
            'cors_credentials': True,
            'upgrade': self.security_config['websocket_config']['upgrade_insecure'],
            'transport': ['websocket', 'polling'],
            'ping_timeout': 60,
            'ping_interval': 25,
            'max_http_buffer_size': 1024 * 1024,
        }

        for key, value in socketio_config.items():
            if hasattr(socketio, key):
                setattr(socketio, key, value)

        return socketio

    def get_ssl_context(self) -> Optional[tuple]:
        cert_path = self.security_config['ssl_cert_path']
        key_path = self.security_config['ssl_key_path']

        if os.path.exists(cert_path) and os.path.exists(key_path):
            logger.info(f"Using SSL certificate: {cert_path}")
            return (cert_path, key_path)

        if is_production():
            logger.error("SSL certificate not found in production!")
            raise FileNotFoundError(f"SSL certificate not found: {cert_path}")

        logger.warning("SSL certificate not found - using adhoc certificate for development")
        return 'adhoc'

    def validate_ssl_certificate(self) -> Dict[str, Any]:
        validation_result = {
            'valid': False,
            'errors': [],
            'warnings': [],
            'certificate_info': {}
        }

        cert_path = self.security_config['ssl_cert_path']
        key_path = self.security_config['ssl_key_path']

        if not os.path.exists(cert_path):
            validation_result['errors'].append(f"Certificate file not found: {cert_path}")

        if not os.path.exists(key_path):
            validation_result['errors'].append(f"Private key file not found: {key_path}")

        if os.path.exists(cert_path):
            cert_stat = os.stat(cert_path)
            if cert_stat.st_mode & 0o044:
                validation_result['warnings'].append("Certificate file has overly permissive permissions")

        if os.path.exists(key_path):
            key_stat = os.stat(key_path)
            if key_stat.st_mode & 0o077:
                validation_result['errors'].append("Private key file has insecure permissions")

        try:
            import ssl
            import datetime

            if os.path.exists(cert_path):
                cert_info = ssl._ssl._test_decode_cert(cert_path)
                validation_result['certificate_info'] = {
                    'subject': cert_info.get('subject', []),
                    'issuer': cert_info.get('issuer', []),
                    'not_after': cert_info.get('notAfter', ''),
                    'not_before': cert_info.get('notBefore', '')
                }

                not_after = cert_info.get('notAfter', '')
                if not_after:
                    validation_result['warnings'].append("Certificate expiry check requires proper implementation")

        except ImportError:
            validation_result['warnings'].append("SSL certificate validation requires OpenSSL")
        except Exception as e:
            validation_result['warnings'].append(f"Certificate validation error: {str(e)}")

        validation_result['valid'] = len(validation_result['errors']) == 0
        return validation_result

    def generate_security_report(self) -> Dict[str, Any]:
        report = {
            'https_configuration': {
                'force_https': self.security_config['force_https'],
                'ssl_configured': os.path.exists(self.security_config['ssl_cert_path']),
                'certificate_validation': self.validate_ssl_certificate()
            },
            'security_headers': {
                'headers_count': len(self.security_config['security_headers']),
                'csp_configured': bool(self.security_config['security_headers'].get('Content-Security-Policy')),
                'hsts_configured': bool(self.security_config['security_headers'].get('Strict-Transport-Security'))
            },
            'websocket_security': {
                'secure_only': self.security_config['websocket_config']['secure_only'],
                'origin_restrictions': len(self.security_config['websocket_config']['allowed_origins']),
                'same_origin_enforced': self.security_config['websocket_config']['same_origin_only']
            },
            'recommendations': self._generate_recommendations()
        }

        return report

    def _generate_recommendations(self) -> list:
        recommendations = []

        if not self.security_config['force_https'] and is_production():
            recommendations.append("Enable HTTPS enforcement in production")

        if not os.path.exists(self.security_config['ssl_cert_path']) and is_production():
            recommendations.append("Configure SSL certificate for production deployment")

        if not self.security_config['websocket_config']['allowed_origins']:
            recommendations.append("Configure explicit allowed origins for WebSocket connections")

        cert_validation = self.validate_ssl_certificate()
        if cert_validation['warnings']:
            recommendations.extend(cert_validation['warnings'])

        return recommendations

secure_comm_manager = SecureCommunicationManager()

def configure_secure_communication(app: Flask, socketio=None) -> Flask:
    app = secure_comm_manager.configure_app(app)

    if socketio:
        socketio = secure_comm_manager.configure_socketio(socketio)

    return app

def get_ssl_context():
    return secure_comm_manager.get_ssl_context()

def validate_secure_communication() -> Dict[str, Any]:
    return secure_comm_manager.generate_security_report()

def is_https_required() -> bool:
    return secure_comm_manager.security_config['force_https']
