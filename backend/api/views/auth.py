from flask import Blueprint, request, jsonify
from api.models import db, Users, MentorProfile, VerifiedEmail
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
    return results.json()


@auth.route("/resendVerificationEmail", methods=["POST"])
def resend_email():
    data = request.json
    headers = {
        "Content-Type": "application/json",
        "token": request.headers.get("token"),
    }
    results = requests.post(
        AUTH_URL + "/resendVerificationEmail", headers=headers, json=data
    )

    return results.json()


@auth.route("/register", methods=["POST"])
def register():
    data = request.json
    headers = {"Content-Type": "application/json"}
    results = requests.post(AUTH_URL + "/register", headers=headers, json=data)
    resp = results.json()

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


@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    body = {"email": data["email"], "password": data["password"]}
    headers = {"Content-Type": "application/json"}
    results = requests.post(AUTH_URL + "/login", headers=headers, json=body)
    resp = results.json()

    if not resp.get("token"):
        return create_response(message=resp["message"], status=400)

    uid = resp["uid"]
    user = Users.objects.get(id=uid)
    try:
        mentor = MentorProfile.objects.get(user_id=user)
        mentor_id = mentor.id
    except:
        msg = "Couldn't find mentor with these credentials"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(
        message=resp["message"],
        data={
            "userId": resp["uid"],
            "mentorId": str(mentor_id),
            "token": resp["token"],
        },
    )


@auth.route("/forgotPassword", methods=["POST"])
def forgot_password():
    data = request.json
    body = {"email": data["email"]}
    headers = {"Content-Type": "application/json"}
    results = requests.post(AUTH_URL + "/forgotPassword", headers=headers, json=body)
    return results.json()


@auth.route("/passwordReset", methods=["POST"])
def reset_password():
    data = request.json
    body = {"email": data["email"], "pin": data["pin"], "password": data["password"]}
    headers = {"Content-Type": "application/json"}
    results = requests.post(AUTH_URL + "/passwordReset", headers=headers, json=body)
    return results.json()


@auth.route("/verifyAccountCreation", methods=["GET"])
def verify_account():
    email = request.args.get("email", default="")
    password = request.args.get("password", default="")

    try:
        account = VerifiedEmail.objects.get(email=email)
    except:
        return create_response(
            data={},
            status=401,
            message="Could not find email in database",
        )

    if not account.is_mentor and password != account.password:
        return create_response(data={}, status=401, message="Password is not correct")

    return create_response(
        data={"is_verified": True, "is_mentor": account.is_mentor},
        status=200,
        message="Successful returned verification!",
    )
