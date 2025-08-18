from flask import Blueprint, request
from firebase_admin import auth as firebase_admin_auth
from api.utils.require_auth import verify_token_with_expiry
from firebase_admin.exceptions import FirebaseError
from api.models import db, Users, MentorProfile, Admin, PartnerProfile, Hub
from api.core import create_response, logger
from api.utils.constants import (
    USER_VERIFICATION_TEMPLATE,
    USER_FORGOT_PASSWORD_TEMPLATE,
    Account,
    TRANSLATIONS,
)
from api.utils.request_utils import send_email, get_profile_model
from api.utils.firebase import client as firebase_client
from api.utils.input_validation import (
    validate_email_format,
    validate_password,
    validate_role,
    validate_json_data,
    sanitize_text,
)
from api.utils.web_security import auth_rate_limit, CSRFProtection, api_rate_limit

auth = Blueprint("auth", __name__)  # initialize blueprint


@auth.route("/verifyEmail", methods=["POST"])
@auth_rate_limit
@CSRFProtection.csrf_protect
def verify_email():
    data = request.json

    valid, error_msg = validate_json_data(data, ["email"])
    if not valid:
        return create_response(status=422, message=error_msg)

    email = sanitize_text(data.get("email"))
    preferred_language = sanitize_text(data.get("preferred_language", "en-US"))

    valid, error_msg = validate_email_format(email)
    if not valid:
        return create_response(status=422, message=error_msg)

    if preferred_language not in TRANSLATIONS:
        preferred_language = "en-US"
    verification_link = None

    try:
        # TODO: Add ActionCodeSetting for custom link/redirection back to main page
        verification_link = firebase_admin_auth.generate_email_verification_link(email)
    except ValueError:
        msg = "Invalid email"
        logger.info(msg)
        return create_response(status=422, message=msg)
    except FirebaseError as e:
        msg = e.message
        logger.info(msg)
        return create_response(status=422, message=msg)

    if not send_email(
        recipient=email,
        data={
            "link": verification_link,
            preferred_language: True,
            "subject": TRANSLATIONS[preferred_language]["verify_email"],
        },
        template_id=USER_VERIFICATION_TEMPLATE,
    ):
        msg = "Could not send email"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(message="Sent verification link to email")


def create_firebase_user(email, password):
    firebase_user = None
    error_http_response = None

    try:
        firebase_user = firebase_admin_auth.create_user(
            email=email,
            email_verified=False,
            password=password,
        )
    except ValueError:
        msg = "Invalid input"
        logger.info(msg)
        error_http_response = create_response(status=422, message=msg)
    except FirebaseError:
        msg = "Could not create account"
        logger.info(msg)
        error_http_response = create_response(status=500, message=msg)

    return firebase_user, error_http_response


@auth.route("/register", methods=["POST"])
@auth_rate_limit
@CSRFProtection.csrf_protect
def register():
    data = request.json

    valid, error_msg = validate_json_data(data, ["email", "password", "role"])
    if not valid:
        return create_response(status=422, message=error_msg)

    email = sanitize_text(data.get("email"))
    password = data.get("password")
    role = data.get("role")

    valid, error_msg = validate_email_format(email)
    if not valid:
        return create_response(status=422, message=error_msg)

    valid, error_msg = validate_password(password)
    if not valid:
        return create_response(status=422, message=error_msg)

    valid, error_msg = validate_role(role)
    if not valid:
        return create_response(status=422, message=error_msg)

    admin_user = None

    # if whitelisted, set to admin
    if Admin.objects(email=email):
        admin_user = Admin.objects.get(email=email)
    elif role == Account.ADMIN:
        msg = "Email is not whitelisted as Admin"
        logger.info(msg)
        return create_response(status=422, message=msg)

    firebase_user, error_http_response = create_firebase_user(email, password)

    if error_http_response:
        return error_http_response

    # account created
    firebase_uid = firebase_user.uid

    if admin_user:
        admin_user.firebase_uid = firebase_uid
        admin_user.save()

    return create_response(
        message="Created account",
        data={
            "token": firebase_admin_auth.create_custom_token(
                firebase_uid, {"role": role}
            ).decode("utf-8"),
        },
    )


