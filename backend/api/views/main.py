from flask import Blueprint, request
from bson import ObjectId
from api.models import (
    db,
    MentorProfile,
    MenteeProfile,
    AppointmentRequest,
    Users,
    Image,
)
from api.core import create_response, logger
from api.utils.request_utils import (
    MentorForm,
    MenteeForm,
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

    if "videos" in data:
        for video in data["videos"]:
            validate_video = VideoForm.from_json(video)

            msg, is_invalid = is_invalid_form(validate_video)
            if is_invalid:
                return create_response(status=422, message=msg)

    if "education" in data:
        for education in data["education"]:
            validate_education = EducationForm.from_json(education)

            msg, is_invalid = is_invalid_form(validate_education)
            if is_invalid:
                return create_response(status=422, message=msg)

    user = Users.objects.get(id=data["user_id"])
    data["email"] = user.email

    new_mentor = new_profile(data=data, profile_type="mentor")

    if not new_mentor:
        msg = "Could not parse Mentor Data"
        create_response(status=400, message=msg)

    new_mentor.save()
    return create_response(
        message=f"Successfully created Mentor Profile {new_mentor.name}",
        data={"mentorId": str(new_mentor.id)},
    )


# POST request for a new mentee profile
@main.route("/mentee", methods=["POST"])
def create_mentee_profile():
    data = request.json
    validate_data = MenteeForm.from_json(data)

    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)

    if "education" in data:
        for education in data["education"]:
            validate_education = EducationForm.from_json(education)

            msg, is_invalid = is_invalid_form(validate_education)
            if is_invalid:
                return create_response(status=422, message=msg)

    user = Users.objects.get(id=data["user_id"])
    data["email"] = user.email

    new_mentee = new_profile(data=data, profile_type="mentee")

    if not new_mentee:
        msg = "Could not parse Mentee Data"
        create_response(status=400, message=msg)

    new_mentee.save()
    return create_response(
        message=f"Successfully created Mentee Profile {new_mentee.name}",
        data={"menteeId": str(new_mentee.id)},
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

    if not edit_profile(data, mentor):
        msg = "Couldn't update profile"
        return create_response(status=500, message=msg)

    mentor.save()

    return create_response(status=200, message=f"Success")


# PUT requests for /mentee
@main.route("/mentee/<id>", methods=["PUT"])
def edit_mentee(id):
    data = request.get_json()

    # Try to retrieve Mentor profile from database
    try:
        mentee = MenteeProfile.objects.get(id=id)
    except:
        msg = "No mentee with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if not edit_profile(data, mentee):
        msg = "Couldn't update profile"
        return create_response(status=500, message=msg)

    mentee.save()

    return create_response(status=200, message=f"Success")


@main.route("/account/<id>/image", methods=["PUT"])
def uploadImage(id):
    image = request.files["image"]
    account_type = request.form["type"]
    account = None

    try:
        image_response = imgur_client.send_image(image)
    except:
        return create_response(status=400, message=f"Image upload failed")
    try:
        if account_type == "mentee":
            account = MenteeProfile.objects.get(id=id)
        elif account_type == "mentor":
            account = MentorProfile.objects.get(id=id)
    except:
        msg = "No account with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    try:
        if account.image is True and account.image.image_hash is True:
            image_response = imgur_client.delete_image(account.image.image_hash)
    except:
        logger.info("Failed to delete image but saving new image")

    new_image = Image(
        url=image_response["data"]["link"],
        image_hash=image_response["data"]["deletehash"],
    )

    account.image = new_image

    account.save()
    return create_response(status=200, message=f"Success")
