from flask import Blueprint, request, jsonify
from api.models import (
    VerifiedEmail,
)
from api.core import create_response

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
        data={"is_verified": True, "role": account.role},
        status=200,
        message="Successfully returned verification",
    )
