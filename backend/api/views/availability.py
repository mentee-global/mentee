from flask import Blueprint, request, jsonify
from api.models import Availability, MentorProfile
from api.core import create_response, logger
from api.utils.require_auth import all_users

availability = Blueprint("availability", __name__)


# Get request for avalability for a specific mentor
@availability.route("/<id>", methods=["GET"])
@all_users
def get_availability(id):
    try:
        availability = MentorProfile.objects.get(id=id).availability
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"availability": availability})


# Put request to edit availability for a specific mentor
@availability.route("/<id>", methods=["PUT"])
@all_users
def edit_availability(id):
    data = request.get_json().get("Availability")
    try:
        mentor = MentorProfile.objects.get(id=id)
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    mentor.availability = [
        Availability(
            start_time=availability.get("start_time").get("$date"),
            end_time=availability.get("end_time").get("$date"),
        )
        for availability in data
    ]
    mentor.save()
    return create_response(status=200, message=f"Success")
