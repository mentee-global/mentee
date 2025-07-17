import os
import logging
import firebase_admin

from flask import Flask, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO

from api.core import all_exception_handler
from api.utils.simple_secure_logging import SecureLogFilter, sanitize_for_logging, get_sanitized_request_info
from dotenv import load_dotenv

load_dotenv()
socketio = SocketIO(cors_allowed_origins="*")


class SecureRequestFormatter(logging.Formatter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.filter = SecureLogFilter()
    
    def format(self, record):
        try:
            req_info = get_sanitized_request_info()
            record.url = req_info['url']
            record.remote_addr = req_info['remote_addr']
        except Exception:
            record.url = 'unknown'
            record.remote_addr = 'unknown'
        
        if hasattr(record, 'msg') and record.msg:
            record.msg = sanitize_for_logging(record.msg)
        
        return super().format(record)


def create_app():
    app = Flask(__name__, static_folder="../../frontend/artifacts", static_url_path="")

    CORS(app)

    formatter = SecureRequestFormatter(
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
    
    if not firebase_admin._apps:
        firebase_admin.initialize_app()

    from api.models import db

    db.init_app(app)
    Migrate(app, db)

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
        auth_management,
    )

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
    app.register_blueprint(auth_management.auth_bp, url_prefix="/api/auth-management")

    from api.utils.security_middleware import security_middleware
    
    security_middleware(app)

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