@auth.route("/newRegister", methods=["POST"])
@api_rate_limit
@CSRFProtection.csrf_protect
def newregister():
    data = request.json

    valid, error_msg = validate_json_data(data, ["name", "email", "password", "role"])
    if not valid:
        return create_response(status=422, message=error_msg)

    name = sanitize_text(data.get("name"))
    email = sanitize_text(data.get("email"))
    password = data.get("password")
    role = data.get("role")
    video_url = sanitize_text(data.get("video_url", ""))
    phone_number = sanitize_text(data.get("phone_number", ""))
    date_submitted = data.get("date_submitted")

    valid, error_msg = validate_email_format(email)
    if not valid:
        return create_response(status=422, message=error_msg)

    valid, error_msg = validate_password(password)
    if not valid:
        return create_response(status=422, message=error_msg)

    valid, error_msg = validate_role(role)
    if not valid:
        return create_response(status=422, message=error_msg)

    firebase_user, error_http_response = create_firebase_user(email, password)
    # if error_http_response:
    #    return error_http_response

    # account created
    firebase_uid = firebase_user.uid
    profile = PartnerProfile(
        name=name,
        email=email,
        password=password,
        video_url=video_url,
        role=role,
        phone_number=phone_number,
        date_submitted=date_submitted,
    )
    profile.save()
    user = Users(
        firebase_uid=firebase_uid,
        email=email,
        role=role,
        verified=False,
    )
    user.save()
    return create_response(
        message="Created account",
        data={
            "token": firebase_admin_auth.create_custom_token(
                firebase_uid, {"role": role}
            ).decode("utf-8"),
        },
    )


@auth.route("/login", methods=["POST"])
@auth_rate_limit
@CSRFProtection.csrf_protect
def login():
    data = request.json

    valid, error_msg = validate_json_data(data, ["email", "password", "role"])
    if not valid:
        return create_response(status=422, message=error_msg)

    email = sanitize_text(data.get("email"))
    password = data.get("password")
    role = int(data.get("role"))
    path = sanitize_text(data.get("path", ""))

    valid, error_msg = validate_email_format(email)
    if not valid:
        return create_response(status=422, message=error_msg)

    valid, error_msg = validate_role(role)
    if not valid:
        return create_response(status=422, message=error_msg)

    firebase_user = None
    profile_model = get_profile_model(role)
    if role == Account.HUB:
        if not profile_model.objects(email=email):
            profile_model = get_profile_model(Account.PARTNER)

    profile = profile_model.objects.get(email=email)

    try:
        firebase_user = firebase_client.auth().sign_in_with_email_and_password(
            email, password
        )
        if "expiresIn" in firebase_user:
            try:
                firebase_user["expiresIn"] = float(firebase_user["expiresIn"])
            except (ValueError, TypeError):
                firebase_user["expiresIn"] = 3600
        firebase_uid = firebase_user["localId"]

    except Exception as e:
        try:
            user = firebase_admin_auth.get_user_by_email(email)
            msg = "Could not login"
            logger.info(msg)
            return create_response(status=422, message=msg)

        except:
            if Users.objects(email=email) or profile:
                # old account, need to create a firebase account
                # no password -> no sign-in methods -> forced to reset password
                firebase_user, error_http_response = create_firebase_user(email, None)

            # user.delete()
            # send password reset email
            error = send_forgot_password_email(email)

            msg = "Created new Firebase account for existing user"
            logger.info(msg)
            return create_response(
                message="couldn't create firebase account ", status=422
            )

    firebase_admin_user = firebase_admin_auth.get_user(firebase_uid)
    profile_id = None
    if not Users.objects(email=email):
        user = Users(
            firebase_uid=firebase_uid,
            email=email,
            role="{}".format(role),
            verified=firebase_admin_user.email_verified,
        )
        user.save()

    try:
        if profile is None:
            msg = "Couldn't find profile with these credentials"
            logger.info(msg)
            return create_response(status=422, message=msg)
        else:
            if role == Account.PARTNER:
                if profile.hub_id is not None:
                    msg = "Couldn't find profile with these credentials"
                    logger.info(msg)
                    return create_response(status=422, message=msg)
        if role == Account.HUB and path is not None:
            if "hub_id" in profile and profile.hub_id is not None:
                hub_profile = Hub.objects.get(id=profile.hub_id)
                if hub_profile is None or "/" + hub_profile.url != path:
                    msg = "Couldn't find proper hub profile with these credentials"
                    logger.info(msg)
                    return create_response(status=422, message=msg)
            else:
                if "/" + profile.url != path:
                    msg = "Couldn't find proper hub profile with these credentials"
                    logger.info(msg)
                    return create_response(status=422, message=msg)
        logger.info("Profile found")
        profile_id = str(profile.id)

        if not profile.firebase_uid or profile.firebase_uid != firebase_uid:
            profile.firebase_uid = firebase_uid
            profile.save()
    except:
        if (
            role != Account.ADMIN
            and role != Account.GUEST
            and role != Account.SUPPORT
            and role != Account.MODERATOR
            and role != Account.HUB
        ):
            # user failed to create profile during registration phase
            # prompt frontend to return user to appropriate phase

            return create_response(
                message="Logged in",
                data={
                    "redirectToVerify": not firebase_admin_user.email_verified,
                    "redirectToCreateProfile": True,
                    "token": firebase_admin_auth.create_custom_token(
                        firebase_uid, {"role": role}
                    ).decode("utf-8"),
                    "profileId": profile_id,
                    "role": role,
                    "firebase_user": firebase_user,
                },
            )
            # pass

        msg = "Couldn't find profile with these credentials"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(
        message="Logged in",
        data={
            "redirectToVerify": not firebase_admin_user.email_verified,
            "token": firebase_admin_auth.create_custom_token(
                firebase_uid, {"role": role, "profileId": profile_id}
            ).decode("utf-8"),
            "profileId": profile_id,
            "role": role,
        },
    )


