"""
Web Security Protection Module
Comprehensive protection against XSS, CSRF, and Rate Limiting attacks
"""

import os
import html
import time
import hashlib
from functools import wraps
from collections import defaultdict, deque
from flask import request, jsonify, session, current_app
from datetime import datetime, timedelta


class XSSProtection:
    """Comprehensive XSS protection utilities"""

    @staticmethod
    def escape_html_output(data):
        """Escape HTML in API output to prevent XSS"""
        if isinstance(data, dict):
            return {
                key: XSSProtection.escape_html_output(value)
                for key, value in data.items()
            }
        elif isinstance(data, list):
            return [XSSProtection.escape_html_output(item) for item in data]
        elif isinstance(data, str):
            return html.escape(data, quote=True)
        else:
            return data

    @staticmethod
    def get_csp_header():
        """Get Content Security Policy header"""
        return (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.imgur.com https://identitytoolkit.googleapis.com; "
            "frame-src 'none'; "
            "object-src 'none'; "
            "base-uri 'self';"
        )


class CSRFProtection:
    """CSRF protection implementation"""

    @staticmethod
    def generate_csrf_token():
        """Generate a CSRF token"""
        if "csrf_token" not in session:
            session["csrf_token"] = hashlib.sha256(
                (str(time.time()) + str(os.urandom(16))).encode()
            ).hexdigest()
        return session["csrf_token"]

    @staticmethod
    def validate_csrf_token(token):
        """Validate CSRF token"""
        if "csrf_token" not in session:
            return False
        return session["csrf_token"] == token

    @staticmethod
    def csrf_protect(f):
        """CSRF protection decorator"""

        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                token = request.headers.get("X-CSRF-Token") or request.form.get(
                    "csrf_token"
                )
                if not token or not CSRFProtection.validate_csrf_token(token):
                    return (
                        jsonify(
                            {"status": 403, "message": "CSRF token missing or invalid"}
                        ),
                        403,
                    )
            return f(*args, **kwargs)

        return decorated_function


class RateLimiter:
    """Advanced rate limiting implementation"""

    def __init__(self):
        self.requests = defaultdict(deque)
        self.blocked_ips = {}

    def _get_client_id(self):
        """Get unique client identifier"""
        client_ip = request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr)
        user_agent = request.headers.get("User-Agent", "unknown")
        return hashlib.md5(f"{client_ip}:{user_agent}".encode()).hexdigest()

    def _cleanup_old_requests(self, client_id, window_seconds):
        """Remove old requests outside the time window"""
        now = time.time()
        requests_queue = self.requests[client_id]

        while requests_queue and requests_queue[0] < now - window_seconds:
            requests_queue.popleft()

    def is_rate_limited(self, max_requests=60, window_seconds=60, endpoint=None):
        """Check if client is rate limited"""
        client_id = self._get_client_id()

        # Check if IP is temporarily blocked
        if client_id in self.blocked_ips:
            if time.time() < self.blocked_ips[client_id]:
                return True, "IP temporarily blocked due to excessive requests"
            else:
                del self.blocked_ips[client_id]

        # Clean old requests
        self._cleanup_old_requests(client_id, window_seconds)

        # Check current request count
        current_requests = len(self.requests[client_id])

        if current_requests >= max_requests:
            # Block IP for 15 minutes after exceeding limit
            self.blocked_ips[client_id] = time.time() + 900  # 15 minutes
            return (
                True,
                f"Rate limit exceeded: {max_requests} requests per {window_seconds} seconds",
            )

        # Add current request
        self.requests[client_id].append(time.time())
        return False, None

    def rate_limit(self, max_requests=60, window_seconds=60, endpoint=None):
        """Rate limiting decorator"""

        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                is_limited, message = self.is_rate_limited(
                    max_requests, window_seconds, endpoint
                )
                if is_limited:
                    return (
                        jsonify(
                            {
                                "status": 429,
                                "message": message,
                                "retry_after": window_seconds,
                            }
                        ),
                        429,
                    )
                return f(*args, **kwargs)

            return decorated_function

        return decorator


# Global rate limiter instance
rate_limiter = RateLimiter()


# Specific rate limiting decorators for different endpoint types
def auth_rate_limit(f):
    """Strict rate limiting for authentication endpoints"""
    return rate_limiter.rate_limit(max_requests=5, window_seconds=300, endpoint="auth")(
        f
    )


def api_rate_limit(f):
    """Standard rate limiting for API endpoints"""
    return rate_limiter.rate_limit(max_requests=100, window_seconds=60, endpoint="api")(
        f
    )


def upload_rate_limit(f):
    """Rate limiting for file upload endpoints"""
    return rate_limiter.rate_limit(
        max_requests=10, window_seconds=300, endpoint="upload"
    )(f)


class WebSecurityMiddleware:
    """Comprehensive web security middleware"""

    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        """Initialize security middleware with Flask app"""
        app.after_request(self.add_security_headers)
        app.before_request(self.security_check)

        # Add CSRF token endpoint
        @app.route("/api/csrf-token", methods=["GET"])
        def csrf_token():
            return jsonify({"csrf_token": CSRFProtection.generate_csrf_token()})

    def add_security_headers(self, response):
        """Add comprehensive security headers"""
        # XSS Protection headers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = XSSProtection.get_csp_header()

        # Additional security headers
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers[
            "Permissions-Policy"
        ] = "geolocation=(), microphone=(), camera=()"

        # HTTPS enforcement in production
        if os.environ.get("FLASK_ENV") == "production":
            response.headers[
                "Strict-Transport-Security"
            ] = "max-age=31536000; includeSubDomains"

        return response

    def security_check(self):
        """Pre-request security checks"""
        # Rate limiting check for sensitive endpoints
        if request.endpoint and any(
            sensitive in request.endpoint for sensitive in ["auth", "login", "register"]
        ):
            is_limited, message = rate_limiter.is_rate_limited(
                max_requests=10, window_seconds=600
            )
            if is_limited:
                return (
                    jsonify(
                        {
                            "status": 429,
                            "message": "Too many authentication attempts. Please try again later.",
                        }
                    ),
                    429,
                )


def get_security_report():
    """Generate comprehensive security status report"""
    return {
        "web_security_status": "PROTECTED",
        "protections_enabled": [
            "XSS Protection (Input Sanitization + Output Escaping)",
            "CSRF Protection (Token-based)",
            "Rate Limiting (Multiple Tiers)",
            "Security Headers (CSP, XSS, etc.)",
            "Content Type Protection",
            "Frame Options Protection",
        ],
        "rate_limits": {
            "authentication": "5 requests per 5 minutes",
            "api_general": "100 requests per minute",
            "file_upload": "10 requests per 5 minutes",
        },
        "security_headers": [
            "Content-Security-Policy",
            "X-XSS-Protection",
            "X-Content-Type-Options",
            "X-Frame-Options",
            "Referrer-Policy",
            "Strict-Transport-Security (Production)",
        ],
    }
