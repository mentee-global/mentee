from flask import Blueprint, request, jsonify
from api.models import db, Person, Email, MentorProfile
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


# GET request for /mentors
@main.route("/mentors", methods=["GET"])
def get_mentors():
    mentors = MentorProfile.objects()
    return create_response(data={"mentors": mentors})


# GET request for specific mentor based on id
@main.route("/mentors/<string:mentor_id>", methods=["GET"])
def get_mentor(mentor_id):
    try:
        mentor = MentorProfile.objects.get(id=mentor_id)
    except:
        msg = "This mentor does not exist!"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"mentor": mentor})

  
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
