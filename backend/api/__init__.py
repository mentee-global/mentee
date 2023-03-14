import os
import logging
import firebase_admin

from flask import Flask, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO

from api.core import all_exception_handler
from dotenv import load_dotenv

load_dotenv()
socketio = SocketIO(cors_allowed_origins="*")


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

    CORS(app)  # add CORS

    # logging
    formatter = RequestFormatter(
        "%(asctime)s %(remote_addr)s: requested %(url)s: %(levelname)s in [%(module)s: %(lineno)d]: %(message)s"
    )
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
    app.register_blueprint(masters.masters, url_prefix="/api/masters")

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
