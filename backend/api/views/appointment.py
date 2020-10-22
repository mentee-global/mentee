from flask import Blueprint, request, jsonify
from api.models import AppointmentRequest
from api.core import create_response, serialize_list, logger
import requests
from dateutil.parser import parse

appointment = Blueprint("appointment", __name__)


@appointment.route("/accept/<id>", methods=["PUT"])
def put_appointment(id):
    data = request.get_json()

    logger.info("Data received: %s", data)

    try:
        appointment = AppointmentRequest.objects.get(id=id)
    except:
        msg = "No appointment with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # Update appointment acceptance status
    appointment.accepted = True

    appointment.save()

    return create_response(status=200, message=f"Success")
