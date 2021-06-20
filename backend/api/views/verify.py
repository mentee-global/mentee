from os import path
from flask import Blueprint, request, jsonify
from api.models import (
    db,
    MentorProfile,
    VerifiedEmail,
)
from api.core import create_response, serialize_list, logger

verify = Blueprint("verify", __name__)  # initialize blueprint


@verify.route("/verifyEmail", methods=["GET"])
def verify_email():
    email = request.args.get("email", default="")

    try:
        account = VerifiedEmail.objects.get(email=email)
    except:
        return create_response(
            data={"is_verified": False},
            status=401,
            message="Could not find email in database",
        )

    return create_response(
        data={"is_verified": True, "is_mentor": account.is_mentor},
        status=200,
        message="Successfully returned verification",
    )
