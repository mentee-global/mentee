from flask import Blueprint, request, jsonify
from api.models import Availability, MentorProfile
from api.core import create_response, serialize_list, logger

availability = Blueprint("availability", __name__)

@availability.route("availability/mentor/<id>", methods=["GET"])
def get_availability(id):

    try:
        availability = MentorProfile.objects.get(id = id).availability
        print(availability)
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    
    return create_response(data={"availability": availability})

