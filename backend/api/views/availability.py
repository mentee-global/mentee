from flask import Blueprint, request, jsonify
from api.models import Availability, MentorProfile
from api.core import create_response, serialize_list, logger

availability = Blueprint("availability", __name__)

# Get request for avalability for a specific mentor
@availability.route("/availability/<id>", methods=["GET"])
def get_availability(id):

    try:
        availability = MentorProfile.objects.get(id=id).availability
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"availability": availability})


# Put request to edit availability for a specific mentor
@availability.route("/availability/<id>", methods=["PUT"])
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


# Get days that availabilities have been set for
@availability.route("/availability/setdays/<id>", methods=["GET"])
def get_set_availability_days(id):
    try:
        availability = MentorProfile.objects.get(id=id).availability
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    set_availability_days = []

    # Find the Year/month/day
    for each in availability:

        day = (
            str(each.start_time.year)
            + "-"
            + "{:0>2}".format(each.start_time.month)
            + "-"
            + "{:0>2}".format(each.start_time.day)
        )
        if day not in set_availability_days:
            set_availability_days.append(day)
    return create_response(status=200, data={"days": set_availability_days})
