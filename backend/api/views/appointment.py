from flask import Blueprint, request, jsonify
from api.models import AppointmentRequest, Availability
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import ApppointmentForm

appointment = Blueprint("appointment", __name__)

# POST request for Mentee Appointment
@appointment.route("/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json()
    validate_data = ApppointmentForm.from_json(data)

    if not validate_data.validate():
        msg = ", ".join(validate_data.errors.keys())
        print("returning!")
        return create_response(status=422, message="Missing fields " + msg)

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

    new_appointment.save()
    return create_response(
        message=f"Successfully created appointment with MentorID: {new_appointment.mentor_id} as Mentee Name: {new_appointment.name}"
    )
