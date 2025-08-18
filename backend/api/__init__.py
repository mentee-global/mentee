import os
import logging
import firebase_admin
import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

from flask import Flask, request, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO

from api.core import all_exception_handler
from api.utils.secure_env import (
    initialize_secure_environment,
    get_mongo_connection_string,
    SecureEnvironmentManager,
)
from api.utils.web_security import WebSecurityMiddleware, XSSProtection
from dotenv import load_dotenv

load_dotenv()
socketio = SocketIO(async_mode="threading", cors_allowed_origins="*")


class RequestFormatter(logging.Formatter):
    """Secure logging formatter that sanitizes URLs and IP addresses"""

    # Sensitive query parameters that should be redacted
    SENSITIVE_PARAMS = {
        "token",
        "password",
        "secret",
        "key",
        "api_key",
        "access_token",
        "refresh_token",
        "session_id",
        "auth",
        "authorization",
        "csrf_token",
        "reset_token",
        "verification_token",
        "invite_token",
        "temp_password",
    }

    def sanitize_url(self, url):
        """Sanitize URL by removing or redacting sensitive query parameters"""
        try:
            parsed = urlparse(url)
            if not parsed.query:
                return url

            # Parse query parameters
            query_params = parse_qs(parsed.query, keep_blank_values=True)
            sanitized_params = {}

            for key, values in query_params.items():
                # Check if parameter name contains sensitive keywords
                key_lower = key.lower()
                is_sensitive = any(
                    sensitive in key_lower for sensitive in self.SENSITIVE_PARAMS
                )

                if is_sensitive:
                    # Redact sensitive parameters
                    sanitized_params[key] = ["[REDACTED]"] * len(values)
                else:
                    sanitized_params[key] = values

            # Reconstruct URL with sanitized parameters (don't encode REDACTED)
            sanitized_query_parts = []
            for key, values in sanitized_params.items():
                for value in values:
                    if value == "[REDACTED]":
                        sanitized_query_parts.append(f"{key}=[REDACTED]")
                    else:
                        sanitized_query_parts.append(f"{key}={value}")

            sanitized_query = "&".join(sanitized_query_parts)
            sanitized_parsed = parsed._replace(query=sanitized_query)
            return urlunparse(sanitized_parsed)

        except Exception:
            # If URL parsing fails, return a safe fallback
            return "[URL_PARSE_ERROR]"

    def anonymize_ip(self, ip_addr):
        """Anonymize IP address for privacy compliance"""
        try:
            # For IPv4, mask the last octet
            if "." in ip_addr and ip_addr.count(".") == 3:
                parts = ip_addr.split(".")
                return f"{parts[0]}.{parts[1]}.{parts[2]}.xxx"
            # For IPv6, mask the last 4 segments
            elif ":" in ip_addr:
                parts = ip_addr.split(":")
                if len(parts) >= 4:
                    return ":".join(parts[:-4]) + ":xxxx:xxxx:xxxx:xxxx"
            return ip_addr
        except Exception:
            return "[IP_ANONYMIZED]"

    def format(self, record):
        """Format log record with sanitized URL and anonymized IP"""
        try:
            # Sanitize URL to remove sensitive query parameters
            record.url = self.sanitize_url(request.url)
            # Anonymize IP address for privacy
            record.remote_addr = self.anonymize_ip(request.remote_addr)
        except RuntimeError:
            # Outside of request context
            record.url = "[NO_REQUEST_CONTEXT]"
            record.remote_addr = "[NO_REQUEST_CONTEXT]"
        except Exception:
            # Any other error
            record.url = "[URL_ERROR]"
            record.remote_addr = "[IP_ERROR]"

        return super().format(record)


