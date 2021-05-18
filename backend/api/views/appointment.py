from datetime import datetime
from flask import Blueprint, request, jsonify
from api.models import AppointmentRequest, Availability, MentorProfile, MenteeProfile
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import (
    ApppointmentForm,
    is_invalid_form,
    send_email,
    send_sms,
)
from api.utils.constants import (
    MENTOR_APPT_TEMPLATE,
    MENTEE_APPT_TEMPLATE,
    APPT_TIME_FORMAT,
    Account,
    APPT_STATUS,
)
from api.utils.require_auth import admin_only

appointment = Blueprint("appointment", __name__)

# GET request for appointments by account id
@appointment.route("/<int:account_type>/<string:id>", methods=["GET"])
def get_requests_by_id(account_type, id):
    account = None
    try:
        if account_type == Account.MENTOR:
            account = MentorProfile.objects.get(id=id)
        elif account_type == Account.MENTEE:
            account = MenteeProfile.objects.get(id=id)
    except:
        msg = "No account found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # Update appointment requests that don't have a mentee id
    if account_type == Account.MENTEE:
        by_email = AppointmentRequest.objects(email=account.email).filter(
            mentee_id__not__exists=True
        )
        for appointment in by_email:
            appointment.mentee_id = id
            appointment.save()
    elif account_type == Account.MENTOR:
        not_verified = AppointmentRequest.objects(mentor_id=id).filter(
            mentee_id__not__exists=True
        )
        for appointment in not_verified:
            try:
                mentee = MenteeProfile.objects.get(email=appointment.email)
            except:
                msg = "Could not find Mentee with that email"
                logger.info(msg)
                continue
            appointment.mentee_id = mentee.id
            appointment.save()

    # Update appointment requets that don't have a mentor_name
    if account_type == Account.MENTEE:
        missing_name = AppointmentRequest.objects(mentee_id=id).filter(
            mentor_name__not__exists=True
        )
        logger.info(len(missing_name))
        for appointment in missing_name:
            try:
                mentor = MentorProfile.objects.get(id=appointment.mentor_id)
            except:
                msg = f"Could not find mentor with given id"
                logger.info(msg)
                continue
            appointment.mentor_name = mentor.name
            appointment.save()

    # Fetch appointments by respective mentee/mentor id
    res = None
    if account_type == Account.MENTEE:
        res = AppointmentRequest.objects(mentee_id=id)
    elif account_type == Account.MENTOR:
        res = AppointmentRequest.objects(mentor_id=id)

    # Includes mentor name because appointments page does not fetch all mentor info
    return create_response(data={"name": account.name, "requests": res})


# POST request for Mentee Appointment
@appointment.route("/", methods=["POST"])
def create_appointment():
    data = request.get_json()
    validate_data = ApppointmentForm.from_json(data)
    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)

    # Gets mentor's and mentee's email and sends a notification to them about the appointment
    try:
        mentor = MentorProfile.objects.get(id=data.get("mentor_id"))
    except:
        msg = "No mentor found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    try:
        mentee = MenteeProfile.objects.get(id=data.get("mentee_id"))
    except:
        msg = "No mentee found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    new_appointment = AppointmentRequest(
        mentor_id=data.get("mentor_id"),
        mentee_id=data.get("mentee_id"),
        name=mentee.name,
        mentor_name=mentor.name,
        status=data.get("status"),
        topic=data.get("topic"),
        message=data.get("message"),
        allow_texts=data.get("allow_texts"),
        allow_calls=data.get("allow_calls"),
    )

    time_data = data.get("timeslot")
    new_appointment.timeslot = Availability(
        start_time=time_data.get("start_time"), end_time=time_data.get("end_time")
    )

    date_object = datetime.strptime(time_data.get("start_time"), "%Y-%m-%dT%H:%M:%S%z")
    start_time = date_object.strftime(APPT_TIME_FORMAT + " %Z")

    if mentee.email_notifications:
        res, res_msg = send_email(
            recipient=mentee.email,
            template_id=MENTEE_APPT_TEMPLATE,
            data={"confirmation": True, "name": mentor.name, "date": start_time},
        )
        if not res:
            msg = "Failed to send mentee email " + res_msg
            logger.info(msg)

    if mentor.email_notifications:
        res, res_msg = send_email(
            recipient=mentor.email, template_id=MENTOR_APPT_TEMPLATE
        )

        if not res:
            msg = "Failed to send an email " + res_msg
            logger.info(msg)

    if mentor.text_notifications:
        res, res_msg = send_sms(
            text="You received a new appointment request!\nCheckout https://mentee-h4i.herokuapp.com/",
            recipient=mentor.phone_number,
        )

        if not res:
            msg = "Failed to send message " + res_msg
            logger.info(msg)

    new_appointment.save()

    return create_response(
        message=f"Successfully created appointment with MentorID: {new_appointment.mentor_id} as MenteeID: {new_appointment.mentee_id}"
    )


