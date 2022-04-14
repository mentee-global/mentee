from flask import Blueprint, request, jsonify
from sqlalchemy import null
from api.models import MentorApplication, VerifiedEmail,Users,MenteeApplication,PartnerApplication
from api.core import create_response, serialize_list, logger
from api.utils.require_auth import admin_only
from api.utils.constants import (
    MENTOR_APP_STATES,
    MENTOR_APP_OFFER,
    MENTOR_APP_SUBMITTED,
    MENTOR_APP_REJECTED,
)
from api.utils.request_utils import send_email, is_invalid_form, MentorApplicationForm,MenteeApplicationForm,PartnerApplicationForm
from api.utils.constants import Account

apply = Blueprint("apply", __name__)

# GET request for all mentor applications


@apply.route("/apps", methods=["GET"])
@admin_only
def get_applications():
    application = MentorApplication.objects.only(
        "name","id", "application_state"
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

@apply.route("/checkConfirm/<email>/<role>", methods=["GET"])
def get_application_by_email(email,role):
    application=null
    try:
        if role==Account.MENTOR:
             application = MentorApplication.objects.get(email=email)
        if role==Account.MENTEE:
             application = MenteeApplication.objects.get(email=email)
        if role==Account.PARTNER:
             application = PartnerApplication.objects.get(email=email)          
    except:
        msg = "No application currently exist with this email " + email
        logger.info(msg)
        return create_response(data={'state':"",'message':msg})

    return create_response(data={"state":application.application_state})

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
        if not VerifiedEmail.objects(email=mentor_email):
            new_verified = VerifiedEmail(email=mentor_email, is_mentor=True)
            new_verified.save()

    # send out rejection emails when put in rejected column
    if application.application_state == MENTOR_APP_STATES["REJECTED"]:
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            subject="Thank you for your interest in Mentee, " + application.name,
            template_id=MENTOR_APP_REJECTED,
        )
        if not success:
            logger.info(msg)

    return create_response(status=200, message=f"Success")


# POST request for Mentee Appointment
@apply.route("/new", methods=["POST"])
def create_application():
    data = request.get_json()
    role = data.get("role")
    if role==Account.MENTOR:
        validate_data = MentorApplicationForm.from_json(data)
    if role==Account.MENTEE:
        validate_data = MenteeApplicationForm.from_json(data)
    if role==Account.PARTNER:
        validate_data = PartnerApplicationForm.from_json(data)        
    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)
    if role==Account.MENTOR:
        new_application = MentorApplication(
            name=data.get("name"),
            email=data.get("email"),
            cell_number=data.get("cell_number"),
            hear_about_us=data.get("hear_about_us"),
            offer_donation=data.get("offer_donation"),
            employer_name=data.get("employer_name"),
            role_description=data.get("role_description"),
            immigrant_status=data.get("immigrant_status"),
            languages=data.get("languages"),
            referral=data.get("referral"),
            knowledge_location=data.get("knowledge_location"),
            isColorPerson=data.get("isColorPerson"),
            isMarginalized=data.get("isMarginalized"),
            isFamilyNative=data.get("isFamilyNative"),
            isEconomically=data.get("isEconomically"),
            identify=data.get("identify"),
            pastLiveLocation=data.get("pastLiveLocation"),
            date_submitted=data.get("date_submitted"),
            application_state="PENDING",
        )
    if role==Account.MENTEE:
        new_application=MenteeApplication(
            email=data.get("email"),
            name=data.get("name"),
            age=data.get("age"),
            immigrant_status=data.get("immigrant_status"),
            Country=data.get("Country"),
            identify=data.get("identify"),
            language=data.get("language"),
            topics=data.get("topics"),
            workstate=data.get("workstate"),
            isSocial=data.get("isSocial"),
            questions=data.get("questions"),
            application_state="PENDING",
            date_submitted=data.get("date_submitted"),
        )
    if role==Account.PARTNER:
        new_application=PartnerApplication(
            email=data.get("email"),
            name=data.get("name"),
            Country=data.get("Country"),
            application_state="PENDING",
            date_submitted=data.get("date_submitted"),
        )

    new_application.save()

    mentor_email = new_application.email
    success, msg = send_email(
        recipient=mentor_email,
        subject="MENTEE Application Recieved!",
        template_id=MENTOR_APP_SUBMITTED,
    )
    if not success:
        logger.info(msg)

    return create_response(
        message=f"Successfully created application with name {new_application.name}"
    )
