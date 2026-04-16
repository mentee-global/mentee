import os
import logging
import firebase_admin
from datetime import timedelta

from flask import Flask, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO

from api.core import all_exception_handler
from dotenv import load_dotenv

load_dotenv()
socketio = SocketIO(cors_allowed_origins="*")


def _oauth_enabled() -> bool:
    return os.environ.get("OAUTH_ENABLED", "false").lower() == "true"


def _cors_origins() -> list:
    raw = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


class RequestFormatter(logging.Formatter):
    def format(self, record):
        record.url = request.url
        record.remote_addr = request.remote_addr
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

    app = Flask(__name__, static_folder="../../frontend/artifacts", static_url_path="")

    secret_key = os.environ.get("FLASK_SECRET_KEY")
    if _oauth_enabled() and not secret_key:
        raise RuntimeError("FLASK_SECRET_KEY must be set when OAUTH_ENABLED=true.")
    app.config["SECRET_KEY"] = secret_key or "dev-insecure-secret-oauth-disabled"
    app.config["SESSION_COOKIE_NAME"] = "mentee_web_session"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = os.environ.get("ENVIRONMENT") == "production"
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=14)

    # Per-route CORS: cookie-bearing endpoints get the configured origins +
    # credentials; OAuth bearer endpoints get wildcard since security comes
    # from the access token itself (no cookie sent cross-origin to them).
    cors_origins = _cors_origins()
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": cors_origins,
                "supports_credentials": True,
            },
            r"/auth/*": {
                "origins": cors_origins,
                "supports_credentials": True,
            },
            r"/oauth/consent-request": {
                "origins": cors_origins,
                "supports_credentials": True,
            },
            r"/oauth/token": {"origins": "*"},
            r"/oauth/userinfo": {"origins": "*"},
            r"/oauth/revoke": {"origins": "*"},
            r"/.well-known/*": {"origins": "*"},
        },
    )

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

    user = os.environ.get("MONGO_USER")
    password = os.environ.get("MONGO_PASSWORD")
    db = os.environ.get("MONGO_DB")
    host = os.environ.get("MONGO_HOST")
    app.config["MONGODB_SETTINGS"] = {"db": db, "host": host % (user, password, db)}
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

    if _oauth_enabled():
        from api.views import oauth as oauth_views
        from api.views import admin_oauth as admin_oauth_views
        from api.views import connected_apps as connected_apps_views
        from api.utils.oauth_server import init_authorization_server

        app.register_blueprint(oauth_views.oauth_bp, url_prefix="/oauth")
        app.register_blueprint(oauth_views.wellknown_bp)
        app.register_blueprint(admin_oauth_views.admin_oauth, url_prefix="/api/admin")
        app.register_blueprint(
            connected_apps_views.connected_apps, url_prefix="/api/user"
        )
        init_authorization_server(app)

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
