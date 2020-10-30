from flask import Blueprint, request, jsonify
from api.models import db
from api.core import create_response, serialize_list, logger
from api.utils.constants import AUTH_URL
import requests

auth = Blueprint("auth", __name__)  # initialize blueprint


@auth.route("/verifyEmail", methods=["POST"])
def verify_email():
    data = request.json
    headers = {
        "Content-Type": "application/json",
        "token": request.headers.get("token"),
    }
    results = requests.post(AUTH_URL + "/verifyEmail", headers=headers, json=data)
    return create_response(data={results.json()})


@auth.route("/register", methods=["POST"])
def register():
    data = request.json
    print(data)
    headers = {"Content-Type": "application/json"}
    results = requests.post(AUTH_URL + "/register", headers=headers, json=data)
    resp = results.json()
    print(resp)
    if not resp.get("token"):
        return create_response(message=resp["message"], status=400)

    return create_response(
        message=resp["message"],
        data={
            "token": resp["token"],
            "userID": resp["uid"],
            "permission": resp["permission"],
        },
    )
