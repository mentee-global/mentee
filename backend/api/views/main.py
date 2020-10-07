from flask import Blueprint, request, jsonify
from api.models import db, Person, Email, Video, Education, MentorProfile
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

# PUT requests for /mentor
@main.route("/mentor/<id>", methods=["PUT"])
def edit_mentor(id):
    data = request.get_json()
    mentor = MentorProfile.objects.get(id=id)
    # try: 
    #     
    #     print(mentor)
    # except Exception as e:
    #     print(e)
    #     return create_response(status=422, message="No mentor with that id")

    if data == None:
         return create_response(status=400, message="No data provided to update Mentor Profile")

    if "name" in data:
        mentor.name = data.get("name")

    if "professional_title" in data:
        mentor.professional_title = data.get("professional_title")
    
    if "linkedin" in data:
        mentor.linkedin = data.get("linkedin")
    
    if "website" in data:
        mentor.website = data.get("website")
    
    if "picture" in data:
        mentor.picture = data.get("picture")
    
    if "education" in data:
        education_data = data.get("education")
        new_education = Education(education_level=education_data.get("education_level"), 
                                  majors = education_data.get("majors"),
                                  school = education_data.get("school"), graduation_year = education_data.get("graduation_year"))
        mentor.education = new_education
    if "languages" in data:
        mentor.languages = data.get("languages")
    
    if "specializations" in data:
        mentor.specializations = data.get("specializations")
    
    if "biography" in data:
        mentor.biography = data.get("biography")

    if "offers_in_person" in data:
        mentor.offers_in_person = data.get("offers_in_person")
    
    if "offers_group_appointments" in data:
        mentor.offers_group_appointments = data.get("offers_group_appointments")

    #TODO: Determine if we keep videos in mentor profile    
    if "video" in data:
        video_data = data.get("video")
        new_video = Video(title=video_data.get("title"), url=video_data.get("url"), tag=video_data.get("tag"))
        mentor.video = new_video

    mentor.save()

    #TODO: 
    return create_response(
        status=200,
        data={"Success"}
    ) 