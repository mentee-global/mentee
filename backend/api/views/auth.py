from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_admin_auth
from firebase_admin.exceptions import FirebaseError
from api.models import db, Users, MentorProfile, Admin, MenteeProfile
from api.core import create_response, serialize_list, logger
from api.utils.constants import (
    AUTH_URL,
    USER_VERIFICATION_TEMPLATE,
    USER_FORGOT_PASSWORD_TEMPLATE,
    Account,
)
from api.utils.request_utils import send_email, get_profile_model
from api.utils.firebase import client as firebase_client
from api.utils.profile_parse import new_profile
import requests
import pyrebase
import os

auth = Blueprint("auth", __name__)  # initialize blueprint


@auth.route("/verifyEmail", methods=["POST"])
def verify_email():
    data = request.json
    email = data.get("email")
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
        subject="Mentee Email Verification",
        data={"link": verification_link},
        template_id=USER_VERIFICATION_TEMPLATE,
    ):
        msg = "Could not send email"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(message="Sent verification link to email")


def check_email_in_use(email, model_to_remove):
    profile_models = [
        get_profile_model(Account.MENTEE),
        get_profile_model(Account.MENTOR),
        get_profile_model(Account.ADMIN),
    ]
    profile_models.remove(model_to_remove)
    for profile_model in profile_models:
        profile = None
        try:
            profile = profile_model.objects.get(email=email)
        except:
            # Could not find email in current profile model
            continue

        if profile:
            logger.info("email found!")
            return True
    logger.info("email not found!")
    return False


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
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")
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


@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")
    firebase_user = None

    profile_model = get_profile_model(role)

    # Check if this email is already in use in another role
    if check_email_in_use(email, profile_model):
        msg = "This is an existing email already being in use"
        return create_response(status=422, message=msg, data={"existingEmail": True})

    try:
        firebase_user = firebase_client.auth().sign_in_with_email_and_password(
            email, password
        )
    except Exception as e:
        if Users.objects(email=email) or profile_model.objects(email=email):
            # user = Users.objects.get(email=email)

            # old account, need to create a firebase account
            # no password -> no sign-in methods -> forced to reset password
            firebase_user, error_http_response = create_firebase_user(email, None)

            if error_http_response:
                return error_http_response

            # user.delete()

            # send password reset email
            error = send_forgot_password_email(email)

            msg = "Created new Firebase account for existing user"
            logger.info(msg)
            return (
                error
                and error
                or create_response(
                    status=201, message=msg, data={"passwordReset": True}
                )
            )
        else:
            msg = "Could not login"
            logger.info(msg)
            return create_response(status=422, message=msg)

    firebase_uid = firebase_user["localId"]
    firebase_admin_user = firebase_admin_auth.get_user(firebase_uid)
    profile_id = None

    try:
        profile = profile_model.objects.get(email=email)
        profile_id = str(profile.id)

        if not profile.firebase_uid or profile.firebase_uid != firebase_uid:
            profile.firebase_uid = firebase_uid
            profile.save()
    except:
        if role != Account.ADMIN:
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
                },
            )
            # pass

        msg = "Couldn't find profile with these credentials"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(
        message="Logged in",
        data={
            "token": firebase_admin_auth.create_custom_token(
                firebase_uid, {"role": role, "profileId": profile_id}
            ).decode("utf-8"),
        },
    )


def send_forgot_password_email(email):
    reset_link = None

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
        data={"link": reset_link},
        template_id=USER_FORGOT_PASSWORD_TEMPLATE,
    ):
        msg = "Cannot send email"
        logger.info(msg)
        return create_response(status=500, message=msg)


@auth.route("/forgotPassword", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email", "")

    error = send_forgot_password_email(email)

    return (
        error and error or create_response(message="Sent password reset link to email")
    )


@auth.route("/refreshToken", methods=["POST"])
def refresh_token():
    data = request.json
    token = data.get("token")

    claims = firebase_admin_auth.verify_id_token(token)
    firebase_uid = claims.get("uid")
    role = claims.get("role")

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
