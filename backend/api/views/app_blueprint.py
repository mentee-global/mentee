from flask import Blueprint, current_app, send_from_directory
from mongoengine.connection import get_connection
from pymongo.errors import PyMongoError

app_blueprint = Blueprint("app_blueprint", __name__)  # initialize blueprint


@app_blueprint.route("/")
def serve():
    return send_from_directory(current_app.static_folder, "index.html")


@app_blueprint.route("/health")
def health():
    try:
        get_connection().admin.command("ping")
    except PyMongoError:
        return {"status": "unavailable"}, 503
    return {"status": "ok"}
