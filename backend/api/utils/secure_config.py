import os
from typing import Dict, Any
from api.utils.secret_manager import secret_manager, get_secret
from api.core import logger

class SecureConfig:
    def __init__(self):
        self._config = self._load_config()
        self._validate_config()

    def _load_config(self) -> Dict[str, Any]:
        config = {
            'SECRET_KEY': get_secret('SECRET_KEY'),
            'FLASK_ENV': get_secret('FLASK_ENV', 'production'),
            'DEBUG': get_secret('DEBUG', 'False').lower() == 'true',
            'MONGODB_URI': get_secret('MONGODB_URI'),
            'MONGODB_DB_NAME': get_secret('MONGODB_DB_NAME', 'mentee_db'),
            'FIREBASE_CONFIG': {
                'type': 'service_account',
                'project_id': get_secret('FIREBASE_PROJECT_ID'),
                'private_key_id': get_secret('FIREBASE_PRIVATE_KEY_ID'),
                'private_key': get_secret('FIREBASE_PRIVATE_KEY', '').replace('\n', '\n'),
                'client_email': get_secret('FIREBASE_CLIENT_EMAIL'),
                'client_id': get_secret('FIREBASE_CLIENT_ID'),
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
                'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
                'client_x509_cert_url': f"https://www.googleapis.com/robot/v1/metadata/x509/{get_secret('FIREBASE_CLIENT_EMAIL', '')}"
            },
            'SECURITY_HEADERS': {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
                'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            'UPLOAD_FOLDER': get_secret('UPLOAD_FOLDER', 'uploads'),
            'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,
            'ALLOWED_IMAGE_TYPES': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            'ALLOWED_DOCUMENT_TYPES': [
                'application/pdf', 
                'text/plain', 
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            'SENDGRID_API_KEY': get_secret('SENDGRID_API_KEY'),
            'SENDGRID_FROM_EMAIL': get_secret('SENDGRID_FROM_EMAIL'),
            'TWILIO_ACCOUNT_SID': get_secret('TWILIO_ACCOUNT_SID'),
            'TWILIO_AUTH_TOKEN': get_secret('TWILIO_AUTH_TOKEN'),
            'TWILIO_PHONE_NUMBER': get_secret('TWILIO_PHONE_NUMBER'),
            'LOG_LEVEL': get_secret('LOG_LEVEL', 'INFO'),
            'LOG_FILE': get_secret('LOG_FILE', 'app.log'),
            'CORS_ORIGINS': get_secret('CORS_ORIGINS', '*').split(','),
            'RATE_LIMIT_STORAGE_URL': get_secret('RATE_LIMIT_STORAGE_URL'),
            'RATE_LIMIT_PER_MINUTE': int(get_secret('RATE_LIMIT_PER_MINUTE', '60')),
            'PERMANENT_SESSION_LIFETIME': int(get_secret('SESSION_LIFETIME_HOURS', '24')) * 3600,
            'SESSION_COOKIE_SECURE': get_secret('FLASK_ENV', 'production') == 'production',
            'SESSION_COOKIE_HTTPONLY': True,
            'SESSION_COOKIE_SAMESITE': 'Lax',
        }

        return config

    def _validate_config(self) -> None:
        errors = []

        required_keys = ['SECRET_KEY', 'MONGODB_URI']
        for key in required_keys:
            if not self._config.get(key):
                errors.append(f"Missing required configuration: {key}")

        firebase_config = self._config.get('FIREBASE_CONFIG', {})
        required_firebase_keys = ['project_id', 'private_key', 'client_email']
        for key in required_firebase_keys:
            if not firebase_config.get(key):
                errors.append(f"Missing required Firebase configuration: {key}")

        if self._config.get('DEBUG') and self._config.get('FLASK_ENV') == 'production':
            errors.append("DEBUG should not be enabled in production")

        if errors:
            for error in errors:
                logger.error(f"Configuration error: {error}")
            raise ValueError(f"Configuration validation failed: {'; '.join(errors)}")

    def get(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def get_masked_config(self) -> Dict[str, Any]:
        masked_config = {}

        for key, value in self._config.items():
            if self._is_sensitive_key(key):
                if isinstance(value, dict):
                    masked_config[key] = {k: self._mask_value(v) for k, v in value.items()}
                else:
                    masked_config[key] = self._mask_value(value)
            else:
                masked_config[key] = value

        return masked_config

    def _is_sensitive_key(self, key: str) -> bool:
        sensitive_keywords = [
            'key', 'secret', 'password', 'token', 'uri', 'private',
            'auth', 'credential', 'api', 'sid'
        ]
        return any(keyword in key.lower() for keyword in sensitive_keywords)

    def _mask_value(self, value: Any) -> str:
        if value is None:
            return "***None***"

        str_value = str(value)
        if len(str_value) <= 8:
            return "***MASKED***"

        return f"{str_value[:4]}***{str_value[-4:]}"

    def to_dict(self) -> Dict[str, Any]:
        return self._config.copy()

app_config = SecureConfig()

def get_config(key: str, default: Any = None) -> Any:
    return app_config.get(key, default)

def get_firebase_config() -> Dict[str, Any]:
    return app_config.get('FIREBASE_CONFIG', {})

def get_security_headers() -> Dict[str, str]:
    return app_config.get('SECURITY_HEADERS', {})

def is_production() -> bool:
    return app_config.get('FLASK_ENV') == 'production' and not app_config.get('DEBUG', False)
