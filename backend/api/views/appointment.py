from flask import Blueprint, request, jsonify
from api.models import db, Person, Email, Availability, AppointmentRequest
from api.core import create_response, serialize_list, logger
import requests
from dateutil.parser import parse

appointment = Blueprint("appointment", __name__)


@appointment.route("/appointment/<id>", methods=["PUT"])
def put_appointment(id):
    data = request.get_json()

    logger.info("Data received: %s", data)

    # Try to get appointment
    try:
        appointment = AppointmentRequest.get(id=id)
    except:
        msg = "No appointment with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # Update appointment acceptance status
    appointment.accepted = data.get("accepted", appointment.accepted)

    appointment.save()

    return create_response(status=200, message=f"Success")


@appointment.route("/test", methods=["POST"])
def addtestcollection():
    new_appointment = AppointmentRequest(
        mentor_id="5f7f92fd1ad5465da13d4635",
        timeslot=Availability(
            start_time=parse("Thu Oct 22 17:13:46 UTC 2020"),
            end_time=parse("Thu Oct 22 18:13:46 UTC 2020"),
        ),
        age="12",
        accepted=False,
        name="Bob Ross",
        email="bobross@gmail.com",
        phone_number="(111) 111-1111",
        languages=["English", "Art"],
        gender="Male",
        ethnicity="Caucasian",
        location="Somewhere",
        mentorship_goals="Something",
        specialist_categories=["stuff"],
        message="Hello world",
        attendee_count=13,
        organization="Hack4Impact",
    )

    new_appointment.save()
    return create_response(status=200, message=f"Success")
