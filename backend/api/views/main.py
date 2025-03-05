from ast import Not
from flask import Blueprint, request
from sqlalchemy import true
from datetime import datetime
import requests
from io import BytesIO
from uuid import uuid4
from api.utils.google_storage import (
    delete_image_from_storage,
    upload_image_to_storage,
    compress_image,
)
from api.views.auth import create_firebase_user
from api.utils.request_utils import PartnerForm

from api.models import (
    Admin,
    MenteeApplication,
    MentorApplication,
    MentorProfile,
    MenteeProfile,
    Support,
    Users,
    Image,
    Video,
    PartnerProfile,
    Notifications,
    Guest,
    Hub,
    Countries,
)
from api.utils.constants import PROFILE_COMPLETED, TRANSLATIONS, ALERT_TO_ADMINS
from api.utils.request_utils import send_email
from api.core import create_response, logger
from api.utils.request_utils import (
    MentorForm,
    MenteeForm,
    EducationForm,
    VideoForm,
    is_invalid_form,
    imgur_client,
    application_model,
    get_profile_model,
)
from api.utils.constants import NEW_APPLICATION_STATUS
from api.utils.profile_parse import new_profile, edit_profile
from api.utils.constants import Account
from api.utils.require_auth import all_users, mentee_only, verify_user
from firebase_admin import auth as firebase_admin_auth


main = Blueprint("main", __name__)  # initialize blueprint


# GET request for /accounts/<type>
@main.route("/accounts/<int:account_type>", methods=["GET"])
# @all_users
def get_accounts(account_type):
    accounts = None
    if account_type == Account.MENTOR:
        mentors_data = MentorProfile.objects().exclude(
            "availability",
            "videos",
            "firebase_uid",
            "linkedin",
            "website",
            "education",
            "biography",
            "taking_appointments",
            "text_notifications",
            "email_notifications",
        )
        all_partners = PartnerProfile.objects()
        partners_by_assign_mentor = {}
        for partner_account in all_partners:
            if partner_account.assign_mentors:
                for mentor_item in partner_account.assign_mentors:
                    partners_by_assign_mentor[str(mentor_item["id"])] = partner_account
        for account in mentors_data:
            if str(account.id) in partners_by_assign_mentor:
                pair_partner = partners_by_assign_mentor[str(account.id)]
                if pair_partner is not None:
                    partner_data = {
                        "id": str(pair_partner.id),
                        "email": pair_partner.email,
                        "organization": pair_partner.organization,
                        "person_name": pair_partner.person_name,
                        "website": pair_partner.website,
                        "image": pair_partner.image,
                        "restricted": pair_partner.restricted,
                        "assign_mentors": pair_partner.assign_mentors,
                        "assign_mentees": pair_partner.assign_mentees,
                    }
                    account.pair_partner = partner_data
            if accounts is None:
                accounts = []
            accounts.append(account)
    elif account_type == Account.MENTEE:
        if "restricted" in request.args:
            mentees_data = MenteeProfile.objects().exclude("video", "phone_number")
        else:
            mentees_data = MenteeProfile.objects(is_private=False).exclude(
                "video", "phone_number"
            )
        all_partners = PartnerProfile.objects()
        partners_by_assign_mentee = {}
        for partner_account in all_partners:
            if partner_account.assign_mentees:
                for mentee_item in partner_account.assign_mentees:
                    if "id" in mentee_item:
                        partners_by_assign_mentee[
                            str(mentee_item["id"])
                        ] = partner_account
        for account in mentees_data:
            if str(account.id) in partners_by_assign_mentee:
                pair_partner = partners_by_assign_mentee[str(account.id)]
                partner_data = {
                    "id": str(pair_partner.id),
                    "email": pair_partner.email,
                    "organization": pair_partner.organization,
                    "person_name": pair_partner.person_name,
                    "website": pair_partner.website,
                    "image": pair_partner.image,
                    "restricted": pair_partner.restricted,
                    "assign_mentors": pair_partner.assign_mentors,
                    "assign_mentees": pair_partner.assign_mentees,
                }
                account.pair_partner = partner_data
            if accounts is None:
                accounts = []
            accounts.append(account)
    elif account_type == Account.PARTNER:
        Hub_users = Hub.objects()
        Hub_users_object = {}
        for hub_user in Hub_users:
            Hub_users_object[str(hub_user.id)] = {
                "name": hub_user.name,
                "url": hub_user.url,
                "email": hub_user.email,
                "image": hub_user.image,
            }
        if "restricted" in request.args:
            if request.args["restricted"] == "true":
                if "hub_user_id" in request.args:
                    if request.args["hub_user_id"] != "":
                        accounts = PartnerProfile.objects.filter(
                            restricted=True, hub_id=request.args["hub_user_id"]
                        )
                    else:
                        accounts = PartnerProfile.objects(restricted=True)
                else:
                    accounts = PartnerProfile.objects.filter(
                        restricted=True, hub_id=None
                    )
            else:
                if "hub_user_id" in request.args:
                    if request.args["hub_user_id"] != "":
                        accounts = PartnerProfile.objects.filter(
                            restricted__ne=True, hub_id=request.args["hub_user_id"]
                        )
                    else:
                        accounts = PartnerProfile.objects.filter(restricted__ne=True)
                else:
                    accounts = PartnerProfile.objects.filter(
                        restricted__ne=True, hub_id=None
                    )
        else:
            if "hub_user_id" in request.args:
                if request.args["hub_user_id"] != "":
                    accounts = PartnerProfile.objects(
                        hub_id=request.args["hub_user_id"]
                    )
                else:
                    accounts = PartnerProfile.objects()
            else:
                accounts = PartnerProfile.objects(hub_id=None)
        temp = []
        for account in accounts:
            if account.hub_id is not None:
                account.hub_user = Hub_users_object[str(account.hub_id)]
            temp.append(account)
        accounts = temp
    elif account_type == Account.GUEST:
        accounts = Guest.objects()
    elif account_type == Account.SUPPORT:
        accounts = Support.objects()
    elif account_type == Account.HUB:
        accounts = Hub.objects()
    elif account_type == Account.ADMIN:
        accounts = Admin.objects()
    else:
        msg = "Given parameter does not match the current exiting account_types of accounts"
        return create_response(status=422, message=msg)

    return create_response(data={"accounts": accounts})


