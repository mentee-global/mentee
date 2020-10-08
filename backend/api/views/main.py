from flask import Blueprint, request, jsonify
from api.models import db, Person, Email, MentorProfile, Education, Video
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import mentor_post_verify

main = Blueprint("main", __name__)  # initialize blueprint


# function that is called when you visit /
@main.route("/")
def index():
    # you are now in the current application context with the main.route decorator
    # access the logger with the logger from api.core and uses the standard logging module
    # try using ipdb here :) you can inject yourself
    logger.info("Hello World!")
    return "Hello World!"


# function that is called when you visit /persons
@main.route("/persons", methods=["GET"])
def get_persons():
    persons = Person.objects()
    return create_response(data={"persons": persons})


# POST request for /persons
@main.route("/persons", methods=["POST"])
def create_person():
    data = request.get_json()

    logger.info("Data recieved: %s", data)
    if "name" not in data:
        msg = "No name provided for person."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "emails" not in data:
        msg = "No email provided for person."
        logger.info(msg)
        return create_response(status=422, message=msg)

    #  create MongoEngine objects
    new_person = Person(name=data["name"])
    for email in data["emails"]:
        email_obj = Email(email=email)
        new_person.emails.append(email_obj)
    new_person.save()

    return create_response(
        message=f"Successfully created person {new_person.name} with id: {new_person.id}"
    )


# TODO: Make this cleaner!
@main.route("/mentor", methods=["POST"])
def create_mentor_profile():
    data = request.get_json()

    if data is None:
        return create_response(status=400, message="No data provided for new FP")

    logger.info("Data received: %s", data)
    msg, body_error = mentor_post_verify(data, "main_body")
    if body_error:
        logger.info(msg)
        return create_response(status=422, message=msg)

    new_mentor = MentorProfile()
    new_mentor.uid = "TBD"
    new_mentor.name = data["name"]
    new_mentor.professional_title = data["professional_title"]
    new_mentor.linkedin = data["linkedin"]
    new_mentor.website = data["website"]
    new_mentor.picture = data["picture"]
    new_mentor.offers_in_person = data["offers_in_person"]
    new_mentor.offers_group_appointments = data["offers_group_appointments"]
    for language in data["languages"]:
        new_mentor.languages.append(language)
    for specialization in data["specializations"]:
        new_mentor.specializations.append(specialization)

    # If optional field Education is passed
    if "education" in data:
        education_data = data["education"]
        msg, education_error = mentor_post_verify(education_data, "education")
        if education_error:
            logger.info(msg)
            return create_response(status=422, message=msg)

        new_education = Education()
        new_education.education_level = education_data["education_level"]
        new_education.school = education_data["school"]
        new_education.graduation_year = education_data["graduation_year"]
        for major in education_data["majors"]:
            new_education.majors.append(major)
        new_mentor.education = new_education

    # If optional field Video is passed
    if "video" in data:
        video_data = data["video"]
        msg, video_error = mentor_post_verify(video_data, "video")
        if video_error:
            logger.info(msg)
            return create_response(status=422, message=msg)
        new_video = Video(
            title=video_data["title"], url=video_data["url"], tag=video_data["tag"]
        )
        new_mentor.video = new_video

    new_mentor.save()
    return create_response(
        message=f"Successfully created Mentor Profile {new_mentor.name} with UID: {new_mentor.uid}"
    )
