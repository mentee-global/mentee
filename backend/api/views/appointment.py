from flask import Blueprint, request, jsonify
from api.models import db, Person, Email, Availability, AppointmentRequest
from api.core import create_response, serialize_list, logger
import requests

appointment = Blueprint("appointment", __name__)

@appointment.route("/appointment/<id>", methods=["PUT"])
def put_appointment(id):
    data = request.get_json()

    logger.info("Data received: %s", data)

    try:
        appointment = AppointmentRequest.get(id=id)
    except:
        msg = "No appointment with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    
    if "timeslot" in data:
        availability_data = data.get("availability")
        appointment.timeslot = Availability(
            start_time=availability_data.get("start_time"),
            end_time=availability_data.get("end_data")
        )
    
    appointment.accepted = data.get("accepted", appointment.accepted)

    appointment.save()

    return create_response(status=200, message=f"Success")