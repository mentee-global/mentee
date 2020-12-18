from flask import Blueprint, request, jsonify
from api.models import AppointmentRequest, Availability, MentorProfile
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import ApppointmentForm, is_invalid_form, send_email
from ..utils.constants import APPOINTMENT_EMAIL_MESSAGE

appointment = Blueprint("appointment", __name__)

# GET request for appointments by mentor id
@appointment.route("/appointment/mentor/<string:mentor_id>", methods=["GET"])
def get_requests_by_mentor(mentor_id):
    # TODO: Remove this once we have an authentication setup!
    # Block to remove:
    try:
        mentor = MentorProfile.objects.get(id=mentor_id)
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # End of block
    requests = AppointmentRequest.objects(mentor_id=mentor_id)
    # TODO Remove sending mentor name from this response
    return create_response(data={"mentor_name": mentor.name, "requests": requests})


# POST request for Mentee Appointment
@appointment.route("/appointment", methods=["POST"])
def create_appointment():
    data = request.get_json()

    validate_data = ApppointmentForm.from_json(data)
    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)

    new_appointment = AppointmentRequest(
        mentor_id=data.get("mentor_id"),
        accepted=data.get("accepted"),
        name=data.get("name"),
        email=data.get("email"),
        phone_number=data.get("phone_number"),
        languages=data.get("languages"),
        age=data.get("age"),
        gender=data.get("gender"),
        ethnicity=data.get("ethnicity"),
        location=data.get("location"),
        mentorship_goals=data.get("mentorship_goals"),
        specialist_categories=data.get("specialist_categories"),
        message=data.get("message"),
        attendee_count=data.get("attendee_count"),
        organization=data.get("organization"),
    )

    time_data = data.get("timeslot")
    new_appointment.timeslot = Availability(
        start_time=time_data.get("start_time"), end_time=time_data.get("end_time")
    )

    # Gets mentor's email and sends a notification to them about the appointment
    try:
        mentor = MentorProfile.objects.get(id=data.get("mentor_id"))
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    res_email = send_email(
        mentor.email,
        "Appointment Request",
        APPOINTMENT_EMAIL_MESSAGE.format(new_appointment.name),
    )

    if not res_email:
        msg = "Failed to send an email"
        logger.info(msg)
        return create_response(status=422, message=msg)

    new_appointment.save()
    return create_response(
        message=f"Successfully created appointment with MentorID: {new_appointment.mentor_id} as Mentee Name: {new_appointment.name}"
    )


@appointment.route("/appointment/accept/<id>", methods=["PUT"])
def put_appointment(id):
    try:
        appointment = AppointmentRequest.objects.get(id=id)
        mentor = MentorProfile.objects.get(id=appointment.mentor_id)
    except:
        msg = "No appointment or mentor found (or both) with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    appointment.accepted = True

    for timeslot in mentor.availability:
        if timeslot == appointment.timeslot:
            mentor.availability.remove(timeslot)
            break

    mentor.save()
    appointment.save()

    return create_response(status=200, message=f"Success")


# DELETE request for appointment by appointment id
@appointment.route("/appointment/<string:appointment_id>", methods=["DELETE"])
def delete_request(appointment_id):
    try:
        request = AppointmentRequest.objects.get(id=appointment_id)
    except:
        msg = "The request you attempted to delete was not found"
        logger.info(msg)
        return create_response(status=422, message=msg)
    request.delete()
    return create_response(status=200, message=f"Success")
