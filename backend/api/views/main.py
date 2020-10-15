from flask import Blueprint, request, jsonify
from api.models import db, Person, Email, MentorProfile, Education, Video
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import MentorForm, EducationForm, VideoForm

main = Blueprint("main", __name__)  # initialize blueprint


# function that is called when you visit /
@main.route("/")
def index():
    # you are now in the current application context with the main.route decorator
    # access the logger with the logger from api.core and uses the standard logging module
    # try using ipdb here :) you can inject yourself
    logger.info("Hello World!")
    return "Hello World!"


# GET request for /mentors
@main.route("/mentors", methods=["GET"])
def get_mentors():
    mentors = MentorProfile.objects()
    return create_response(data={"mentors": mentors})


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
    emails = []
    for email in data["emails"]:
        email_obj = Email(email=email)
        emails.append(email_obj)
    new_person = Person(name=data["name"], emails=emails)
    new_person.save()

    return create_response(
        message=f"Successfully created person {new_person.name} with id: {new_person.id}"
    )


# POST request for a new mentor profile
@main.route("/mentor", methods=["POST"])
def create_mentor_profile():
    data = request.json
    validate_data = MentorForm.from_json(data)

    if not validate_data.validate():
        msg = ", ".join(validate_data.errors.keys())
        return create_response(status=422, message="Missing fields " + msg)

    new_mentor = MentorProfile(
        name=data["name"],
        professional_title=data["professional_title"],
        linkedin=data["linkedin"],
        website=data["website"],
        picture=data["picture"],
        languages=data["languages"],
        specializations=data["specializations"],
        offers_in_person=data["offers_in_person"],
        offers_group_appointments=data["offers_group_appointments"],
    )

    new_mentor.biography = data.get("biography")

    if "education" in data:
        education_data = data["education"]
        validate_education = EducationForm.from_json(education_data)

        if not validate_education.validate():
            msg = ", ".join(validate_education.errors.keys())
            return create_response(status=422, message="Missing fields " + msg)

        new_education = Education(
            education_level=education_data["education_level"],
            majors=education_data["majors"],
            school=education_data["school"],
            graduation_year=education_data["graduation_year"],
        )
        new_mentor.education = new_education

    if "videos" in data:
        videos_data = data["videos"]

        for video in videos_data:
            validate_video = VideoForm.from_json(video)

            if not validate_video.validate():
                msg = ", ".join(validate_video.errors.keys())
                return create_response(
                    status=422, message="Missing fields " + msg
                )

            new_video = Video(title=video["title"], url=video["url"], tag=video["tag"])
            new_mentor.videos.append(new_video)

    new_mentor.save()
    return create_response(
        message=f"Successfully created Mentor Profile {new_mentor.name} with UID: {new_mentor.uid}"
    )
