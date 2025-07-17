"""
Standalone Secure Communication Implementation.
"""

import os
import json
import time
import logging
from typing import Dict, Any, Optional, List
from api.utils.secure_config import get_config, is_production

logger = logging.getLogger(__name__)

class StandaloneSecureCommunication:
    def __init__(self):
        self.config = self._load_config()
        self.security_headers = self._build_security_headers()

    def _load_config(self) -> Dict[str, Any]:
        return {
            'force_https': get_config('FORCE_HTTPS', is_production()),
            'enable_hsts': get_config('ENABLE_HSTS', 'true').lower() == 'true',
            'enable_csp': get_config('ENABLE_CSP', 'true').lower() == 'true',
            'enable_frame_options': get_config('ENABLE_FRAME_OPTIONS', 'true').lower() == 'true',
            'session_secure': get_config('SESSION_SECURE', is_production()),
            'websocket_origins': [o.strip() for o in get_config('WS_ALLOWED_ORIGINS', '').split(',') if o.strip()],
            'security_logging': get_config('SECURITY_LOGGING', 'true').lower() == 'true'
        }

    def _build_security_headers(self) -> Dict[str, str]:
        headers = {}

        if self.config['enable_hsts']:
            headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

        if self.config['enable_csp']:
            if is_production():
                csp = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline'; "
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self' wss: https:; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self'; "
                    "upgrade-insecure-requests"
                )
            else:
                csp = (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self' ws: wss: http: https:; "
                    "frame-ancestors 'none'"
                )
            headers['Content-Security-Policy'] = csp

        if self.config['enable_frame_options']:
            headers['X-Frame-Options'] = 'DENY'

        headers.update({
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
            'X-Permitted-Cross-Domain-Policies': 'none',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin'
        })

        return headers

    def configure_flask_app(self, app):
        logger.info("Configuring standalone secure communication...")

        app.config.update({
            'SESSION_COOKIE_SECURE': self.config['session_secure'],
            'SESSION_COOKIE_HTTPONLY': True,
            'SESSION_COOKIE_SAMESITE': 'Lax',
            'PERMANENT_SESSION_LIFETIME': 3600
        })

        @app.after_request
        def add_security_headers(response):
            for header, value in self.security_headers.items():
                if header not in response.headers:
                    response.headers[header] = value

            response.headers.pop('Server', None)
            response.headers.pop('X-Powered-By', None)

            return response

        if self.config['force_https']:
            @app.before_request
            def force_https():
                try:
                    from flask import request, redirect, abort

                    if (not request.is_secure and 
                        request.headers.get('X-Forwarded-Proto') != 'https' and
                        request.headers.get('X-Forwarded-SSL') != 'on'):

                        if request.method == 'GET':
                            secure_url = request.url.replace('http://', 'https://', 1)
                            return redirect(secure_url, code=301)
                        else:
                            abort(426)

                except ImportError:
                    if self.config['security_logging']:
                        logger.warning("Flask not available for HTTPS enforcement")

        if self.config['websocket_origins']:
            @app.before_request
            def validate_websocket_origin():
                try:
                    from flask import request, abort

                    if request.path.startswith('/socket.io/'):
                        origin = request.headers.get('Origin')
                        if origin and origin not in self.config['websocket_origins']:
                            if self.config['security_logging']:
                                logger.warning(f"WebSocket connection from unauthorized origin: {origin}")
                            abort(403)

                except ImportError:
                    pass

        logger.info("Standalone secure communication configured")
        return app

    def validate_configuration(self) -> Dict[str, Any]:
        validation = {
            'valid': True,
            'warnings': [],
            'errors': [],
            'security_status': {}
        }

        if is_production() and not self.config['force_https']:
            validation['warnings'].append("HTTPS not enforced in production")

        if is_production() and not self.config['session_secure']:
            validation['warnings'].append("Secure session cookies not enabled in production")

        if not self.config['websocket_origins'] and is_production():
            validation['warnings'].append("No WebSocket origins configured for production")

        validation['security_status'] = {
            'https_enforced': self.config['force_https'],
            'hsts_enabled': self.config['enable_hsts'],
            'csp_enabled': self.config['enable_csp'],
            'frame_protection': self.config['enable_frame_options'],
            'secure_sessions': self.config['session_secure'],
            'websocket_origins_configured': len(self.config['websocket_origins']) > 0
        }

        validation['valid'] = len(validation['errors']) == 0
        return validation

    def generate_security_report(self) -> Dict[str, Any]:
        validation = self.validate_configuration()

        report = {
            'timestamp': time.time(),
            'environment': 'production' if is_production() else 'development',
            'configuration': self.config,
            'security_headers': list(self.security_headers.keys()),
            'validation': validation,
            'recommendations': self._generate_recommendations(validation)
        }

        return report

    def _generate_recommendations(self, validation: Dict[str, Any]) -> List[str]:
        recommendations = []

        recommendations.extend(validation.get('warnings', []))

        if is_production():
            if not validation['security_status']['https_enforced']:
                recommendations.append("Enable HTTPS enforcement for production")

            if not validation['security_status']['secure_sessions']:
                recommendations.append("Enable secure session cookies for production")

        ssl_cert_path = get_config('SSL_CERT_PATH', '')
        if is_production() and not ssl_cert_path:
            recommendations.append("Configure SSL certificate path for production")

        return recommendations

