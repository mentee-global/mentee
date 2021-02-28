from flask import Blueprint, request, jsonify
from api.core import create_response, serialize_list, logger
from api.models import db, MentorProfile, AdminEmails
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
    mentor.delete()
    return create_response(status=200, message="Successful deletion")


@admin.route("/upload/mentors", methods=["GET", "POST"])
def upload_mentor_emails():
    if request.method == "GET":
        uploads = AdminEmails.objects().get(is_mentor=True)
        return create_response(data={"uploads": uploads})

    f = request.files["fileupload"]

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        for line in reader:
            email = AdminEmails(email=line[0], is_mentor=True)
            email.save()

    return create_response(status=200, message="success")


@admin.route("/upload/mentees", methods=["GET", "POST"])
def upload_mentee_emails():
    if request.method == "GET":
        uploads = AdminEmails.objects().get(is_mentor=False)
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
                password = line[0]
                email = AdminEmails(email=address, password=password, is_mentor=False)
                email.save()
            is_email = not is_email

    return create_response(status=200, message="success")


@admin.route("/upload", methods=["DELETE"])
def delete_uploaded_emails():
    uploaded_files = AdminEmails.objects()
    for f in uploaded_files:
        f.delete()
    return create_response(status=200, message="Successful deletion")
