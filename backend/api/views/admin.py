from flask import Blueprint, request, jsonify
from api.core import create_response, serialize_list, logger
from api.models import db, MentorProfile, Users, VerifiedEmail
import csv
import io

admin = Blueprint("admin", __name__)  # initialize blueprint

# DELETE request for specific mentor based on id
@admin.route("/mentor/<string:mentor_id>", methods=["DELETE"])
def delete_mentor(mentor_id):
    try:
        mentor = MentorProfile.objects.get(id=mentor_id)
    except:
        msg = "No mentors currently exist with ID " + mentor_id
        logger.info(msg)
        return create_response(status=422, message=msg)
    user_id = mentor.user_id.id
    email = mentor.user_id.email
    try:
        login = Users.objects.get(id=user_id)
    except:
        msg = "No mentors currently exist with user_id " + user_id
        logger.info(msg)
        return create_response(status=422, message=msg)
    if login.verified:
        try:
            verified = VerifiedEmail.objects.get(email=email)
        except:
            msg = "No verified mentors currently exist with email " + email
            logger.info(msg)
    mentor.delete()
    login.delete()
    if verified:
        verified.delete()
    return create_response(status=200, message="Successful deletion")


@admin.route("/upload/mentors", methods=["GET", "POST"])
def upload_mentor_emails():
    if request.method == "GET":
        uploads = VerifiedEmail.objects().get(is_mentor=True)
        return create_response(data={"uploads": uploads})

    f = request.files["fileupload"]
    password = request.form["pass"]
    isMentor = request.form["mentorOrMentee"]
    if isMentor == "true":
        isMentor = True
    else:
        isMentor = False
        print("YAMNT")

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        for line in reader:
            email = VerifiedEmail(email=line[0], is_mentor=isMentor, password=password)
            email.save()

    return create_response(status=200, message="success")


@admin.route("/upload/mentees", methods=["GET", "POST"])
def upload_mentee_emails():
    if request.method == "GET":
        uploads = VerifiedEmail.objects().get(is_mentor=False)
        return create_response(data={"uploads": uploads})

    f = request.files["fileupload"]
    

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        is_email = True
        address = None
        password = None
        for line in reader:
            if is_email:
                address = line[0]
            else:
                password = password
                email = VerifiedEmail(email=address, password=password, is_mentor=False)
                email.save()
            is_email = not is_email

    return create_response(status=200, message="success")
