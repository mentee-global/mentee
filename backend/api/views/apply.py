from os import name
from bson import is_valid
from flask import Blueprint, request
from sqlalchemy import null
from api.models import (
    Admin,
    NewMentorApplication,
    VerifiedEmail,
    Users,
    MenteeApplication,
    PartnerApplication,
    MenteeProfile,
    MentorProfile,
    PartnerProfile,
    MentorApplication,
)
from api.core import create_response, logger
from api.utils.require_auth import admin_only
from api.utils.constants import (
    MENTOR_APP_SUBMITTED,
    MENTEE_APP_SUBMITTED,
    MENTOR_APP_REJECTED,
    NEW_APPLICATION_STATUS,
    APP_APROVED,
    TRAINING_COMPLETED,
    PROFILE_COMPLETED,
    TRANSLATIONS,
    ALERT_TO_ADMINS,
)
from api.utils.request_utils import (
    send_email,
    is_invalid_form,
    MentorApplicationForm,
    MenteeApplicationForm,
    PartnerApplicationForm,
    get_profile_model,
)
from api.utils.constants import Account
from firebase_admin import auth as firebase_admin_auth
import urllib

apply = Blueprint("apply", __name__)

# GET request for all mentor applications


@apply.route("/", methods=["GET"])
@admin_only
def get_applications():
    new_application = NewMentorApplication.objects
    old_application = MentorApplication.objects

    application = [y for x in [new_application, old_application] for y in x]
    return create_response(data={"mentor_applications": application})


@apply.route("/menteeApps", methods=["GET"])
@admin_only
def get_mentee_applications():
    application = MenteeApplication.objects
    return create_response(data={"mentor_applications": application})


# GET request for mentor applications for by id
@apply.route("/<id>", methods=["GET"])
@admin_only
def get_application_by_id(id):
    try:
        application = NewMentorApplication.objects.get(id=id)
    except:
        try:
            application = MentorApplication.objects.get(id=id)
            return create_response(
                data={"mentor_application": application, "type": "old"}
            )
        except:
            msg = "No application currently exist with this id " + id
            logger.info(msg)
            return create_response(status=200, message=msg)

    return create_response(data={"mentor_application": application, "type": "new"})


# GET request for mentee applications for by id
@apply.route("/mentee/<id>", methods=["GET"])
@admin_only
def get_application_mentee_by_id(id):
    try:
        application = MenteeApplication.objects.get(id=id)
        if application is not None and application.partner is not None:
            partner_data = PartnerProfile.objects.get(id=application.partner)
            if partner_data is not None:
                application.organization = partner_data.organization
    except:
        msg = "No application currently exist with this id " + id
        logger.info(msg)
        return create_response(status=200, message=msg)

    return create_response(data={"mentor_application": application})


@apply.route("/email/status/<email>/<role>", methods=["GET"])
def get_email_status_by_role(email, role):
    role = int(role)
    email = email.lower()
    response_data = {
        "inFirebase": False,
        "isVerified": False,
        "profileExists": False,
    }

    try:
        VerifiedEmail.objects.get(email=email, role=str(role))
        response_data["isVerified"] = True
    except Exception as e:
        logger.error(e)
        logger.info(f"{email} is not verified in VerifiedEmail Model")

    try:
        user = firebase_admin_auth.get_user_by_email(email.replace(" ", ""))
        response_data["inFirebase"] = True
    except Exception as e:
        logger.error(e)
        logger.warning(f"{email} is not verified in Firebase")
        msg = "No firebase user currently exist with this email " + email
        return create_response(message=msg, data=response_data)

    try:
        get_profile_model(role).objects.only("email").get(email=email)
        response_data["profileExists"] = True
    except Exception as e:
        logger.error(e)
        msg = "No profile currently exist with this email " + email
        logger.info(msg)
        return create_response(
            message=msg,
            data=response_data,
        )

    return create_response(data=response_data)


############################################################################################


@apply.route("/status/<email>/<role>", methods=["GET"])
def get_application_status(email, role):
    role = int(role)
    application = None
    try:
        if role == Account.MENTOR:
            try:
                application = NewMentorApplication.objects.get(email=email)
            except:
                application = MentorApplication.objects.get(email=email)
        if role == Account.MENTEE:
            application = MenteeApplication.objects.get(email=email)
        if role == Account.PARTNER:
            application = PartnerApplication.objects.get(email=email)
        if application is None:
            return create_response(
                message="No application currently exist with this email " + email,
                data={
                    "state": None,
                    "type": role == Account.MENTOR,
                    "role": role,
                    "role2": Account.MENTOR,
                },
            )
    except:
        msg = "No application currently exist with this email " + email
        logger.info(msg)
        return create_response(message=msg, data={"state": None})

    return create_response(
        data={"state": application.application_state, "application_data": application}
    )