class SimpleWebSocketSecurity:
    def __init__(self):
        self.config = {
            'allowed_origins': [o.strip() for o in get_config('WS_ALLOWED_ORIGINS', '').split(',') if o.strip()],
            'require_auth': get_config('WS_REQUIRE_AUTH', 'true').lower() == 'true',
            'max_connections': int(get_config('WS_MAX_CONNECTIONS', '100')),
            'rate_limit': int(get_config('WS_RATE_LIMIT', '30'))
        }
        self.connections = {}
        self.connection_count = 0

    def validate_connection(self, origin: str, session_data: Dict[str, Any] = None) -> bool:
        if self.config['allowed_origins'] and origin not in self.config['allowed_origins']:
            logger.warning(f"WebSocket connection from unauthorized origin: {origin}")
            return False

        if self.config['require_auth'] and session_data:
            if not session_data.get('user_id'):
                logger.warning("Unauthenticated WebSocket connection attempted")
                return False

        if self.connection_count >= self.config['max_connections']:
            logger.warning("WebSocket connection limit exceeded")
            return False

        return True

    def track_connection(self, connection_id: str, user_id: str = None):
        self.connections[connection_id] = {
            'user_id': user_id,
            'connected_at': time.time(),
            'message_count': 0
        }
        self.connection_count += 1
        logger.info(f"WebSocket connection tracked: {connection_id}")

    def remove_connection(self, connection_id: str):
        if connection_id in self.connections:
            del self.connections[connection_id]
            self.connection_count -= 1
            logger.info(f"WebSocket connection removed: {connection_id}")

    def get_security_status(self) -> Dict[str, Any]:
        return {
            'active_connections': self.connection_count,
            'max_connections': self.config['max_connections'],
            'origin_validation': len(self.config['allowed_origins']) > 0,
            'authentication_required': self.config['require_auth'],
            'rate_limiting': self.config['rate_limit'] > 0
        }

standalone_security = StandaloneSecureCommunication()
websocket_security = SimpleWebSocketSecurity()

def configure_secure_app(app):
    return standalone_security.configure_flask_app(app)

def validate_security_config() -> Dict[str, Any]:
    return standalone_security.validate_configuration()

def generate_security_report() -> Dict[str, Any]:
    flask_report = standalone_security.generate_security_report()
    websocket_report = websocket_security.get_security_status()

    return {
        'flask_security': flask_report,
        'websocket_security': websocket_report,
        'overall_status': 'configured',
        'recommendations': flask_report.get('recommendations', [])
    }

def get_security_headers() -> Dict[str, str]:
    return standalone_security.security_headers.copy()

def is_security_configured() -> bool:
    validation = validate_security_config()
    return validation['valid'] and len(validation['errors']) == 0