# GET request for specific account based on id
@main.route("/account/<string:id>", methods=["GET"])
# @all_users
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
        elif account_type == Account.PARTNER:
            account = PartnerProfile.objects.get(id=id)
            if "hub_id" in account and account.hub_id is not None:
                hub_profile = Hub.objects.get(id=account.hub_id)
                hub_user = {
                    "id": str(hub_profile.id),
                    "email": hub_profile.email,
                    "name": hub_profile.name,
                    "image": hub_profile.image,
                    "url": hub_profile.url,
                    "invite_key": hub_profile.invite_key,
                }
                account.hub_user = hub_user
        elif account_type == Account.GUEST:
            account = Guest.objects.get(id=id)
        elif account_type == Account.SUPPORT:
            account = Support.objects.get(id=id)
        elif account_type == Account.HUB:
            account = Hub.objects.get(id=id)
        else:
            msg = "Level param doesn't match existing account types"
            return create_response(status=422, message=msg)
    except:
        msg = ""
        if account_type == Account.MENTEE:
            msg = "No mentee with that id"
        elif account_type == Account.MENTOR:
            msg = "No mentor with that id"
        elif account_type == Account.HUB:
            try:
                account = PartnerProfile.objects.get(id=id)
                hub_user = None
                if "hub_id" in account and account.hub_id is not None:
                    hub_profile = Hub.objects.get(id=account.hub_id)
                    hub_user = {
                        "id": str(hub_profile.id),
                        "email": hub_profile.email,
                        "name": hub_profile.name,
                        "image": hub_profile.image,
                        "url": hub_profile.url,
                        "invite_key": hub_profile.invite_key,
                    }
                account.hub_user = hub_user
                return create_response(data={"account": account})
            except:
                return create_response(status=422, message=msg)
        logger.info(msg)
        return create_response(status=422, message=msg)
    pair_partner = None
    if account_type == Account.MENTEE:
        target = {"id": id, "name": account.name}
        pair_partner = PartnerProfile.objects(assign_mentees__in=[target]).first()
    if account_type == Account.MENTOR:
        target = {"id": id, "name": account.name}
        pair_partner = PartnerProfile.objects(assign_mentors__in=[target]).first()
    if pair_partner is not None:
        partner_data = {
            "id": str(pair_partner.id),
            "email": pair_partner.email,
            "organization": pair_partner.organization,
            "person_name": pair_partner.person_name,
            "website": pair_partner.website,
            "image": pair_partner.image,
            "restricted": pair_partner.restricted,
            "assign_mentors": pair_partner.assign_mentors,
            "assign_mentees": pair_partner.assign_mentees,
        }
        account.pair_partner = partner_data
    return create_response(data={"account": account})


