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
from mongoengine.queryset.visitor import Q

from api.models import (
    Admin,
    DirectMessage,
    MenteeApplication,
    MentorApplication,
    MentorProfile,
    MenteeProfile,
    Moderator,
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
        if "restricted" in request.args and request.args["restricted"] == "true":
            mentors_data = MentorProfile.objects.filter(paused_flag__ne=True).exclude(
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
        else:
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
    elif account_type == Account.MODERATOR:
        accounts = Moderator.objects()
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
        account_type = request.args["account_type"]
        if isinstance(account_type, str):
            account_type = int(account_type)
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
            if account.assign_mentees is not None and len(account.assign_mentees) > 0:
                mentee_ids = []
                for mentee in account.assign_mentees:
                    mentee_ids.append(mentee["id"])

                mentees = MenteeProfile.objects.filter(id__in=mentee_ids).all()
                send_messages = DirectMessage.objects.filter(
                    Q(sender_id__in=mentee_ids) | Q(recipient_id__in=mentee_ids)
                ).all()

                received_mentor_contacts = {}
                received_mentor_ids = []
                for send_message in send_messages:
                    if send_message.recipient_id not in received_mentor_ids:
                        received_mentor_ids.append(send_message.recipient_id)

                    if str(send_message.sender_id) not in received_mentor_contacts:
                        received_mentor_contacts[str(send_message.sender_id)] = {}
                        received_mentor_contacts[str(send_message.sender_id)][
                            str(send_message.recipient_id)
                        ] = {}
                    else:
                        if (
                            str(send_message.recipient_id)
                            not in received_mentor_contacts[str(send_message.sender_id)]
                        ):
                            received_mentor_contacts[str(send_message.sender_id)][
                                str(send_message.recipient_id)
                            ] = {}

                received_mentor_data = MentorProfile.objects.filter(
                    id__in=received_mentor_ids
                ).all()
                mentor_data_objects = {}
                for received_mentor in received_mentor_data:
                    mentor_data_objects[str(received_mentor.id)] = received_mentor

                temp = []
                for mentee in mentees:
                    message_receive_data = []
                    if str(mentee.id) in received_mentor_contacts:
                        for received_mentor in received_mentor_data:
                            if str(received_mentor.id) in mentor_data_objects:
                                message_data = [
                                    messagee.to_mongo()
                                    for messagee in send_messages
                                    if (
                                        (
                                            messagee["recipient_id"]
                                            == received_mentor.id
                                            and messagee["sender_id"] == mentee.id
                                        )
                                        or (
                                            messagee["recipient_id"] == mentee.id
                                            and messagee["sender_id"]
                                            == received_mentor.id
                                        )
                                    )
                                ]
                                message_receive_data.append(
                                    {
                                        "id": received_mentor.id,
                                        "image": mentor_data_objects[
                                            str(received_mentor.id)
                                        ].image,
                                        "receiver_name": mentor_data_objects[
                                            str(received_mentor.id)
                                        ].name,
                                        "message_data": message_data,
                                        "numberOfMessages": len(message_data),
                                    }
                                )
                    temp.append(
                        {
                            "id": mentee.id,
                            "name": mentee.name,
                            "email": mentee.email,
                            "image": mentee.image,
                            "message_receive_data": message_receive_data,
                        }
                    )
                account.assign_mentees = temp

            if account.assign_mentors is not None and len(account.assign_mentors) > 0:
                mentor_ids = []
                for mentor in account.assign_mentors:
                    mentor_ids.append(mentor["id"])

                mentors = MentorProfile.objects.filter(id__in=mentor_ids).all()
                received_messages = DirectMessage.objects.filter(
                    Q(recipient_id__in=mentor_ids) | Q(sender_id__in=mentor_ids)
                ).all()
                sent_mentee_contacts = {}
                sent_mentee_ids = []
                for received_message in received_messages:
                    if received_message.sender_id not in sent_mentee_ids:
                        sent_mentee_ids.append(received_message.sender_id)

                    if str(received_message.recipient_id) not in sent_mentee_contacts:
                        sent_mentee_contacts[str(received_message.recipient_id)] = {}
                        sent_mentee_contacts[str(received_message.recipient_id)][
                            str(received_message.sender_id)
                        ] = {}
                    else:
                        if (
                            str(received_message.sender_id)
                            not in sent_mentee_contacts[
                                str(received_message.recipient_id)
                            ]
                        ):
                            sent_mentee_contacts[str(received_message.recipient_id)][
                                str(received_message.sender_id)
                            ] = {}

                sent_mentee_data = MenteeProfile.objects.filter(
                    id__in=sent_mentee_ids
                ).all()
                mentee_data_objects = {}
                for sent_mentee in sent_mentee_data:
                    mentee_data_objects[str(sent_mentee.id)] = sent_mentee

                temp = []
                for mentor in mentors:
                    message_receive_data = []
                    if str(mentor.id) in sent_mentee_contacts:
                        for sent_mentee in sent_mentee_data:
                            if str(sent_mentee.id) in mentee_data_objects:
                                message_data = [
                                    messagee.to_mongo()
                                    for messagee in received_messages
                                    if (
                                        (
                                            messagee["sender_id"] == sent_mentee.id
                                            and messagee["recipient_id"] == mentor.id
                                        )
                                        or (
                                            messagee["sender_id"] == mentor.id
                                            and messagee["recipient_id"]
                                            == sent_mentee.id
                                        )
                                    )
                                ]
                                message_receive_data.append(
                                    {
                                        "id": sent_mentee.id,
                                        "image": mentee_data_objects[
                                            str(sent_mentee.id)
                                        ].image,
                                        "receiver_name": mentee_data_objects[
                                            str(sent_mentee.id)
                                        ].name,
                                        "message_data": message_data,
                                        "numberOfMessages": len(message_data),
                                    }
                                )

                    temp.append(
                        {
                            "id": mentor.id,
                            "name": mentor.name,
                            "email": mentor.email,
                            "image": mentor.image,
                            "message_receive_data": message_receive_data,
                        }
                    )
                account.assign_mentors = temp

        elif account_type == Account.GUEST:
            account = Guest.objects.get(id=id)
        elif account_type == Account.SUPPORT:
            account = Support.objects.get(id=id)
        elif account_type == Account.MODERATOR:
            account = Moderator.objects.get(id=id)
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

    # Check for duplicate email before proceeding
    if account_type == Account.MENTOR:
        existing_mentor = MentorProfile.objects(email=email).first()
        if existing_mentor:
            msg = f"Email {email} is already registered as a mentor"
            logger.info(msg)
            return create_response(status=422, message=msg)
    elif account_type == Account.MENTEE:
        existing_mentee = MenteeProfile.objects(email=email).first()
        if existing_mentee:
            msg = f"Email {email} is already registered as a mentee"
            logger.info(msg)
            return create_response(status=422, message=msg)
    elif account_type == Account.PARTNER:
        existing_partner = PartnerProfile.objects(email=email).first()
        if existing_partner:
            msg = f"Email {email} is already registered as a partner"
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
            if "organization" in data:
                txt_name = data["organization"]
            else:
                txt_name = data["title"]
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
        message=(
            "New Mentor with name(" + new_account.name + ") has created profile"
            if account_type != Account.PARTNER
            else "New Partner with name("
            + new_account.person_name
            + ") has created profile"
        ),
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

    # Check for duplicate email before proceeding
    if account_type == Account.MENTOR:
        existing_mentor = MentorProfile.objects(email=email).first()
        if existing_mentor:
            msg = f"Email {email} is already registered as a mentor"
            logger.info(msg)
            return create_response(status=422, message=msg)
    elif account_type == Account.MENTEE:
        existing_mentee = MenteeProfile.objects(email=email).first()
        if existing_mentee:
            msg = f"Email {email} is already registered as a mentee"
            logger.info(msg)
            return create_response(status=422, message=msg)
    elif account_type == Account.PARTNER:
        existing_partner = PartnerProfile.objects(email=email).first()
        if existing_partner:
            msg = f"Email {email} is already registered as a partner"
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
            if "organization" in data:
                txt_name = data["organization"]
            else:
                txt_name = data["title"]
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


@main.route("/bug-report", methods=["POST"])
def submit_bug_report():
    """Endpoint to receive bug reports and send email notifications with attachments"""
    import os
    import base64
    from datetime import datetime
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import (
        Mail,
        Attachment,
        FileContent,
        FileName,
        FileType,
        Disposition,
    )
    from api.utils.request_utils import sendgrid_key, sender_email
    from api.utils.google_storage import upload_bug_report_attachment
    from api.models import BugReport, Users

    # Get JSON data with size limit check
    try:
        data = request.get_json()
    except Exception as e:
        logger.error(f"Failed to parse request JSON: {e}")
        return create_response(status=400, message="Invalid request data")

    # Extract data from request
    description = data.get("description", "")
    user_name = data.get("user_name", "Not provided")
    user_email = data.get("user_email", "Not provided")
    role = data.get("role", "unknown")
    context = data.get("context", "app")
    page_url = data.get("page_url", "Not provided")
    file_attachments = data.get("attachments", [])

    # Limit number of attachments
    if len(file_attachments) > 3:
        return create_response(
            status=400, message="Too many attachments. Maximum 3 files allowed."
        )

    # Validate required fields
    if not description:
        return create_response(status=400, message="Description is required")

    # Try to find user_id if user is logged in (by email)
    user_id = None
    try:
        if user_email and user_email != "Not provided":
            user_obj = Users.objects(email=user_email).first()
            if user_obj:
                user_id = user_obj.id
    except Exception as e:
        logger.warning(f"Could not find user by email {user_email}: {e}")

    # Upload attachments to Google Cloud Storage
    uploaded_attachments = []
    for file_data in file_attachments:
        try:
            file_name = file_data.get("name", "attachment")
            file_content_base64 = file_data.get("content", "")
            file_type = file_data.get("type", "application/octet-stream")

            if file_content_base64:
                # Upload to GCS
                public_url, gcs_filename = upload_bug_report_attachment(
                    file_content_base64, file_name, file_type
                )

                uploaded_attachments.append(
                    {
                        "original_name": file_name,
                        "gcs_filename": gcs_filename,
                        "url": public_url,
                        "content_type": file_type,
                    }
                )
                logger.info(f"Uploaded attachment to GCS: {file_name}")
        except Exception as e:
            logger.error(
                f"Failed to upload attachment {file_data.get('name', 'unknown')}: {e}"
            )
            # Continue with other attachments

    # Create BugReport document
    try:
        bug_report = BugReport(
            description=description,
            user_name=user_name,
            user_email=user_email,
            user_id=user_id,
            role=role,
            context=context,
            page_url=page_url,
            attachments=uploaded_attachments,
            date_submitted=datetime.utcnow(),
            status="new",
            email_sent=False,
        )
        bug_report.save()
        logger.info(f"Bug report saved to database: {bug_report.id}")
    except Exception as e:
        logger.error(f"Failed to save bug report to database: {e}")
        return create_response(status=500, message="Failed to save bug report")

    # Recipients list - currently just one, but structured for multiple in the future
    recipients = ["juan@menteeglobal.org", "letitia@menteeglobal.org"]

    # Build HTML email content with attachment links
    attachments_html = ""
    if uploaded_attachments:
        attachments_list = "<br>".join(
            [
                f"- <a href='{att['url']}'>{att['original_name']}</a>"
                for att in uploaded_attachments
            ]
        )
        attachments_html = f"""
        <p><strong>Attachments:</strong><br>{attachments_list}</p>
        """

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #d32f2f;">Bug Report #{str(bug_report.id)}</h2>
            <hr style="border: 1px solid #ddd;" />
            
            <p><strong>Description:</strong></p>
            <p style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #d32f2f;">
                {description.replace(chr(10), '<br>')}
            </p>
            
            <h3 style="color: #666;">User Information</h3>
            <p><strong>Name:</strong> {user_name}</p>
            <p><strong>Email:</strong> {user_email}</p>
            <p><strong>Role:</strong> {role}</p>
            <p><strong>User ID:</strong> {user_id if user_id else 'Not logged in'}</p>
            
            <h3 style="color: #666;">Context</h3>
            <p><strong>Context:</strong> {context}</p>
            <p><strong>Page URL:</strong> <a href="{page_url}">{page_url}</a></p>
            <p><strong>Date Submitted:</strong> {bug_report.date_submitted.strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
            
            {attachments_html}
            
            <hr style="border: 1px solid #ddd; margin-top: 20px;" />
            <p style="font-size: 12px; color: #999;">
                This bug report was submitted via the MENTEE platform.<br>
                Bug Report ID: {str(bug_report.id)}
            </p>
        </body>
    </html>
    """

    # Check if SendGrid is properly configured
    if not sendgrid_key:
        logger.warning("SENDGRID_API_KEY not found - using development mode")
        logger.info(
            f"Bug report #{bug_report.id} received from {user_name} ({user_email})"
        )
        logger.info(f"Would send to: {', '.join(recipients)}")
        if uploaded_attachments:
            logger.info(
                f"Attachments: {len(uploaded_attachments)} file(s) uploaded to GCS"
            )

        bug_report.email_sent = False
        bug_report.email_error = "Development mode - email not sent"
        bug_report.save()

        return create_response(
            status=200,
            message="Bug report submitted successfully (development mode)",
            data={"bug_report_id": str(bug_report.id)},
        )

    if not sender_email:
        logger.error("SENDER_EMAIL environment variable not set!")
        bug_report.email_sent = False
        bug_report.email_error = "SENDER_EMAIL not configured"
        bug_report.save()

        return create_response(
            status=500, message="Email configuration error: SENDER_EMAIL not set"
        )

    # Send emails with attachments
    success_count = 0
    failed_recipients = []
    email_error_msg = None

    for recipient in recipients:
        try:
            message = Mail(
                from_email=sender_email,
                to_emails=recipient,
                subject=f"Bug Report #{str(bug_report.id)} - MENTEE Platform",
                html_content=html_content,
            )

            # Add file attachments from the original data (for email convenience)
            for file_data in file_attachments:
                try:
                    file_name = file_data.get("name", "attachment")
                    file_content_base64 = file_data.get("content", "")
                    file_type = file_data.get("type", "application/octet-stream")

                    if file_content_base64:
                        attached_file = Attachment(
                            FileContent(file_content_base64),
                            FileName(file_name),
                            FileType(file_type),
                            Disposition("attachment"),
                        )
                        message.add_attachment(attached_file)
                except Exception as attach_error:
                    logger.warning(
                        f"Failed to attach file {file_data.get('name', 'unknown')} to email: {attach_error}"
                    )

            # Send email
            sg = SendGridAPIClient(sendgrid_key)
            response = sg.send(message)

            success_count += 1
            logger.info(
                f"Bug report #{bug_report.id} email sent successfully to {recipient}"
            )

        except Exception as e:
            failed_recipients.append(recipient)
            error_msg = str(e)
            email_error_msg = error_msg
            logger.error(f"Failed to send bug report email to {recipient}: {error_msg}")

    # Update bug report with email status
    if success_count > 0:
        bug_report.email_sent = True
        if failed_recipients:
            bug_report.email_error = f"Partial failure: {', '.join(failed_recipients)}"
    else:
        bug_report.email_sent = False
        bug_report.email_error = email_error_msg or "Unknown error"

    bug_report.save()

    # Return appropriate response
    if success_count == 0:
        return create_response(
            status=500,
            message=f"Bug report saved but failed to send emails: {', '.join(failed_recipients)}",
            data={"bug_report_id": str(bug_report.id)},
        )
    elif failed_recipients:
        return create_response(
            status=207,  # Multi-Status
            message=f"Bug report sent to {success_count} recipient(s), but failed for: {', '.join(failed_recipients)}",
            data={"bug_report_id": str(bug_report.id)},
        )

    return create_response(
        status=200,
        message="Bug report submitted successfully",
        data={"bug_report_id": str(bug_report.id)},
    )
