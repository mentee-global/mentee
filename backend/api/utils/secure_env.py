import os
import sys
from typing import Optional, List


class SecureEnvironmentManager:
    REQUIRED_VARS = [
        "MONGO_USER",
        "MONGO_PASSWORD",
        "MONGO_HOST",
        "MONGO_DB",
        "SENDGRID_API_KEY",
        "FIREBASE_API_KEY",
    ]

    OPTIONAL_VARS = [
        "IMGUR_KEY",
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_PHONE",
        "EIGHT_X_EIGHT_API_KEY",
        "EIGHT_X_EIGHT_APP_ID",
        "EIGHT_X_EIGHT_ENCODED_PRIVATE_KEY",
    ]

    @staticmethod
    def get_required_env(key: str, default: Optional[str] = None) -> str:
        """Get required environment variable with validation"""
        value = os.environ.get(key, default)
        if not value:
            raise ValueError(f"Required environment variable '{key}' is not set")

        if len(value.strip()) == 0:
            raise ValueError(f"Required environment variable '{key}' is empty")

        return value.strip()

    @staticmethod
    def get_optional_env(key: str, default: str = "") -> str:
        """Get optional environment variable"""
        return os.environ.get(key, default).strip()

    @staticmethod
    def validate_environment() -> List[str]:
        """Validate all required environment variables are set"""
        missing_vars = []

        for var in SecureEnvironmentManager.REQUIRED_VARS:
            try:
                SecureEnvironmentManager.get_required_env(var)
            except ValueError:
                missing_vars.append(var)

        return missing_vars

    @staticmethod
    def check_environment_security():
        """Check for potential security issues in environment setup"""
        warnings = []

        # Check if .env file exists (should not be committed)
        env_file_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_file_path):
            warnings.append("⚠️  .env file detected - ensure it's in .gitignore")

        # Check for production environment HTTPS enforcement
        flask_env = os.environ.get("FLASK_ENV", "development")
        if flask_env == "production":
            if not os.environ.get("FORCE_HTTPS"):
                warnings.append("⚠️  FORCE_HTTPS not set in production environment")

        # Check for default/weak values
        mongo_pass = os.environ.get("MONGO_PASSWORD", "")
        if mongo_pass and len(mongo_pass) < 12:
            warnings.append("⚠️  MongoDB password appears weak (< 12 characters)")

        # Check for test values in production
        sendgrid_key = os.environ.get("SENDGRID_API_KEY", "")
        if sendgrid_key and (
            "test" in sendgrid_key.lower() or "dev" in sendgrid_key.lower()
        ):
            warnings.append("⚠️  SendGrid API key appears to be a test/dev key")

        return warnings


def get_mongo_connection_string() -> str:
    user = SecureEnvironmentManager.get_required_env("MONGO_USER")
    password = SecureEnvironmentManager.get_required_env("MONGO_PASSWORD")
    host = SecureEnvironmentManager.get_required_env("MONGO_HOST")
    db = SecureEnvironmentManager.get_required_env("MONGO_DB")

    return host % (user, password, db)


def get_firebase_credentials() -> dict:
    return {
        "api_key": SecureEnvironmentManager.get_required_env("FIREBASE_API_KEY"),
        "credentials_path": SecureEnvironmentManager.get_optional_env(
            "GOOGLE_APPLICATION_CREDENTIALS", "firebase_service_key.json"
        ),
    }


def get_sendgrid_config() -> dict:
    return {
        "api_key": SecureEnvironmentManager.get_required_env("SENDGRID_API_KEY"),
        "sender_email": SecureEnvironmentManager.get_optional_env(
            "SENDER_EMAIL", "noreply@menteeglobal.org"
        ),
    }


def get_twilio_config() -> dict:
    """Get Twilio configuration securely"""
    return {
        "account_sid": SecureEnvironmentManager.get_optional_env("TWILIO_ACCOUNT_SID"),
        "auth_token": SecureEnvironmentManager.get_optional_env("TWILIO_AUTH_TOKEN"),
        "phone": SecureEnvironmentManager.get_optional_env("TWILIO_PHONE"),
    }


def initialize_secure_environment():
    print("🔒 Initializing secure environment...")

    missing_vars = SecureEnvironmentManager.validate_environment()
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("📝 Please check your .env file against .env.example")
        sys.exit(1)

    warnings = SecureEnvironmentManager.check_environment_security()
    for warning in warnings:
        print(warning)

    print("✅ Environment validation completed")
    return True