# POST request for a new account profile
@main.route("/account", methods=["POST"])
# @all_users
def create_mentor_profile():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    try:
        account_type = int(data["account_type"])
    except:
        msg = "Missing account_type param or account_type param is not an int"
        logger.info(msg)
        return create_response(status=422, message=msg)
    data["firebase_uid"] = "temp"
    if account_type == Account.MENTOR:
        data["taking_appointments"] = True

    validate_data = None
    if account_type == Account.MENTOR:
        validate_data = MentorForm.from_json(data)
    elif account_type == Account.MENTEE:
        validate_data = MenteeForm.from_json(data)
    elif account_type == Account.PARTNER:
        validate_data = PartnerForm.from_json(data)
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

    elif data.get("video", False) and account_type == Account.MENTEE:
        validate_video = VideoForm.from_json(data["video"])

        msg, is_invalid = is_invalid_form(validate_video)
        if is_invalid:
            logger.info(msg)
            return create_response(status=422, message=msg)
        video_data = data.get("video")
        data["video"] = Video(
            title=video_data.get("title"),
            url=video_data.get("url"),
            tag=video_data.get("tag"),
            date_uploaded=video_data.get("date_uploaded"),
        )
    if data.get("video", False) and account_type == Account.MENTOR:
        validate_video = VideoForm.from_json(data["video"])

        msg, is_invalid = is_invalid_form(validate_video)
        if is_invalid:
            logger.info(msg)
            return create_response(status=422, message=msg)
        video_data = data.get("video")
        data["video"] = Video(
            title=video_data.get("title"),
            url=video_data.get("url"),
            tag=video_data.get("tag"),
            date_uploaded=video_data.get("date_uploaded"),
        )
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
        return create_response(status=400, message=msg)
    firebase_user, error_http_response = create_firebase_user(email, password)
    if error_http_response:
        firebase_user = firebase_admin_auth.get_user_by_email(email)
        if not firebase_user:
            return error_http_response

    firebase_uid = firebase_user.uid
    data["firebase_uid"] = firebase_uid
    new_account.firebase_uid = firebase_uid

    new_account.save()
    if account_type == Account.MENTOR:
        mentor_partenr_id = data.get("organization")
        if mentor_partenr_id is not None and mentor_partenr_id != 0:
            partenr_account = PartnerProfile.objects.get(id=mentor_partenr_id)
            if partenr_account is not None:
                assign_mentors = []
                if partenr_account.assign_mentors:
                    assign_mentors = partenr_account.assign_mentors
                assign_mentors.append(
                    {"id": str(new_account.id), "name": new_account.name}
                )
                partenr_account.assign_mentors = assign_mentors
                partenr_account.save()
    if account_type == Account.MENTEE:
        mentee_partenr_id = data.get("organization")
        if mentee_partenr_id is not None and mentee_partenr_id != 0:
            partenr_account = PartnerProfile.objects.get(id=mentee_partenr_id)
            if partenr_account is not None:
                assign_mentees = []
                if partenr_account.assign_mentees:
                    assign_mentees = partenr_account.assign_mentees
                assign_mentees.append(
                    {"id": str(new_account.id), "name": new_account.name}
                )
                partenr_account.assign_mentees = assign_mentees
                partenr_account.save()

    user = Users(
        firebase_uid=firebase_uid,
        email=email,
        role="{}".format(account_type),
        verified=False,
    )
    user.save()
    if account_type == Account.MENTEE:
        app_data = MenteeApplication.objects.get(email=email)
        if app_data is not None:
            app_data.application_state = "COMPLETED"
            app_data.save()
    # if account_type == Account.MENTOR:
    #     app_data = MentorApplication.objects.get(email=email)
    #     if app_data is not None:
    #         app_data.application_state = "COMPLETED"
    #         app_data.save()

    if account_type != Account.PARTNER:
        try:
            application = application_model(account_type)
            exist_application = application.objects.get(email=email)
            exist_application["application_state"] = NEW_APPLICATION_STATUS.COMPLETED
            exist_application.save()
        except:
            pass
    ########
    success, msg = send_email(
        recipient=email,
        data={
            new_account.preferred_language: True,
            "subject": TRANSLATIONS[new_account.preferred_language]["profile_complete"],
        },
        template_id=PROFILE_COMPLETED,
    )
    admin_data = Admin.objects()
    for admin in admin_data:
        txt_role = "Mentor"
        txt_name = ""
        if account_type == Account.MENTEE:
            txt_role = "Mentee"
        if account_type == Account.PARTNER:
            txt_role = "Partner"
            txt_name = data["organization"]
        else:
            txt_name = data["name"]
        success, msg = send_email(
            recipient=admin.email,
            template_id=ALERT_TO_ADMINS,
            data={
                "name": txt_name,
                "email": email,
                "role": txt_role,
                "action": "completed profile",
                new_account.preferred_language: True,
            },
        )

    notify = Notifications(
        message="New Mentor with name(" + new_account.name + ") has created profile"
        if account_type != Account.PARTNER
        else "New Partner with name("
        + new_account.person_name
        + ") has created profile",
        mentorId=str(new_account.id),
        readed=False,
        date_submitted=datetime.now(),
    )
    notify.save()
    if not success:
        logger.info(msg)
    return create_response(
        message=f"Successfully created {account_type} Profile account {new_account.email}",
        data={
            "mentorId": str(new_account.id),
            "email": new_account.email,
            "token": firebase_admin_auth.create_custom_token(
                firebase_uid, {"role": account_type}
            ).decode("utf-8"),
        },
    )


