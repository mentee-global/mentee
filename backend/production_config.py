"""
Production configuration for MENTEE application
Security-focused settings for production deployment
"""

import os


class ProductionConfig:
    """Production configuration settings with enhanced security"""

    # HTTPS and Security Settings
    PREFERRED_URL_SCHEME = "https"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = 3600  # 1 hour

    # Force HTTPS redirect
    FORCE_HTTPS = True

    # Content Security Policy headers
    SECURITY_HEADERS = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }

    # File upload security
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB

    @staticmethod
    def validate_production_environment():
        """Validate that all required production environment variables are set"""
        required_vars = [
            "MONGO_USER",
            "MONGO_PASSWORD",
            "MONGO_HOST",
            "MONGO_DB",
            "SENDGRID_API_KEY",
            "FIREBASE_API_KEY",
            "TWILIO_ACCOUNT_SID",
            "TWILIO_AUTH_TOKEN",
        ]

        missing_vars = []
        for var in required_vars:
            if not os.environ.get(var):
                missing_vars.append(var)

        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}"
            )

        return True
