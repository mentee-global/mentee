from flask import Blueprint, request, jsonify
from api.models import AppointmentRequest
from api.core import create_response, serialize_list, logger
import requests
from dateutil.parser import parse

appointment = Blueprint("appointment", __name__)

# GET request for appointments by mentor id
@appointment.route("/appointment/mentor/<string:mentor_id>", methods=["GET"])
def get_requests_by_mentor(mentor_id):
    requests = AppointmentRequest.objects(mentor_id=mentor_id)
    return create_response(data={"requests": requests})


@appointment.route("/appointment/accept/<id>", methods=["PUT"])
def put_appointment(id):
    data = request.get_json()

    logger.info("Data received: %s", data)

    try:
        appointment = AppointmentRequest.objects.get(id=id)
    except:
        msg = "No appointment with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    appointment.accepted = True

    appointment.save()

    return create_response(status=200, message=f"Success")
