import os
import logging
import firebase_admin

from flask import Flask, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_mongoengine import MongoEngine

from api.core import all_exception_handler

from dotenv import load_dotenv

load_dotenv()


class RequestFormatter(logging.Formatter):
    def format(self, record):
        record.url = request.url
        record.remote_addr = request.remote_addr
        return super().format(record)


# why we use application factories http://flask.pocoo.org/docs/1.0/patterns/appfactories/#app-factories
def create_app(test_config=None):
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
    firebase_config = {
        'apiKey': "AIzaSyDHlY_sGqD0wpE9JZSXbICJgB5a43BqRyg",
        'authDomain': "mentee-d0304.firebaseapp.com",
        'projectId': "mentee-d0304",
        'storageBucket': "mentee-d0304.appspot.com",
        'messagingSenderId': "64054250486",
        'appId': "1:64054250486:web:5dda0b621ca92dc03ad5d7",
        'measurementId': "G-HSJ2934X33"
    }

    firebase_app = firebase_admin.initialize_app(firebase_config)

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
        download,
    )

    # why blueprints http://flask.pocoo.org/docs/1.0/blueprints/
    app.register_blueprint(app_blueprint.app_blueprint)
    app.register_blueprint(main.main, url_prefix="/api")
    app.register_blueprint(auth.auth, url_prefix="/auth")
    app.register_blueprint(appointment.appointment, url_prefix="/api/appointment")
    app.register_blueprint(availability.availability, url_prefix="/api/availability")
    app.register_blueprint(verify.verify, url_prefix="/api")
    app.register_blueprint(download.download, url_prefix="/api/download")
    # register error handlers
    @app.errorhandler(404)
    def not_found(e):
        return app.send_static_file("index.html")

    app.register_error_handler(Exception, all_exception_handler)

    return app
