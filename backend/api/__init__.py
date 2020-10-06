import os
import logging

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

    app = Flask(__name__)

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

    # register mongoengine to this app
    from api.models import db

    db.init_app(app)  # initialize Flask MongoEngine with this flask app
    Migrate(app, db)

    # import and register blueprints
    from api.views import main, auth

    # why blueprints http://flask.pocoo.org/docs/1.0/blueprints/
    app.register_blueprint(main.main)
    app.register_blueprint(auth.auth)

    # register error Handler
    app.register_error_handler(Exception, all_exception_handler)

    return app
