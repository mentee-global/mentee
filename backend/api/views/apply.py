from flask import Blueprint, request, jsonify
from api.models import MentorApplication, VerifiedEmail
from api.core import create_response, serialize_list, logger
from api.utils.require_auth import admin_only
from api.utils.constants import MENTOR_APP_STATES, MENTOR_APP_OFFER
from api.utils.request_utils import send_email, is_invalid_form

apply = Blueprint("apply", __name__)

# GET request for all mentor applications
@apply.route("/", methods=["GET"])
@admin_only
def get_applications():
    application = MentorApplication.objects.only(
        "name", "specializations", "id", "application_state"
    )

    return create_response(data={"mentor_applications": application})


# GET request for mentor applications for by id
@apply.route("/<id>", methods=["GET"])
@admin_only
def get_application_by_id(id):
    try:
        application = MentorApplication.objects.get(id=id)
    except:
        msg = "No application currently exist with this id " + id
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"mentor_application": application})


# DELETE request for mentor application by object ID
@apply.route("/<id>", methods=["DELETE"])
@admin_only
def delete_application(id):
    try:
        application = MentorApplication.objects.get(id=id)
    except:
        msg = "The application you attempted to delete was not found"
        logger.info(msg)
        return create_response(status=422, message=msg)

    application.delete()
    return create_response(status=200, message=f"Success")


# PUT requests for /application by object ID
@apply.route("/<id>", methods=["PUT"])
@admin_only
def edit_application(id):
    data = request.get_json()
    logger.info(data)
    # Try to retrieve Mentor application from database
    try:
        application = MentorApplication.objects.get(id=id)
    except:
        msg = "No application with that object id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # Edit fields or keep original data if no added data
    application.name = data.get("name", application.name)
    application.email = data.get("email", application.email)
    application.business_number = data.get(
        "business_number", application.business_number
    )
    application.cell_number = data.get("cell_number", application.cell_number)
    application.hear_about_us = data.get("hear_about_us", application.hear_about_us)
    application.offer_donation = data.get("offer_donation", application.offer_donation)
    application.mentoring_options = data.get(
        "mentoring_options", application.mentoring_options
    )
    application.employer_name = data.get("employer_name", application.employer_name)
    application.role_description = data.get(
        "role_description", application.role_description
    )
    application.time_at_current_company = data.get(
        "time_at_current_company", application.time_at_current_company
    )
    application.linkedin = data.get("linkedin", application.linkedin)
    application.why_join_mentee = data.get(
        "why_join_mentee", application.why_join_mentee
    )
    application.commit_time = data.get("commit_time", application.commit_time)
    application.referral = data.get("referral", application.referral)
    application.knowledge_location = data.get(
        "knowledge_location", application.knowledge_location
    )
    application.application_state = data.get(
        "application_state", application.application_state
    )
    application.immigrant_status = data.get(
        "immigrant_status", application.immigrant_status
    )
    application.work_sectors = data.get("work_sectors", application.work_sectors)
    application.specializations = data.get(
        "specializations", application.specializations
    )
    application.languages = data.get("languages", application.languages)
    application.date_submitted = data.get("date_submitted", application.date_submitted)
    application.notes = data.get("notes", application.notes)

    application.save()

    # Send a notification email
    if application.application_state == MENTOR_APP_STATES["OFFER_MADE"]:
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            subject="MENTEE Application Status",
            template_id=MENTOR_APP_OFFER,
        )
        if not success:
            logger.info(msg)

        # Add to verified emails
        new_verified = VerifiedEmail(email=mentor_email, is_mentor=True)
        new_verified.save()

    return create_response(status=200, message=f"Success")

    
# POST request for Mentee Appointment
@apply.route("/new", methods=["POST"])
def create_appointment():
    data = request.get_json()
    logger.info(data)
    validate_data = MentorApplication.from_json(data)
    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)
    new_application = MentorApplication(
        name=data.get("name"),
        business_number=data.get("business_number"),
        cell_number=data.get("cell_number"),
        hear_about_us=data.get("email"),
        offer_donation=data.get("offer_donation"),
        mentoring_options=data.get("mentoring_options"),
        employer_name=data.get("employer_name"),
        work_sectors=data.get("work_sectors"),
        role_description=data.get("role_description"),
        time_at_current_company=data.get("time_at_current_company"),
        linkedin=data.get("linkedin"),
        why_join_mentee=data.get("why_join_mentee"),
        commit_time=data.get("commit_time"),
        immigrant_status=data.get("immigrant_status"),
        languages=data.get("languages"),
        referral=data.get("referral"),
        knowledge_location=data.get("knowledge_location"),
        date_submitted=data.get("date_submitted"),
        notes=data.get("notes", ""),
        application_state= "PENDING"
    )


    new_application.save()

    return create_response(
        message=f"Successfully created application with ID: {new_application.mentor_id} with name: {new_application.name}"
    )
