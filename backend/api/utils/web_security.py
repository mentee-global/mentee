import time
import html
import os
import hashlib
from collections import defaultdict, deque
from functools import wraps

from flask import jsonify, request, session


# Origins this app actually depends on at runtime. Keep the CSP/Permissions
# allowlists in sync with these when integrations change.
VIDEO_ORIGIN = (
    "https://8x8.vc"  # 8x8 JaaS video, embedded as an iframe via @jitsi/react-sdk
)

# Auth views that are abuse-prone and unauthenticated. Listed as exact
# "<blueprint>.<view>" endpoint names so the global guard does NOT sweep in
# token refresh / logout (which active users hit routinely and would otherwise
# be locked out of, especially when sharing an institutional NAT IP).
SENSITIVE_AUTH_ENDPOINTS = {
    "auth.login",
    "auth.register",
    "auth.newregister",
    "auth.forgot_password",
    "auth.verify_email",
}
AUTH_RATE_LIMIT_MAX_REQUESTS = 20
AUTH_RATE_LIMIT_WINDOW_SECONDS = 600


class XSSProtection:
    """Comprehensive XSS protection utilities"""

    @staticmethod
    def sanitize_input(input_data):
        """Sanitize user input to prevent XSS"""
        if isinstance(input_data, str):
            # Remove script tags and dangerous HTML
            import re

            cleaned = re.sub(
                r"<script[^>]*?>.*?</script>",
                "",
                input_data,
                flags=re.IGNORECASE | re.DOTALL,
            )
            cleaned = re.sub(r"<.*?>", "", cleaned)  # Remove all HTML tags
            return cleaned.strip()
        elif isinstance(input_data, dict):
            return {
                key: XSSProtection.sanitize_input(value)
                for key, value in input_data.items()
            }
        elif isinstance(input_data, list):
            return [XSSProtection.sanitize_input(item) for item in input_data]
        else:
            return input_data

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
    def generate_csp_header():
        """Generate the Content Security Policy header.

        This Flask app serves the React SPA (static index.html via the catch-all),
        so the CSP is enforced on the real app document, not just JSON. The
        allowlist reflects the origins the app genuinely needs:
          - Firebase Auth: identitytoolkit / securetoken / *.firebaseapp.com
          - Firebase Realtime DB (if used): *.firebaseio.com
          - 8x8 JaaS video embedded as an iframe (8x8.vc) -> frame/script/connect
          - Google Fonts and Imgur image hosting
        ``frame-ancestors 'none'`` blocks clickjacking and supersedes the
        per-/oauth/* protection in api/utils/oauth_server.py.

        NOTE: a CSP over a Firebase + Jitsi SPA cannot be fully verified
        statically. After deploy, smoke-test: login, image load, file
        upload/download, and a live video call.
        """
        return (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://apis.google.com "
            f"https://www.gstatic.com {VIDEO_ORIGIN}; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' data: https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            f"media-src 'self' blob: {VIDEO_ORIGIN}; "
            "connect-src 'self' https://*.googleapis.com "
            "https://identitytoolkit.googleapis.com https://securetoken.googleapis.com "
            "https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com "
            f"https://api.imgur.com {VIDEO_ORIGIN} wss://*.8x8.vc; "
            f"frame-src 'self' {VIDEO_ORIGIN}; "
            "worker-src 'self' blob:; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "frame-ancestors 'none';"
        )

    @staticmethod
    def get_csp_header():
        return XSSProtection.generate_csp_header()