def send_forgot_password_email(email, preferred_language="en-US"):
    reset_link = None

    if preferred_language not in TRANSLATIONS:
        preferred_language = "en-US"

    try:
        # TODO: Add ActionCodeSetting for custom link/redirection back to main page
        reset_link = firebase_admin_auth.generate_password_reset_link(email)
    except ValueError:
        msg = "Invalid email"
        logger.info(msg)
        return create_response(status=422, message=msg)
    except FirebaseError as e:
        msg = e.message
        logger.info(msg)
        return create_response(status=422, message=msg)

    if not send_email(
        recipient=email,
        subject="Mentee Password Reset",
        data={
            "link": reset_link,
            preferred_language: True,
            "subject": TRANSLATIONS[preferred_language]["forgot_password"],
        },
        template_id=USER_FORGOT_PASSWORD_TEMPLATE,
    ):
        msg = "Cannot send email"
        logger.info(msg)
        return create_response(status=500, message=msg)


@auth.route("/forgotPassword", methods=["POST"])
@auth_rate_limit
@CSRFProtection.csrf_protect
def forgot_password():
    data = request.json

    valid, error_msg = validate_json_data(data, ["email"])
    if not valid:
        return create_response(status=422, message=error_msg)

    email = sanitize_text(data.get("email"))
    preferred_language = sanitize_text(data.get("preferred_language", "en-US"))

    valid, error_msg = validate_email_format(email)
    if not valid:
        return create_response(status=422, message=error_msg)

    error = send_forgot_password_email(email, preferred_language)

    return (
        error and error or create_response(message="Sent password reset link to email")
    )


@auth.route("/refreshToken", methods=["POST"])
@api_rate_limit
@CSRFProtection.csrf_protect
def refresh_token():
    data = request.json
    token = data.get("token")

    claims = verify_token_with_expiry(token)
    firebase_uid = claims.get("uid")
    role = int(claims.get("role"))

    profile_model = get_profile_model(role)
    profile_id = None
    try:
        profile = profile_model.objects.get(firebase_uid=firebase_uid)
        profile_id = str(profile.id)
    except:
        msg = "Could not find profile"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(
        status=200,
        data={
            "token": firebase_admin_auth.create_custom_token(
                firebase_uid, {"role": role, "profileId": profile_id}
            ).decode("utf-8"),
        },
    )
