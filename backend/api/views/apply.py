from flask import Blueprint, request
from sqlalchemy import null
from api.models import (
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
)
from api.utils.request_utils import (
    send_email,
    is_invalid_form,
    MentorApplicationForm,
    MenteeApplicationForm,
    PartnerApplicationForm,
)
from api.utils.constants import Account
from firebase_admin import auth as firebase_admin_auth

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
    except:
        msg = "No application currently exist with this id " + id
        logger.info(msg)
        return create_response(status=200, message=msg)

    return create_response(data={"mentor_application": application})


####################################################################################
@apply.route("/checkHaveAccount/<email>/<role>", methods=["GET"])
def get_is_has_Account(email, role):
    role = int(role)
    application = null
    isVerified = null
    try:
        email2 = VerifiedEmail.objects.get(email=email, role=str(role))
        isVerified = True
    except:
        isVerified = False
    try:
        user = firebase_admin_auth.get_user_by_email(email.replace(" ", ""))
    except:
        return create_response(data={"isHave": False, "isVerified": isVerified})

    try:
        if role == Account.MENTOR:
            application = MentorProfile.objects.get(email=email)
        if role == Account.MENTEE:
            application = MenteeProfile.objects.get(email=email)
        if role == Account.PARTNER:
            application = PartnerProfile.objects.get(email=email)

    except:
        msg = "No application currently exist with this email " + email
        logger.info(msg)
        return create_response(
            data={
                "isHaveProfile": False,
                "isHave": True,
                "message": msg,
                "isVerified": isVerified,
            }
        )

    return create_response(
        data={"isHave": True, "isHaveProfile": True, "isVerified": isVerified}
    )


############################################################################################


@apply.route("/checkConfirm/<email>/<role>", methods=["GET"])
def get_application_by_email(email, role):
    role = int(role)
    application = null
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
        if application is null:
            return create_response(
                data={
                    "state": "",
                    "message": "no application found",
                    "type": role == Account.MENTOR,
                    "role": role,
                    "role2": Account.MENTOR,
                }
            )
    except:
        msg = "No application currently exist with this email " + email
        logger.info(msg)
        return create_response(data={"state": "", "message": msg})

    return create_response(data={"state": application.application_state})


@apply.route("/isHaveProfile/<email>/<role>", methods=["GET"])
def isHaveprofile_existing_account(email, role):
    role = int(role)
    application = null

    try:
        if role == Account.MENTOR:
            application = MentorProfile.objects.get(email=email)
        if role == Account.MENTEE:
            application = MenteeProfile.objects.get(email=email)
        if role == Account.PARTNER:
            application = PartnerProfile.objects.get(email=email)

    except:
        try:
            application = MentorProfile.objects.get(email=email)
            rightRole = Account.MENTOR
            return create_response(
                data={"isHaveProfile": False, "rightRole": rightRole.value}
            )

        except:
            try:
                application = MenteeProfile.objects.get(email=email)
                rightRole = Account.MENTEE
                return create_response(
                    data={"isHaveProfile": False, "rightRole": rightRole.value}
                )

            except:
                try:
                    application = PartnerProfile.objects.get(email=email)
                    rightRole = Account.PARTNER
                    return create_response(
                        data={"isHaveProfile": False, "rightRole": rightRole.value}
                    )

                except:
                    msg = "No application currently exist with this email " + email
                    logger.info(msg)
                    return create_response(
                        data={"isHaveProfile": False, "message": msg}
                    )

    return create_response(data={"isHaveProfile": True})


@apply.route("/changeStateBuildProfile/<email>/<role>", methods=["GET"])
def changestatetobuildprofile(email, role):
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
                + "application-page?role="
                + str(role)
                + "&email="
                + application["email"]
            )
        
        preferred_language = request.args.get("preferred_language", "en-US")
        success, msg = send_email(
            recipient=application["email"],
            subject="Congratulations on completing the training",
            data={"link": target_url, preferred_language: True},
            template_id=TRAINING_COMPLETED,
        )
        if not success:
            logger.info(msg)

        return create_response(data={"state": application.application_state})
    else:
        return create_response(data={"state": application.application_state})


