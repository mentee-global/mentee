from os import path
from flask import Blueprint, request, jsonify
from bson import ObjectId
from api.models import db, Education, Video, MentorProfile, AppointmentRequest
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import (
    MentorForm,
    EducationForm,
    VideoForm,
    is_invalid_form,
    imgur_client,
)

main = Blueprint("main", __name__)  # initialize blueprint

# GET request for /mentors
@main.route("/mentors", methods=["GET"])
def get_mentors():
    mentors = MentorProfile.objects()
    return create_response(data={"mentors": mentors})


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


# POST request for a new mentor profile
@main.route("/mentor", methods=["POST"])
def create_mentor_profile():
    data = request.json
    validate_data = MentorForm.from_json(data)

    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)

    new_mentor = MentorProfile(
        user_id=ObjectId(data["user_id"]),
        name=data["name"],
        email=data["email"],
        professional_title=data["professional_title"],
        linkedin=data["linkedin"],
        website=data["website"],
        languages=data["languages"],
        specializations=data["specializations"],
        offers_in_person=data["offers_in_person"],
        offers_group_appointments=data["offers_group_appointments"],
    )

    new_mentor.biography = data.get("biography")
    new_mentor.phone_number = data.get("phone_number")
    new_mentor.location = data.get("location")

    if "education" in data:
        new_mentor.education = []
        education_data = data["education"]

        for education in education_data:
            validate_education = EducationForm.from_json(education)

            msg, is_invalid = is_invalid_form(validate_education)
            if is_invalid:
                return create_response(status=422, message=msg)

            new_education = Education(
                education_level=education["education_level"],
                majors=education["majors"],
                school=education["school"],
                graduation_year=education["graduation_year"],
            )
            new_mentor.education.append(new_education)

    if "videos" in data:
        videos_data = data["videos"]

        for video in videos_data:
            validate_video = VideoForm.from_json(video)

            msg, is_invalid = is_invalid_form(validate_video)
            if is_invalid:
                return create_response(status=422, message=msg)

            new_video = Video(title=video["title"], url=video["url"], tag=video["tag"])
            new_mentor.videos.append(new_video)

    new_mentor.save()
    return create_response(
        message=f"Successfully created Mentor Profile {new_mentor.name} with UID: {new_mentor.uid}"
    )


# PUT requests for /mentor
@main.route("/mentor/<id>", methods=["PUT"])
def edit_mentor(id):
    data = request.get_json()

    logger.info("Data received: %s", data)

    # Try to retrieve Mentor profile from database
    try:
        mentor = MentorProfile.objects.get(id=id)
    except:
        msg = "No mentor with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # Edit fields or keep original data if no added data
    mentor.name = data.get("name", mentor.name)
    mentor.professional_title = data.get(
        "professional_title", mentor.professional_title
    )
    mentor.location = data.get("location", mentor.location)
    mentor.email = data.get("email", mentor.email)
    mentor.phone_number = data.get("phone_number", mentor.phone_number)
    mentor.specializations = data.get("specializations", mentor.specializations)
    mentor.languages = data.get("languages", mentor.languages)
    mentor.offers_group_appointments = data.get(
        "offers_group_appointments", mentor.offers_group_appointments
    )
    mentor.offers_in_person = data.get("offers_in_person", mentor.offers_in_person)
    mentor.biography = data.get("biography", mentor.biography)
    mentor.linkedin = data.get("linkedin", mentor.linkedin)
    mentor.website = data.get("website", mentor.website)

    # Create education object
    if "education" in data:
        education_data = data.get("education")
        mentor.education = [
            Education(
                education_level=education.get("education_level"),
                majors=education.get("majors"),
                school=education.get("school"),
                graduation_year=education.get("graduation_year"),
            )
            for education in education_data
        ]

    # Create video objects for each item in list
    if "videos" in data:
        video_data = data.get("videos")
        mentor.videos = [
            Video(title=video.get("title"), url=video.get("url"), tag=video.get("tag"))
            for video in video_data
        ]

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
        if mentor.image.image_hash is True:
            image_response = imgur_client.delete_image(mentor.image.image_hash)
    except:
        msg = "Failed to delete image"
        logger.info(msg)
        return create_response(status=422, message=msg)

    mentor.image.url = image_response["data"]["link"]
    mentor.image.image_hash = image_response["data"]["deletehash"]

    mentor.save()
    return create_response(status=200, message=f"Success")
