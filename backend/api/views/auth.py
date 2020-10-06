from flask import Blueprint, request, jsonify
from api.models import db, Person, Email
from api.core import create_response, serialize_list, logger
import requests

auth = Blueprint("auth", __name__)  # initialize blueprint


@auth.route("/verifyEmail", methods=["POST"])
def verify_email():
    headers = {"Content-Type": "application/json", "token": request.headers.token}
    data = {"pin": request.body.pin}
    results = requests.post(
        "http://localhost:8000/verifyEmail", headers=headers, data=data
    )
    return create_response(data={results.json()})