# DELETE request for mentor application by object ID
@apply.route("/<id>", methods=["DELETE"])
@admin_only
def delete_application(id):
    try:
        try:
            application = NewMentorApplication.objects.get(id=id)
        except:
            application = MentorApplication.objects.get(id=id)
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
                subject="MENTEE Application has been approved",
                template_id=MENTOR_APP_SUBMITTED,
                data={preferred_language: True}
            )
        if role == Account.MENTEE:
            mentor_email = application.email
            success, msg = send_email(
                recipient=mentor_email,
                subject="MENTEE Application has been approved",
                template_id=MENTEE_APP_SUBMITTED,
                data={preferred_language: True}
            )
        if not success:
            logger.info(msg)
    if application.application_state == NEW_APPLICATION_STATUS["APPROVED"]:
        front_url = data.get("front_url", "")
        target_url = (
            front_url
            + "application-page?role="
            + str(role)
            + "&email="
            + application.email
        )
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            subject="MENTEE Application has been approved",
            data={"link": target_url, preferred_language: True},
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
            subject="Thank you for your interest in Mentee, " + application.name,
            template_id=MENTOR_APP_REJECTED,
            data={preferred_language: True}
        )
    if application.application_state == NEW_APPLICATION_STATUS["COMPLETED"]:
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            subject="Your account has been successfully created " + application.name,
            template_id=PROFILE_COMPLETED,
            data={preferred_language: True}
        )
        if not success:
            logger.info(msg)
    if application.application_state == NEW_APPLICATION_STATUS["BUILDPROFILE"]:
        front_url = data.get("front_url", "")
        target_url = (
            front_url
            + "application-page?role="
            + str(role)
            + "&email="
            + application.email
        )
        mentor_email = application.email
        success, msg = send_email(
            recipient=mentor_email,
            subject="Congratulations for completing the training",
            data={"link": target_url, preferred_language: True},
            template_id=TRAINING_COMPLETED,
        )
        if not success:
            logger.info(msg)

    return create_response(status=200, message=f"Success")


# POST request for Mentee Appointment
@apply.route("/new", methods=["POST"])
def create_application():
    data = request.get_json()
    preferred_language = data.get("preferred_language", "en-US")
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
        if len(applications) > 0 is not None:
            return create_response(
                status=422, message="This user is already registered"
            )
        else:
            new_application = NewMentorApplication(
                name=data.get("name"),
                email=data.get("email"),
                cell_number=data.get("cell_number"),
                hear_about_us=data.get("hear_about_us"),
                offer_donation=data.get("offer_donation"),
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
            )

    if role == Account.MENTEE:
        applications = MenteeApplication.objects(email=data.get("email"))
        if len(applications) > 0 is not None:
            return create_response(
                status=422, message="This user is already registered"
            )
        else:
            new_application = MenteeApplication(
                email=data.get("email"),
                name=data.get("name"),
                age=data.get("age"),
                immigrant_status=data.get("immigrant_status"),
                Country=data.get("Country", ""),
                identify=data.get("identify"),
                language=data.get("language"),
                topics=data.get("topics"),
                workstate=data.get("workstate"),
                isSocial=data.get("isSocial"),
                questions=data.get("questions", ""),
                application_state="PENDING",
                date_submitted=data.get("date_submitted"),
            )
    new_application.save()

    mentor_email = new_application.email
    if role == Account.MENTOR:
        success, msg = send_email(
            recipient=mentor_email,
            subject="MENTEE Application Recieved!",
            template_id=MENTOR_APP_SUBMITTED,
        )
    if role == Account.MENTEE:
        success, msg = send_email(
            recipient=mentor_email,
            subject="MENTEE Application Recieved!",
            template_id=MENTEE_APP_SUBMITTED,
        )
    if not success:
        logger.info(msg)

    return create_response(
        message=f"Successfully created application with name {new_application.email}"
    )