@main.route("/accountProfile", methods=["POST"])
# @all_users
def create_profile_existing_account():
    data = request.json
    email = data.get("email")
    user = firebase_admin_auth.get_user_by_email(email)
    data["firebase_uid"] = user.uid
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
    elif account_type == Account.PARTNER:
        validate_data = PartnerForm.from_json(data)
    else:
        msg = "Level param does not match existing account types"
        logger.info(msg)
        return create_response(status=422, message=msg)

    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        logger.info(msg)
        return create_response(status=422, message=msg)

    if data.get("videos", False) and account_type == Account.MENTOR:
        for video in data["videos"]:
            validate_video = VideoForm.from_json(video)

            msg, is_invalid = is_invalid_form(validate_video)
            if is_invalid:
                logger.info(msg)
                return create_response(status=422, message=msg)
    elif data.get("videos", False) and account_type == Account.MENTEE:
        validate_video = VideoForm.from_json(data["video"])

        msg, is_invalid = is_invalid_form(validate_video)
        if is_invalid:
            logger.info(msg)
            return create_response(status=422, message=msg)
        video_data = data.get("video")
        data["video"] = Video(
            title=video_data.get("title"),
            url=video_data.get("url"),
            tag=video_data.get("tag"),
            date_uploaded=video_data.get("date_uploaded"),
        )

    if "video" in data and account_type == Account.MENTOR:
        validate_video = VideoForm.from_json(data["video"])

        msg, is_invalid = is_invalid_form(validate_video)
        if is_invalid:
            logger.info(msg)
            return create_response(status=422, message=msg)
        video_data = data.get("video")
        data["video"] = Video(
            title=video_data.get("title"),
            url=video_data.get("url"),
            tag=video_data.get("tag"),
            date_uploaded=video_data.get("date_uploaded"),
        )
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

    admin_data = Admin.objects()
    for admin in admin_data:
        txt_role = "Mentor"
        txt_name = ""
        if account_type == Account.MENTEE:
            txt_role = "Mentee"
        if account_type == Account.PARTNER:
            txt_role = "Partner"
            txt_name = data["organization"]
        else:
            txt_name = data["name"]
        success, msg = send_email(
            recipient=admin.email,
            template_id=ALERT_TO_ADMINS,
            data={
                "name": txt_name,
                "email": email,
                "role": txt_role,
                "action": "completed profile",
                new_account.preferred_language: True,
            },
        )
    return create_response(
        message=f"Successfully created {account_type} Profile for existing account {new_account.email}",
        data={
            "mentorId": str(new_account.id),
            "email": new_account.email,
            "token": firebase_admin_auth.create_custom_token(
                new_account.firebase_uid, {"role": account_type}
            ).decode("utf-8"),
        },
    )


