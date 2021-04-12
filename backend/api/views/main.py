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
    EducationForm,
    VideoForm,
    is_invalid_form,
    imgur_client,
)
from api.utils.profile_parse import new_profile, edit_profile
from api.utils.constants import Account

main = Blueprint("main", __name__)  # initialize blueprint

# GET request for /accounts/<type>
@main.route("/accounts/<int:account_type>", methods=["GET"])
def get_accounts(account_type):
    accounts = None
    if account_type == Account.MENTOR:
        accounts = MentorProfile.objects().exclude("availability", "videos")
    elif account_type == Account.MENTEE:
        accounts = MenteeProfile.objects().exclude("video", "phone_number", "email")
    else:
        msg = "Given parameter does not match the current exiting account_types of accounts"
        return create_response(status=422, message=msg)

    return create_response(data={"accounts": accounts})

# GET request for specific account based on id
@main.route("/account/<string:id>", methods=["GET"])
def get_account(id):
    try:
        account_type = int(request.args["account_type"])
    except:
        msg = "Missing account_type param or account_type param is not an int"
        return create_response(status=422, message=msg)

    account = None
    try:
        if account_type == Account.MENTEE:
            account = MenteeProfile.objects.get(id=id)
        elif account_type == Account.MENTOR:
            account = MentorProfile.objects.get(id=id)
        else:
            msg = "Level param doesn't match existing account types"
            return create_response(status=422, message=msg)
    except:
        msg = ""
        if account_type == Account.MENTEE:
            msg = "No mentee with that id"
        elif account_type == Account.MENTOR:
            msg = "No mentor with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"account": account})


# POST request for a new account profile
@main.route("/account", methods=["POST"])
def create_mentor_profile():
    data = request.json

    try:
        account_type = int(data["account_type"])
    except:
        msg = "Missing account_type param or account_type param is not an int"
        logger.info(msg)
        return create_response(status=422, message=msg)

    validate_data = None
    if account_type == Account.MENTOR:
        validate_data = MentorForm.from_json(data)
    elif account_type == Account.MENTEE:
        validate_data = MenteeForm.from_json(data)
    else:
        msg = "Level param does not match existing account types"
        logger.info(msg)
        return create_response(status=422, message=msg)

    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        logger.info(msg)
        return create_response(status=422, message=msg)

    if "videos" in data and account_type == Account.MENTOR:
        for video in data["videos"]:
            validate_video = VideoForm.from_json(video)

            msg, is_invalid = is_invalid_form(validate_video)
            if is_invalid:
                logger.info(msg)
                return create_response(status=422, message=msg)
    elif "video" in data and account_type == Account.MENTEE:
        validate_video = VideoForm.from_json(data["video"])

        msg, is_invalid = is_invalid_form(validate_video)
        if is_invalid:
            logger.info(msg)
            return create_response(status=422, message=msg)

    if "education" in data:
        for education in data["education"]:
            validate_education = EducationForm.from_json(education)

            msg, is_invalid = is_invalid_form(validate_education)
            if is_invalid:
                return create_response(status=422, message=msg)

    logger.info(data)
    new_account = new_profile(data=data, profile_type=account_type)

    if not new_account:
        msg = "Could not parse Account Data"
        logger.info(msg)
        create_response(status=400, message=msg)

    new_account.save()
    return create_response(
        message=f"Successfully created Mentor Profile {new_account.name}",
        data={"mentorId": str(new_account.id)},
    )


# PUT requests for /account
@main.route("/account/<id>", methods=["PUT"])
def edit_mentor(id):
    data = request.get_json()

    try:
        account_type = int(request.args["account_type"])
    except:
        msg = "Level param doesn't exist or isn't an int"
        return create_response(status=422, message=msg)

    # Try to retrieve account profile from database
    account = None
    try:
        if account_type == Account.MENTEE:
            account = MenteeProfile.objects.get(id=id)
        elif account_type == Account.MENTOR:
            account = MentorProfile.objects.get(id=id)
        else:
            msg = "Level param doesn't match existing account types"
            return create_response(status=422, message=msg)
    except:
        msg = ""
        if account_type == Account.MENTEE:
            msg = "No mentee with that id"
        elif account_type == Account.MENTOR:
            msg = "No mentor with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if not edit_profile(data, account):
        msg = "Couldn't update profile"
        return create_response(status=500, message=msg)

    account.save()

    return create_response(status=200, message=f"Success")


@main.route("/account/<id>/image", methods=["PUT"])
def uploadImage(id):
    image = request.files["image"]
    try:
        account_type = int(request.form["account_type"])
    except:
        msg = "Level param doesn't exist or isn't an int"
        return create_response(status=422, message=msg)

    account = None

    try:
        image_response = imgur_client.send_image(image)
    except:
        return create_response(status=400, message=f"Image upload failed")

    try:
        if account_type == Account.MENTEE:
            account = MenteeProfile.objects.get(id=id)
        elif account_type == Account.MENTOR:
            account = MentorProfile.objects.get(id=id)
        else:
            msg = "Level param doesn't match existing account types"
            return create_response(status=422, message=msg)
    except:
        msg = ""
        if account_type == Account.MENTEE:
            msg = "No mentee with that id"
        elif account_type == Account.MENTOR:
            msg = "No mentor with that id"
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
