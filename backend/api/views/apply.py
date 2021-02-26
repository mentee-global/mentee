from flask import Blueprint, request, jsonify
from api.models import MentorApplication
from api.core import create_response, serialize_list, logger

apply = Blueprint("apply", __name__)

# GET request for mentor applications by email 
@apply.route("/<id>", methods=["GET"])
def get_application_by_email(id):
   # logger.info(email)
    # try:
    #     application = MentorApplication.objects.get(id=id)
    # except:
    #     msg = "No application currently exist with this email " + id
    #     logger.info(msg)
    #     return create_response(status=422, message=msg)
    application = MentorApplication.objects.get(id=id)
    return create_response(data={"mentor_application": application})

# DELETE request for mentor application by email
@apply.route("/<string:email>", methods=["DELETE"])
def delete_application(email):
    try:
        application = MentorApplication.objects.get(email=email)
    except:
        msg = "The application you attempted to delete was not found"
        logger.info(msg)
        return create_response(status=422, message=msg)

    application.delete()
    return create_response(status=200, message=f"Success")

# PUT requests for /application
@apply.route("/<string:email>", methods=["PUT"])
def edit_application(email):
    data = request.get_json()

    # Try to retrieve Mentor profile from database
    try:
        application = MentorApplication.objects.get(email=email)
    except:
        msg = "No application with that email"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # Edit fields or keep original data if no added data
    application.name = data.get("name", application.name)
    application.buisness_number = data.get("buisness_number", application.buisness_number)
    application.cell_number = data.get("cell_number", application.cell_number)
    application.hear_about_us = data.get("hear_about_us", application.hear_about_us)
    application.offer_donation = data.get("offer_donation", application.offer_donation)
    application.mentoring_options = data.get("mentoring_options", application.mentoring_options)
    application.employer_name = data.get("employer_name", application.employer_name)

    # does this need a traversal to edit each work sector? 
    application.work_sectors = data.get("work_sectors", application.work_sectors)

    application.role_description = data.get("role_description", application.role_description)
    application.time_at_current_company = data.get("time_at_current_company", application.time_at_current_company)
    application.linkedin = data.get("linkedin", application.linkedin)
    application.why_join_mentee = data.get("why_join_mentee", application.why_join_mentee)
    application.commit_time = data.get("commit_time", application.commit_time)

    #does this need a traversal? 
    application.guidance_topics = data.get("guidance_topics", application.guidance_topics)

    application.immigrant_status = data.get("immigrant_status", application.immigrant_status)
    application.languages = data.get("languages", application.languages)
    application.referral = data.get("referral", application.referral)
    application.knowledge_location = data.get("knowledge_location", application.knowledge_location)
    application.verified = data.get("verified", application.verified)
    application.save()

    return create_response(status=200, message=f"Success")