# PUT requests for /account
@main.route("/account/<id>", methods=["PUT"])
# @all_users
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
        token = request.headers.get("Authorization")
        claims = firebase_admin_auth.verify_id_token(token)
        login_user_role = claims.get("role")

        authorized, response = verify_user(account_type)
        if (
            not authorized
            and int(login_user_role) != Account.ADMIN
            and int(login_user_role) != Account.SUPPORT
            and int(login_user_role) != Account.HUB
        ):
            return response

        if account_type == Account.MENTEE:
            account = MenteeProfile.objects.get(id=id)
        elif account_type == Account.MENTOR:
            account = MentorProfile.objects.get(id=id)
        elif account_type == Account.PARTNER:
            account = PartnerProfile.objects.get(id=id)
        elif account_type == Account.HUB:
            try:
                account = Hub.objects.get(id=id)
            except:
                account = PartnerProfile.objects.get(id=id)
        elif account_type == Account.ADMIN:
            account = Admin.objects.get(id=id)
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
# @all_users
def uploadImage(id):
    image = request.files["image"]
    try:
        account_type = request.form["account_type"]
        if isinstance(account_type, str):
            account_type = int(account_type)
    except:
        msg = "Level param doesn't exist or isn't an int"
        return create_response(status=422, message=msg)

    account = None

    try:
        token = request.headers.get("Authorization")
        if token is None:
            if account_type == Account.PARTNER:
                account = PartnerProfile.objects.get(id=id)
            elif account_type == Account.MENTEE:
                account = MenteeProfile.objects.get(id=id)
            elif account_type == Account.MENTOR:
                account = MentorProfile.objects.get(id=id)
            else:
                msg = "Level param doesn't match existing account types"
                return create_response(status=422, message=msg)
        else:
            claims = firebase_admin_auth.verify_id_token(token)
            login_user_role = claims.get("role")

            authorized, response = verify_user(account_type)
            if (
                not authorized
                and int(login_user_role) != Account.ADMIN
                and int(login_user_role) != Account.SUPPORT
                and int(login_user_role) != Account.HUB
            ):
                return response
            if account_type == Account.MENTEE:
                account = MenteeProfile.objects.get(id=id)
            elif account_type == Account.MENTOR:
                account = MentorProfile.objects.get(id=id)
            elif account_type == Account.PARTNER:
                account = PartnerProfile.objects.get(id=id)
            elif account_type == Account.HUB:
                account = Hub.objects.get(id=id)
            elif account_type == Account.ADMIN:
                account = Admin.objects.get(id=id)

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

    new_file_name = f"{uuid4()}.jpg"
    try:
        public_url = upload_image_to_storage(compress_image(image), new_file_name)
    except:
        return create_response(status=500, message=f"Image upload failed")

    try:
        if account.image is True and account.image.url is not None:
            delete_image_from_storage(account.image.file_name)
    except:
        delete_image_from_storage(new_file_name)
        return create_response(
            status=500, message=f"Old image deletion failed, deleting new image"
        )

    new_image = Image(
        url=public_url,
        file_name=new_file_name,
    )
    account.image = new_image
    account.save()
    return create_response(status=200, message=f"Success")


# GET request for /account/<id>/private
@main.route("/account/<id>/private", methods=["GET"])
@mentee_only
def is_mentee_account_private(id):
    try:
        mentee = MenteeProfile.objects.get(id=id)
    except:
        msg = "No mentee with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"private": True if mentee.is_private else False})


@main.route("/countries", methods=["GET"])
# @all_users
def getAllCountries():
    try:
        countries = Countries.objects()
    except:
        msg = "failed connection"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"countries": countries})
