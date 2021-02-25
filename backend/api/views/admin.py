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


@admin.route("/upload", methods=["GET", "POST"])
def upload_emails():
    if request.method == "GET":
        uploads = AdminEmails.objects()
        return create_response(data={"emails": uploads})

    f = request.files["fileupload"]

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        emails = []
        for line in reader:
            print(line)
            emails.append(line[0])

    uploaded_emails = AdminEmails(
        emails=emails,
    )
    uploaded_emails.save()
    return create_response(status=200, message="success")


@admin.route("/upload", methods=["DELETE"])
def delete_uploaded_emails():
    uploaded_files = AdminEmails.objects()
    for f in uploaded_files:
        f.delete()
    return create_response(status=200, message="Successful deletion")
