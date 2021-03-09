from flask import Blueprint, request, jsonify
from api.models import MentorApplication
from api.core import create_response, serialize_list, logger

apply = Blueprint("apply", __name__)

# GET request for mentor applications by object ID
@apply.route("/", methods=["GET"])
def get_applications():
    application = MentorApplication.objects.only("name", "specializations", "id")

    return create_response(data={"mentor_applications": application})


# GET request for mentor applications for application organizer
@apply.route("/<id>", methods=["GET"])
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
        "business_number", application.buisness_number
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
    return create_response(status=200, message=f"Success")
