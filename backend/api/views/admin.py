from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_admin_auth
from api.core import create_response, serialize_list, logger
from api.models import MentorProfile, Users, VerifiedEmail, Admin
from api.utils.require_auth import admin_only
import csv
import io


admin = Blueprint("admin", __name__)  # initialize blueprint

# DELETE request for specific mentor based on id


@admin.route("/mentor/<string:mentor_id>", methods=["DELETE"])
@admin_only
def delete_mentor(mentor_id):
    try:
        mentor = MentorProfile.objects.get(id=mentor_id)
    except:
        msg = "No mentors currently exist with ID " + mentor_id
        logger.info(msg)
        return create_response(status=422, message=msg)

    user_id = mentor.user_id
    firebase_uid = mentor.firebase_uid
    email = mentor.email
    login = None

    if not firebase_uid:
        try:
            login = Users.objects.get(id=user_id.id)
        except:
            msg = "No mentors currently exist with user_id " + user_id
            logger.info(msg)
            return create_response(status=422, message=msg)

        verified = None
        if login.verified:
            try:
                verified = VerifiedEmail.objects.get(email=email)
            except:
                msg = "No verified mentors currently exist with email " + email
                logger.info(msg)

        login.delete()
        if verified:
            verified.delete()
    else:
        login = firebase_admin_auth.get_user(firebase_uid)

        if not login.email_verified:
            msg = "No verified mentors currently exist with email " + email
            logger.info(msg)

    mentor.delete()
    return create_response(status=200, message="Successful deletion")


@admin.route("/upload/mentors", methods=["GET", "POST"])
@admin_only
def upload_mentor_emails():
    if request.method == "GET":
        uploads = VerifiedEmail.objects().get(is_mentor=True)
        return create_response(data={"uploads": uploads})

    f = request.files["fileupload"]
    password = request.form["pass"]
    isMentor = request.form["mentorOrMentee"] == "true"

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        for line in reader:
            email = VerifiedEmail(email=line[0], is_mentor=isMentor, password=password)
            email.save()
    return create_response(status=200, message="success")


@admin.route("/admin/<id>", methods=["GET"])
@admin_only
def get_admin(id):
    try:
        admin = Admin.objects.get(id=id)
    except:
        msg = "Admin does not exist"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"admin": admin})
