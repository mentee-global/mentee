from flask import Blueprint, request, jsonify
from api.models import db, Person, Email, MentorProfile, Education, Video
from api.core import create_response, serialize_list, logger

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


#
@main.route("/mentor", methods=["POST"])
def create_mentor_profile():
    data = request.get_json()

    if data is None:
        return create_response(status=400, message="No data provided for new FP")

    # TODO: Possibly include WTForms instead in order to simplify this type of checking
    logger.info("Data received: %s", data)
    if "name" not in data:
        msg = "No name provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "professional_title" not in data:
        msg = "No professional title provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "linkedin" not in data:
        msg = "No linkedin provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "website" not in data:
        msg = "No website provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "picture" not in data:
        msg = "No picture provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "languages" not in data:
        msg = "No languages provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "specializations" not in data:
        msg = "No specializations provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "offers_in_person" not in data:
        msg = "No offers in person provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)
    if "offers_group_appointments" not in data:
        msg = "No offers group appointments provided for mentor profile."
        logger.info(msg)
        return create_response(status=422, message=msg)

    new_mentor = MentorProfile()
    new_mentor.uid = "1"
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

    if "education" in data:
        msg = "Recieved education"
        logger.info(msg)

        education_data = data["education"]

        if "education_level" not in education_data:
            msg = "No education_level provided for mentor education"
            logger.info(msg)
            return create_response(status=422, message=msg)
        if "majors" not in education_data:
            msg = "No majors provided for mentor education"
            logger.info(msg)
            return create_response(status=422, message=msg)
        if "school" not in education_data:
            msg = "No school provided for mentor education"
            logger.info(msg)
            return create_response(status=422, message=msg)
        if "graduation_year" not in education_data:
            msg = "No graduation year provided for mentor education"
            logger.info(msg)
            return create_response(status=422, message=msg)

        new_education = Education()
        new_education.education_level = education_data["education_level"]
        new_education.school = education_data["school"]
        new_education.graduation_year = education_data["graduation_year"]

        for major in education_data["majors"]:
            new_education.majors.append(major)

        new_mentor.education = new_education

    if "video" in data:
        msg = "Received video"
        logger.info(msg)

        video_data = data["video"]
        logger.info(video_data)

        if "title" not in video_data:
            msg = "No title provided for mentor video"
            logger.info(msg)
            return create_response(status=422, message=msg)
        if "url" not in video_data:
            msg = "No URL provided for mentor video"
            logger.info(msg)
            return create_response(status=422, message=msg)
        if "tag" not in video_data:
            msg = "No tag provided for mentor video"
            logger.info(msg)
            return create_response(status=422, message=msg)

        new_video = Video(title=video_data["title"], url=video_data["url"], tag=video_data["tag"])
        new_mentor.video = new_video
    new_mentor.save()
    
    return create_response(message=f"Successfully created Mentor Profile {new_mentor.name} with UID: {new_mentor.uid}")