@appointment.route("/accept/<id>", methods=["PUT"])
def put_appointment(id):
    try:
        appointment = AppointmentRequest.objects.get(id=id)
        mentor = MentorProfile.objects.get(id=appointment.mentor_id)
        mentee = MenteeProfile.objects.get(id=appointment.mentee_id)
    except:
        msg = "No appointment or account found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    appointment.status = APPT_STATUS["ACCEPTED"]

    for timeslot in mentor.availability:
        if timeslot == appointment.timeslot:
            mentor.availability.remove(timeslot)
            break

    if mentee.email_notifications:
        start_time = appointment.timeslot.start_time.strftime(APPT_TIME_FORMAT + " GMT")
        res_email = send_email(
            recipient=mentee.email,
            subject="Mentee Appointment Notification",
            data={"name": mentor.name, "date": start_time, "approved": True},
            template_id=MENTEE_APPT_TEMPLATE,
        )
        if not res_email:
            logger.info("Failed to send email")

    mentor.save()
    appointment.save()

    return create_response(status=200, message=f"Success")


# DELETE request for appointment by appointment id
@appointment.route("/<string:appointment_id>", methods=["DELETE"])
def delete_request(appointment_id):
    try:
        request = AppointmentRequest.objects.get(id=appointment_id)
        mentor = MentorProfile.objects.get(id=request.mentor_id)
        mentee = MenteeProfile.objects.get(id=appointment.mentee_id)
    except:
        msg = "No appointment or account found with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if mentee.email_notifications:
        start_time = appointment.timeslot.start_time.strftime(f"{APPT_TIME_FORMAT} GMT")
        res_email = send_email(
            recipient=mentee.email,
            subject="Mentee Appointment Notification",
            data={"name": mentor.name, "date": start_time, "approved": False},
            template_id=MENTEE_APPT_TEMPLATE,
        )
        if not res_email:
            logger.info("Failed to send email")

    request.status = APPT_STATUS["REJECTED"]
    request.save()
    return create_response(status=200, message=f"Success")


# GET all appointments per mentor
@appointment.route("/mentors", methods=["GET"])
@admin_only
def get_mentors_appointments():
    mentors = MentorProfile.objects()
    appointments = AppointmentRequest.objects()

    data = []
    for mentor in mentors:
        mentor_appts = [
            appointment
            for appointment in appointments
            if appointment.mentor_id == mentor.id
        ]
        data.append(
            {
                "name": mentor.name,
                "id": str(mentor.id),
                "appointments": mentor_appts,
                "numOfAppointments": len(mentor_appts),
                "appointmentsAvailable": "Yes"
                if [
                    avail
                    for avail in mentor.availability
                    if avail.end_time > datetime.now()
                ]
                else "No",
                "profilePicUp": "Yes" if mentor.image else "No",
                "videosUp": "Yes" if mentor.videos else "No",
            }
        )

    return create_response(data={"mentorData": data}, status=200, message="Success")


@appointment.route("/", methods=["GET"])
@admin_only
def get_appointments():
    appointments = AppointmentRequest.objects()
    mentors = MentorProfile.objects().only("name", "id")

    # TODO: Fix this.. It is too slow :(((
    mentor_by_id = {}

    for mentor in mentors:
        mentor_by_id[mentor["id"]] = mentor.name

    res_appts = []
    for index in range(len(appointments) - 1):
        current_id = appointments[index].mentor_id
        res_appts.append(
            {
                "mentor": mentor_by_id.get(current_id, "Deleted Account"),
                "appointment": appointments[index],
            }
        )

    return create_response(
        data={"appointments": res_appts}, status=200, message="Success"
    )