@apply.route("/profile/exists/<email>/<role>", methods=["GET"])
def check_profile_exists(email, role):
    role = int(role)
    profile_exists = False
    try:
        # test if the email is in mongodb
        get_profile_model(role).objects.only("email").get(email=email)
        profile_exists = True
    except:
        # Get the correct role for the email
        msg = "Email contains a different role: " + email
        try:
            MentorProfile.objects.get(email=email)
            rightRole = Account.MENTOR
            return create_response(
                message=msg,
                data={"profileExists": profile_exists, "rightRole": rightRole.value},
            )
        except:
            try:
                MenteeProfile.objects.get(email=email)
                rightRole = Account.MENTEE
                return create_response(
                    message=msg,
                    data={
                        "profileExists": profile_exists,
                        "rightRole": rightRole.value,
                    },
                )
            except:
                try:
                    PartnerProfile.objects.get(email=email)
                    rightRole = Account.PARTNER
                    return create_response(
                        message=msg,
                        data={
                            "profileExists": profile_exists,
                            "rightRole": rightRole.value,
                        },
                    )
                except:
                    msg = "No application currently exist with this email " + email
                    logger.info(msg)
                    return create_response(
                        message=msg,
                        data={
                            "profileExists": profile_exists,
                        },
                    )

    return create_response(data={"profileExists": profile_exists})


@apply.route("/changeStateTraining", methods=["POST"])
def change_state_traing_status():
    data = request.get_json()
    role = data.get("role")
    role = int(role)
    id = data.get("id")
    traing_status = data.get("traing_status")

    if role == Account.MENTOR:
        try:
            application = NewMentorApplication.objects.get(id=id)
        except:
            application = MentorApplication.objects.get(id=id)
    if role == Account.MENTEE:
        application = MenteeApplication.objects.get(id=id)
        if application.language is not None:
            if isinstance(application.language, str):
                application.language = [application.language]
    if role == Account.PARTNER:
        application = PartnerApplication.objects.get(id=id)
    application["traingStatus"] = traing_status
    application.save()
    return create_response(data={"state": "ok"})


@apply.route("/changeStateBuildProfile/<email>/<role>", methods=["GET"])
def change_state_to_build_profile(email, role):
    admin_data = Admin.objects()

    application = null
    role = int(role)

    try:
        if role == Account.MENTOR:
            try:
                application = NewMentorApplication.objects.get(email=email)
            except:
                application = MentorApplication.objects.get(email=email)
        if role == Account.MENTEE:
            application = MenteeApplication.objects.get(email=email)
        if role == Account.PARTNER:
            application = PartnerApplication.objects.get(email=email)
    except:
        msg = "No application currently exist with this email " + email
        logger.info(msg)
        return create_response(data={"state": "", "message": msg})
    if application["application_state"] == NEW_APPLICATION_STATUS["APPROVED"]:
        application["application_state"] = NEW_APPLICATION_STATUS["BUILDPROFILE"]
        application.save()
        target_url = ""
        if "front_url" in request.args:
            front_url = request.args["front_url"]
            target_url = (
                front_url
                + "build-profile?role="
                + str(role)
                + "&email="
                + urllib.parse.quote(application["email"])
            )

        preferred_language = request.args.get("preferred_language", "en-US")
        success, msg = send_email(
            recipient=application["email"],
            data={
                "link": target_url,
                preferred_language: True,
                "subject": TRANSLATIONS[preferred_language]["training_complete"],
            },
            template_id=TRAINING_COMPLETED,
        )
        for admin in admin_data:
            txt_role = "Mentor"
            txt_name = application.name
            if role == Account.MENTEE:
                txt_role = "Mentee"
            if role == Account.PARTNER:
                txt_role = "Partner"
                txt_name = application.organization
            success, msg = send_email(
                recipient=admin.email,
                template_id=ALERT_TO_ADMINS,
                data={
                    "name": txt_name,
                    "email": application.email,
                    "role": txt_role,
                    "action": "completed training",
                    preferred_language: True,
                },
            )
        if not success:
            logger.info(msg)

        return create_response(data={"state": application.application_state})
    else:
        return create_response(data={"state": application.application_state})