# why we use application factories http://flask.pocoo.org/docs/1.0/patterns/appfactories/#app-factories
def create_app():
    """
    The flask application factory. To run the app somewhere else you can:
    ```
    from api import create_app
    app = create_app()

    if __main__ == "__name__":
        app.run()
    """

    initialize_secure_environment()

    app = Flask(__name__, static_folder="../../frontend/artifacts", static_url_path="")

    # Security Configuration
    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

    # Session Configuration for CSRF protection
    app.config["SECRET_KEY"] = (
        SecureEnvironmentManager.get_required_env("SECRET_KEY")
        if os.environ.get("SECRET_KEY")
        else os.urandom(32).hex()
    )

    # HTTPS and Security Settings
    app.config["PREFERRED_URL_SCHEME"] = "https"
    # Only use secure cookies in production
    is_production = os.environ.get("FLASK_ENV") == "production"
    app.config["SESSION_COOKIE_SECURE"] = is_production
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["PERMANENT_SESSION_LIFETIME"] = 3600  # 1 hour

    # Force HTTPS in production
    if os.environ.get("FLASK_ENV") == "production":
        app.config["FORCE_HTTPS"] = True

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return {"message": "File too large (max 50MB)", "status": 413}, 413

    # Configure CORS with credentials support for CSRF tokens
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    )

    # Initialize Web Security Middleware
    security_middleware = WebSecurityMiddleware(app)

    # HTTPS Redirect Middleware
    @app.before_request
    def force_https():
        if app.config.get("FORCE_HTTPS") and not request.is_secure:
            if request.url.startswith("http://"):
                url = request.url.replace("http://", "https://", 1)
                return redirect(url, code=301)

    # Enhanced Security Headers with XSS Protection
    @app.after_request
    def add_security_headers(response):
        if app.config.get("FORCE_HTTPS"):
            response.headers[
                "Strict-Transport-Security"
            ] = "max-age=31536000; includeSubDomains"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Apply XSS protection to JSON responses
        if response.is_json and hasattr(response, "json"):
            try:
                json_data = response.get_json()
                if json_data:
                    protected_data = XSSProtection.escape_html_output(json_data)
                    response.set_data(app.json.dumps(protected_data))
            except:
                pass  # Skip if JSON parsing fails

        return response

    # logging
    formatter = RequestFormatter(
        "%(asctime)s %(remote_addr)s: requested %(url)s: %(levelname)s in [%(module)s: %(lineno)d]: %(message)s"
    )
    app.config["LOG_FILE"] = "app.log"
    if app.config.get("LOG_FILE"):
        fh = logging.FileHandler(app.config.get("LOG_FILE"))
        fh.setLevel(logging.DEBUG)
        fh.setFormatter(formatter)
        app.logger.addHandler(fh)

    strm = logging.StreamHandler()
    strm.setLevel(logging.DEBUG)
    strm.setFormatter(formatter)

    gunicorn_error_logger = logging.getLogger("gunicorn.error")
    app.logger.handlers.extend(gunicorn_error_logger.handlers)
    app.logger.addHandler(strm)
    app.logger.setLevel(logging.DEBUG)

    root = logging.getLogger("core")
    root.addHandler(strm)

    # Get MongoDB configuration securely
    try:
        user = SecureEnvironmentManager.get_required_env("MONGO_USER")
        password = SecureEnvironmentManager.get_required_env("MONGO_PASSWORD")
        db = SecureEnvironmentManager.get_required_env("MONGO_DB")
        host = SecureEnvironmentManager.get_required_env("MONGO_HOST")
    except ValueError as e:
        raise ValueError(f"MongoDB configuration error: {e}")

    mongo_uri = get_mongo_connection_string()
    app.config["MONGODB_SETTINGS"] = {"db": db, "host": mongo_uri}
    # app.config["MONGODB_SETTINGS"] = {
    #     "db": "mentee",
    #     "host": "localhost",
    #     "port": 27017,
    # }
    # firebase
    if not firebase_admin._apps:
        firebase_admin.initialize_app()

    # register mongoengine to this app
    from api.models import db

    db.init_app(app)  # initialize Flask MongoEngine with this flask app
    Migrate(app, db)

    # import and register blueprints
    from api.views import (
        app_blueprint,
        main,
        auth,
        appointment,
        availability,
        verify,
        apply,
        admin,
        download,
        mentee,
        messages,
        notifications,
        training,
        admin_notifications,
        masters,
        translation,
        events,
        announcement,
        meeting,
    )

    # why blueprints http://flask.pocoo.org/docs/1.0/blueprints/
    app.register_blueprint(app_blueprint.app_blueprint)
    app.register_blueprint(main.main, url_prefix="/api")
    app.register_blueprint(auth.auth, url_prefix="/auth")
    app.register_blueprint(appointment.appointment, url_prefix="/api/appointment")
    app.register_blueprint(availability.availability, url_prefix="/api/availability")
    app.register_blueprint(verify.verify, url_prefix="/api")
    app.register_blueprint(apply.apply, url_prefix="/api/application")
    app.register_blueprint(training.training, url_prefix="/api/training")
    app.register_blueprint(
        admin_notifications.admin_notifications, url_prefix="/api/notifys"
    )
    app.register_blueprint(admin.admin, url_prefix="/api")
    app.register_blueprint(download.download, url_prefix="/api/download")
    app.register_blueprint(mentee.mentee, url_prefix="/api/mentee")
    app.register_blueprint(messages.messages, url_prefix="/api/messages")
    app.register_blueprint(notifications.notifications, url_prefix="/api/notifications")
    app.register_blueprint(meeting.meeting, url_prefix="/api/meeting")
    app.register_blueprint(masters.masters, url_prefix="/api/masters")
    app.register_blueprint(translation.translation, url_prefix="/api/translation")

    app.register_blueprint(events.event, url_prefix="/api")
    app.register_blueprint(announcement.announcement, url_prefix="/api")

    app.register_error_handler(Exception, all_exception_handler)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        return app.send_static_file("index.html")

    @app.errorhandler(404)
    def not_found(e):
        return app.send_static_file("index.html")

    socketio.init_app(app)

    return app
