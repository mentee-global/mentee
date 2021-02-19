from flask import Blueprint, request, jsonify
from api.core import create_response, serialize_list, logger, 
from api.models import (db, MentorProfile)
from flask_cors import CORS

admin = Blueprint("admin", __name__) # initialize blueprint

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







@admin.route("/upload", methods=["POST"])
def upload_emails():
    f = request.files['fileupload']  #