@apply.route("/<id>/<role>", methods=["DELETE"])
@admin_only
def delete_application(id, role):
    role = int(role)
    if role == Account.MENTOR:
        try:
            try:
                application = NewMentorApplication.objects.get(id=id)
            except:
                application = MentorApplication.objects.get(id=id)
        except:
            msg = "The application you attempted to delete was not found"
            logger.info(msg)
            return create_response(status=422, message=msg)
    elif role == Account.MENTEE:
        try:
            application = MenteeApplication.objects.get(id=id)
        except:
            msg = "The application you attempted to delete was not found"
            logger.info(msg)
            return create_response(status=422, message=msg)

    application.delete()
    return create_response(status=200, message=f"Success")


# PUT requests for /application by object ID
@apply.route("/<id>/<role>", methods=["PUT"])
@admin_only
def edit_application(id, role):
    admin_data = Admin.objects()

    data = request.get_json()
    preferred_language = data.get("preferred_language", "en-US")
    role = int(role)
    logger.info(data)
    # Try to retrieve Mentor application from database
    if role == Account.MENTOR:
        try:
            try:
                application = NewMentorApplication.objects.get(id=id)
            except:
                application = MentorApplication.objects.get(id=id)
        except:
            msg = "No application with that object id"
            logger.info(msg)
            return create_response(status=422, message=msg)
    if role == Account.MENTEE:
        try:
            application = MenteeApplication.objects.get(id=id)
        except:
            msg = "No application with that object id"
            logger.info(msg)
            return create_response(status=422, message=msg)

    application.application_state = data.get(
        "application_state", application.application_state
    )
    application.notes = data.get("notes", application.notes)
    application.save()

    # Send a notification email
    if application.application_state == NEW_APPLICATION_STATUS["PENDING"]:
        if role == Account.MENTOR:
            mentor_email = application.email
            success, msg = send_email(
                recipient=mentor_email,
                template_id=MENTOR_APP_SUBMITTED,
                data={
                    preferred_language: True,
                    "subject": TRANSLATIONS[preferred_language]["app_approved"],
                },
            )
        if role == Account.MENTEE:
            mentor_email = application.email
            success, msg = send_email(
                recipient=mentor_email,
                template_id=MENTEE_APP_SUBMITTED,
                data={
                    preferred_language: True,
                    "subject": TRANSLATIONS[preferred_language]["app_approved"],
                },
            )

        if not success:
            logger.info(msg)
    if application.application_state == NEW_APPLICATION_STATUS["APPROVED"]:
        front_url = data.get("front_url", "")
        target_url = (
            front_url
            + "application-training?role="
            + str(role)
            + "&email="
            + urllib.parse.quote(application.email)
        )
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            data={
                "link": target_url,
                preferred_language: True,
                "subject": TRANSLATIONS[preferred_language]["app_approved"],
            },
            template_id=APP_APROVED,
        )
        if not success:
            logger.info(msg)

        # Add to verified emails

    # send out rejection emails when put in rejected column
    if application.application_state == NEW_APPLICATION_STATUS["REJECTED"]:
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            template_id=MENTOR_APP_REJECTED,
            data={
                preferred_language: True,
                "subject": TRANSLATIONS[preferred_language]["app_rejected"],
            },
        )
    if application.application_state == NEW_APPLICATION_STATUS["COMPLETED"]:
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            template_id=PROFILE_COMPLETED,
            data={
                preferred_language: True,
                "subject": TRANSLATIONS[preferred_language]["profile_completed"],
            },
        )
        for admin in admin_data:
            txt_role = "Mentor"
            if role == Account.MENTEE:
                txt_role = "Mentee"
            success, msg = send_email(
                recipient=admin.email,
                template_id=ALERT_TO_ADMINS,
                data={
                    "name": application.name,
                    "email": application.email,
                    "role": txt_role,
                    "action": "completed profile",
                    preferred_language: True,
                },
            )
        if not success:
            logger.info(msg)
    if application.application_state == NEW_APPLICATION_STATUS["BUILDPROFILE"]:
        front_url = data.get("front_url", "")
        target_url = (
            front_url
            + "build-profile?role="
            + str(role)
            + "&email="
            + urllib.parse.quote(application.email)
        )
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            data={
                "link": target_url,
                preferred_language: True,
                "subject": TRANSLATIONS[preferred_language]["training_complete"],
            },
            template_id=TRAINING_COMPLETED,
        )
        for admin in admin_data:
            txt_role = "Mentor"
            if role == Account.MENTEE:
                txt_role = "Mentee"
            success, msg = send_email(
                recipient=admin.email,
                template_id=ALERT_TO_ADMINS,
                data={
                    "name": application.name,
                    "email": application.email,
                    "role": txt_role,
                    "action": "completed training",
                    preferred_language: True,
                },
            )
        if not success:
            logger.info(msg)

    return create_response(status=200, message=f"Success")


