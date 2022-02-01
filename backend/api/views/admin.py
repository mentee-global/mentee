from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_admin_auth
from api.core import create_response, logger
from api.models import Users, VerifiedEmail, Admin
from api.utils.require_auth import admin_only
from api.utils.request_utils import get_profile_model
from api.utils.constants import Account
import csv
import io


admin = Blueprint("admin", __name__)  # initialize blueprint


@admin.route("/account/<int:role>/<string:id>", methods=["DELETE"])
@admin_only
def delete_account(role, id):
    """Allows for the deletion of a specific account from the
    Mentee/Mentor documents

    Args:
        role (Account): Specifies role of account
        id (int): The _id of the specific account document

    Returns:
        HTTP Response
    """
    try:
        account = get_profile_model(role).objects.get(id=id)
    except:
        msg = "No account currently exist with ID " + id
        logger.info(msg)
        return create_response(status=422, message=msg)

    firebase_uid = account.firebase_uid
    email = account.email
    login = None

    if not firebase_uid:
        # MenteeProfile does not contain user_id field
        if role == Account.MENTEE:
            account.delete()
            return create_response(status=200, message="Successful deletion")

        user_id = account.user_id
        try:
            login = Users.objects.get(id=user_id.id)
        except:
            msg = "No account currently exist with user_id " + user_id
            logger.info(msg)
            return create_response(status=422, message=msg)

        verified = None
        if login.verified:
            try:
                verified = VerifiedEmail.objects.get(email=email)
            except:
                msg = "No verified account currently exist with email " + email
                logger.info(msg)

        login.delete()
        if verified:
            verified.delete()
    else:
        login = firebase_admin_auth.get_user(firebase_uid)

        if not login.email_verified:
            msg = "No verified account currently exist with email " + email
            logger.info(msg)

    account.delete()
    return create_response(status=200, message="Successful deletion")


@admin.route("/upload/accounts", methods=["POST"])
@admin_only
def upload_account_emails():
    """Upload account emails to permit registering

    Returns:
        HTTP Response
    """
    f = request.files["fileupload"]
    password = request.form["pass"]
    isMentor = request.form["mentorOrMentee"] == "true"

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        for line in reader:
            duplicates = VerifiedEmail.objects(
                email=line[0], is_mentor=isMentor, password=password
            )
            if not duplicates:
                email = VerifiedEmail(
                    email=line[0], is_mentor=isMentor, password=password
                )
                email.save()
    return create_response(status=200, message="success")


@admin.route("/upload/accountsEmails", methods=["POST"])
@admin_only
def upload_account_emailText():
    """Upload account emails to permit registering

    Returns:
        HTTP Response
    """

    isMentor = request.form["companyTime"] == "true"
    messageText = request.form["messageText"]

    for email in messageText.split(";"):
        duplicates = VerifiedEmail.objects(email=email, is_mentor=isMentor, password="")
        if not duplicates:
            email = VerifiedEmail(email=email, is_mentor=isMentor, password="")
            email.save()

    return create_response(status=200, message="success")


@admin.route("/admin/<id>", methods=["GET"])
@admin_only
def get_admin(id):
    """Get admin account info

    Args:
        id (int): ObjectId of Admin

    Returns:
        HTTP Response
    """
    try:
        admin = Admin.objects.get(id=id)
    except:
        msg = "Admin does not exist"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"admin": admin})