class CSRFProtection:
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
    def __init__(self):
        self.requests = defaultdict(deque)
        self.blocked_ips = {}

    def _get_client_id(self):
        # X-Forwarded-For is "client, proxy1, proxy2"; the left-most entry is
        # the originating client. Using the whole header (as before) made every
        # proxy hop part of the key and split a single client across buckets.
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        client_ip = (
            forwarded_for.split(",")[0].strip()
            if forwarded_for
            else (request.remote_addr or "unknown")
        )
        user_agent = request.headers.get("User-Agent", "unknown")
        return hashlib.md5(f"{client_ip}:{user_agent}".encode()).hexdigest()

    def _cleanup_old_requests(self, client_id, window_seconds):
        now = time.time()
        requests_queue = self.requests[client_id]

        while requests_queue and requests_queue[0] < now - window_seconds:
            requests_queue.popleft()

        # Don't retain empty deques for one-off clients (bounds memory growth;
        # the defaultdict recreates the key on the next request if needed).
        if not requests_queue:
            del self.requests[client_id]

    def is_rate_limited(
        self, client_id=None, max_requests=60, window_seconds=60, endpoint=None
    ):
        if client_id is None:
            client_id = self._get_client_id()

        # Segregate counters per endpoint so, e.g., login attempts don't drain
        # the registration budget for the same client (the endpoint arg used to
        # be accepted but ignored, collapsing every endpoint into one bucket).
        if endpoint:
            client_id = f"{endpoint}:{client_id}"

        if client_id in self.blocked_ips:
            if time.time() < self.blocked_ips[client_id]:
                return True, "IP temporarily blocked due to excessive requests"
            else:
                del self.blocked_ips[client_id]

        self._cleanup_old_requests(client_id, window_seconds)

        current_requests = len(self.requests[client_id])

        if current_requests >= max_requests:
            self.blocked_ips[client_id] = time.time() + 900  # 15 minutes
            return (
                True,
                f"Rate limit exceeded: {max_requests} requests per {window_seconds} seconds",
            )

        self.requests[client_id].append(time.time())
        return False, None

    def rate_limit(self, max_requests=60, window_seconds=60, endpoint=None):
        """Rate limiting decorator"""

        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                is_limited, message = self.is_rate_limited(
                    client_id=None,
                    max_requests=max_requests,
                    window_seconds=window_seconds,
                    endpoint=endpoint,
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


rate_limiter = RateLimiter()


def auth_rate_limit(f):
    return rate_limiter.rate_limit(max_requests=5, window_seconds=300, endpoint="auth")(
        f
    )


def api_rate_limit(f):
    return rate_limiter.rate_limit(max_requests=100, window_seconds=60, endpoint="api")(
        f
    )


def upload_rate_limit(f):
    return rate_limiter.rate_limit(
        max_requests=10, window_seconds=300, endpoint="upload"
    )(f)


class WebSecurityMiddleware:
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        app.after_request(self.add_security_headers)
        app.before_request(self.security_check)

        @app.route("/api/csrf-token", methods=["GET"])
        def csrf_token():
            return jsonify({"csrf_token": CSRFProtection.generate_csrf_token()})

    def add_security_headers(self, response):
        """Add comprehensive security headers"""

        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"

        response.headers["Content-Security-Policy"] = XSSProtection.get_csp_header()

        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Camera/microphone/display-capture must stay enabled for self and the
        # 8x8 video iframe, otherwise the top-level policy blocks video calls
        # even though the iframe requests the permissions. Geolocation is off.
        response.headers["Permissions-Policy"] = self._permissions_policy()

        if os.environ.get("FLASK_ENV") == "production":
            response.headers[
                "Strict-Transport-Security"
            ] = "max-age=31536000; includeSubDomains"

        return response

    @staticmethod
    def _permissions_policy():
        return (
            "geolocation=(), "
            f'camera=(self "{VIDEO_ORIGIN}"), '
            f'microphone=(self "{VIDEO_ORIGIN}"), '
            f'display-capture=(self "{VIDEO_ORIGIN}")'
        )

    def add_security_headers_dict(self, headers_dict):
        """Add security headers to a dictionary (for validation)"""
        headers_dict["X-XSS-Protection"] = "1; mode=block"
        headers_dict["X-Content-Type-Options"] = "nosniff"
        headers_dict["X-Frame-Options"] = "DENY"
        headers_dict["Content-Security-Policy"] = XSSProtection.get_csp_header()
        headers_dict["Referrer-Policy"] = "strict-origin-when-cross-origin"
        headers_dict["Permissions-Policy"] = self._permissions_policy()
        headers_dict[
            "Strict-Transport-Security"
        ] = "max-age=31536000; includeSubDomains"

    def security_check(self):
        # Only throttle the abuse-prone, unauthenticated auth actions. Token
        # refresh and logout are intentionally excluded (see
        # SENSITIVE_AUTH_ENDPOINTS) so active sessions are never locked out.
        if request.method != "POST" or request.endpoint not in SENSITIVE_AUTH_ENDPOINTS:
            return

        is_limited, _ = rate_limiter.is_rate_limited(
            client_id=None,
            max_requests=AUTH_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=AUTH_RATE_LIMIT_WINDOW_SECONDS,
            endpoint=request.endpoint,
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
