from os import path
from flask import Blueprint, current_app, send_from_directory
from api.core import create_response, serialize_list, logger

app_blueprint = Blueprint("app_blueprint", __name__)  # initialize blueprint


@app_blueprint.route("/")
def serve():
    return send_from_directory(current_app.static_folder, "index.html")


@app_blueprint.errorhandler(404)
def not_found(e):
    return current_app.send_static_file("index.html")
