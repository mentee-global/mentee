import os
import re
from urllib.parse import urlparse


class SecureCommunicationValidator:
    @staticmethod
    def validate_url_security(url):
        if not url:
            return True

        parsed = urlparse(url)
        if parsed.scheme and parsed.scheme.lower() == "http":
            if parsed.hostname in ["localhost", "127.0.0.1", "0.0.0.0"]:
                return True
            return False

        return True

    @staticmethod
    def validate_external_api_urls():
        """Validate that all external API URLs use HTTPS"""
        insecure_urls = []

        api_keys_to_check = [
            "SENDGRID_API_URL",
            "FIREBASE_AUTH_URL",
            "TWILIO_API_URL",
            "IMGUR_API_URL",
        ]

        for key in api_keys_to_check:
            url = os.environ.get(key, "")
            if url and not SecureCommunicationValidator.validate_url_security(url):
                insecure_urls.append(f"{key}: {url}")

        return insecure_urls

    @staticmethod
    def check_secure_configuration():
        issues = []

        flask_env = os.environ.get("FLASK_ENV", "development")

        if flask_env == "production":
            if not os.environ.get("FORCE_HTTPS"):
                issues.append("FORCE_HTTPS not set in production environment")

            required_secure_settings = [
                "SESSION_COOKIE_SECURE should be True",
                "SESSION_COOKIE_HTTPONLY should be True",
                "PREFERRED_URL_SCHEME should be https",
            ]

            for setting in required_secure_settings:
                pass

        return issues

    @staticmethod
    def validate_request_security(request_url):
        """Validate that an incoming request URL is secure in production"""
        flask_env = os.environ.get("FLASK_ENV", "development")

        if flask_env == "production":
            parsed = urlparse(request_url)
            if parsed.scheme and parsed.scheme.lower() == "http":
                return False, "HTTP requests not allowed in production"

        return True, "Request is secure"

    @staticmethod
    def get_security_report():
        report = {
            "secure_communication_status": "SECURE",
            "issues": [],
            "recommendations": [],
        }

        # Check external API URLs
        insecure_apis = SecureCommunicationValidator.validate_external_api_urls()
        if insecure_apis:
            report["issues"].extend(insecure_apis)
            report["secure_communication_status"] = "VULNERABLE"

        # Check configuration
        config_issues = SecureCommunicationValidator.check_secure_configuration()
        if config_issues:
            report["issues"].extend(config_issues)
            if report["secure_communication_status"] != "VULNERABLE":
                report["secure_communication_status"] = "NEEDS_ATTENTION"

        # Add recommendations
        flask_env = os.environ.get("FLASK_ENV", "development")
        if flask_env == "production":
            report["recommendations"].extend(
                [
                    "Ensure SSL certificate is properly configured",
                    "Test HTTPS redirect functionality",
                    "Verify security headers are being sent",
                    "Monitor for mixed content warnings",
                ]
            )

        return report
