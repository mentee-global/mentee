from os import path
from flask import Blueprint, request, jsonify, send_from_directory
from bson import ObjectId
from api.models import (
    db,
    Education,
    Video,
    MentorProfile,
    MenteeProfile,
    AppointmentRequest,
    Users,
    Image,
)
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import (
    MentorForm,
    EducationForm,
    VideoForm,
    is_invalid_form,
    imgur_client,
)
from api.utils.profile_parse import new_profile, edit_profile

main = Blueprint("main", __name__)  # initialize blueprint

# GET request for /mentors
@main.route("/mentors", methods=["GET"])
def get_mentors():
    mentors = MentorProfile.objects().exclude("availability", "videos")
    return create_response(data={"mentors": mentors})


# GET request for /mentees
@main.route("/mentees", methods=["GET"])
def get_mentees():
    mentees = MenteeProfile.objects()
    return create_response(data={"mentees": mentees})


# GET request for specific mentor based on id
@main.route("/mentor/<string:mentor_id>", methods=["GET"])
def get_mentor(mentor_id):
    try:
        mentor = MentorProfile.objects.get(id=mentor_id)
    except:
        msg = "No mentors currently exist with ID " + mentor_id
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"mentor": mentor})


# GET request for specific mentee based on id
@main.route("/mentee/<string:mentee_id>", methods=["GET"])
def get_mentee(mentee_id):
    try:
        mentee = MenteeProfile.objects.get(id=mentee_id)
    except:
        msg = "No mentee currently exists with ID " + mentee_id
        logger.info(msg)
        return create_response(data={"mentee": mentee})
    return create_response(date={"mentee": mentee})


# POST request for a new mentor profile
@main.route("/mentor", methods=["POST"])
def create_mentor_profile():
    data = request.json
    validate_data = MentorForm.from_json(data)

    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)

    user = Users.objects.get(id=data["user_id"])
    data["email"] = user.email

    new_mentor = new_profile(data=data, profile_type="mentor")

    new_mentor.save()
    return create_response(
        message=f"Successfully created Mentor Profile {new_mentor.name}",
        data={"mentorId": str(new_mentor.id)},
    )


# PUT requests for /mentor
@main.route("/mentor/<id>", methods=["PUT"])
def edit_mentor(id):
    data = request.get_json()

    # Try to retrieve Mentor profile from database
    try:
        mentor = MentorProfile.objects.get(id=id)
    except:
        msg = "No mentor with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    res = edit_profile(data, mentor)
    if not res:
        msg = "couldn't update profile"
        return create_response(status=500, message=msg)

    mentor.save()

    return create_response(status=200, message=f"Success")


@main.route("/mentor/<id>/image", methods=["PUT"])
def uploadImage(id):
    data = request.files["image"]

    try:
        image_response = imgur_client.send_image(data)
    except:
        return create_response(status=400, message=f"Image upload failed")
    try:
        mentor = MentorProfile.objects.get(id=id)
    except:
        msg = "No mentor with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    try:
        if mentor.image is True and mentor.image.image_hash is True:
            image_response = imgur_client.delete_image(mentor.image.image_hash)
    except:
        logger.info("Failed to delete image but saving new image")

    new_image = Image(
        url=image_response["data"]["link"],
        image_hash=image_response["data"]["deletehash"],
    )

    mentor.image = new_image

    mentor.save()
    return create_response(status=200, message=f"Success")
