import os


class WebSecurityMiddleware:
    """Adds a small set of standard, low-risk security response headers.

    Deliberately minimal: only the set-and-forget headers that protect every
    response with no per-integration allowlist to maintain. A full Content
    Security Policy and an in-memory rate limiter were evaluated and dropped --
    the CSP carried real breakage/maintenance cost (every new third-party
    integration can be silently blocked) for little benefit while it still
    allowed 'unsafe-inline' scripts, and the in-memory limiter was per-worker
    and non-authoritative. Both belong behind a dedicated effort (CSP via
    nonces; rate limiting via Redis/the edge) rather than here.
    """

    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        app.after_request(self.add_security_headers)

    @staticmethod
    def add_security_headers(response):
        # Stop MIME-type sniffing.
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Clickjacking defense -- the app is never meant to be framed.
        response.headers["X-Frame-Options"] = "DENY"
        # Don't leak full URLs to cross-origin destinations.
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Force HTTPS for a year in production. Gate on ENVIRONMENT, the same
        # flag create_app() uses for production-only cookie security (the app
        # does not set FLASK_ENV).
        if os.environ.get("ENVIRONMENT") == "production":
            response.headers[
                "Strict-Transport-Security"
            ] = "max-age=31536000; includeSubDomains"
        return response