# POST request for Mentee Appointment
@apply.route("/new", methods=["POST"])
def create_application():
    admin_data = Admin.objects()

    data = request.get_json()
    preferred_language = data.get("preferred_language", "en-US")
    print("preferred_language!!!!", preferred_language)
    role = data.get("role")

    if role == Account.MENTOR:
        validate_data = MentorApplicationForm.from_json(data)
    if role == Account.MENTEE:
        validate_data = MenteeApplicationForm.from_json(data)
    if role == Account.PARTNER:
        validate_data = PartnerApplicationForm.from_json(data)
    msg, is_invalid = is_invalid_form(validate_data)
    if is_invalid:
        return create_response(status=422, message=msg)
    if role == Account.MENTOR:
        applications = NewMentorApplication.objects(email=data.get("email"))
        if len(applications) > 0 and applications is not None:
            return create_response(
                status=422, message="This user is already registered"
            )
        else:
            new_application = NewMentorApplication(
                name=data.get("name"),
                email=data.get("email"),
                cell_number=data.get("cell_number"),
                hear_about_us=data.get("hear_about_us"),
                employer_name=data.get("employer_name"),
                role_description=data.get("role_description"),
                immigrant_status=data.get("immigrant_status"),
                languages=data.get("languages"),
                referral=data.get("referral"),
                knowledge_location=data.get("knowledge_location"),
                isColorPerson=data.get("isColorPerson"),
                isMarginalized=data.get("isMarginalized"),
                isFamilyNative=data.get("isFamilyNative"),
                isEconomically=data.get("isEconomically"),
                identify=data.get("identify"),
                pastLiveLocation=data.get("pastLiveLocation"),
                date_submitted=data.get("date_submitted"),
                companyTime=data.get("companyTime"),
                specialistTime=data.get("specialistTime"),
                application_state="PENDING",
                specializations=data.get("specializations"),
            )

    if role == Account.MENTEE:
        applications = MenteeApplication.objects(email=data.get("email"))
        if len(applications) > 0 and applications is not None:
            return create_response(
                status=422, message="This user is already registered"
            )
        else:
            partner = data.get("partner")
            if partner == 0:
                partner = None
            new_application = MenteeApplication(
                email=data.get("email"),
                name=data.get("name"),
                age=data.get("age"),
                immigrant_status=data.get("immigrant_status"),
                Country=data.get("country", ""),
                identify=data.get("identify"),
                language=data.get("language"),
                topics=data.get("topics"),
                workstate=data.get("workstate"),
                isSocial=data.get("isSocial"),
                questions=data.get("questions", ""),
                partner=partner,
                application_state="PENDING",
                date_submitted=data.get("date_submitted"),
            )
    new_application.save()

    mentor_email = new_application.email
    if role == Account.MENTOR:
        success, msg = send_email(
            recipient=mentor_email,
            data={
                preferred_language: True,
                "subject": TRANSLATIONS[preferred_language]["mentor_app_submit"],
            },
            template_id=MENTOR_APP_SUBMITTED,
        )
    if role == Account.MENTEE:
        success, msg = send_email(
            recipient=mentor_email,
            data={
                preferred_language: True,
                "subject": TRANSLATIONS[preferred_language]["mentee_app_submit"],
            },
            template_id=MENTEE_APP_SUBMITTED,
        )
    admin_data = Admin.objects()
    for admin in admin_data:
        txt_role = "Mentor"
        txt_name = new_application.name
        if role == Account.MENTEE:
            txt_role = "Mentee"
        if role == Account.PARTNER:
            txt_role = "Partner"
            txt_name = new_application.organization
        success, msg = send_email(
            recipient=admin.email,
            template_id=ALERT_TO_ADMINS,
            data={
                "name": txt_name,
                "email": new_application.email,
                "role": txt_role,
                "action": "applied",
                preferred_language: True,
            },
        )
    if not success:
        logger.info(msg)

    return create_response(
        status=200,
        message=f"Successfully created application with name {new_application.email}",
    )
