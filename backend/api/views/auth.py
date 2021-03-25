from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_admin_auth
from firebase_admin.exceptions import FirebaseError
from api.models import db, Users, MentorProfile, Admin
from api.core import create_response, serialize_list, logger
from api.utils.constants import (
    AUTH_URL,
    USER_VERIFICATION_TEMPLATE,
    USER_FORGOT_PASSWORD_TEMPLATE,
    MENTOR_ROLE,
    MENTEE_ROLE,
    ADMIN_ROLE,
    Account
)
from api.utils.request_utils import send_email
from api.utils.firebase import client as firebase_client
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
        verification_link = firebase_admin_auth.generate_email_verification_link(
            email)
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


def create_firebase_user(email, password, role):
    firebase_user = None
    error_http_response = None

    try:
        firebase_user = firebase_admin_auth.create_user(
            email=email,
            email_verified=False,
            password=password,
        )

        firebase_admin_auth.set_custom_user_claims(
            firebase_user.uid, {"role": role})
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

    # if whitelisted, set to admin
    if Admin.objects(email=email):
        role = Account.ADMIN.value
    elif role == Account.ADMIN:
        msg = 'Blocked attempt to create admin account'
        logger.info(msg)
        return create_response(status=422, message=msg)

    firebase_user, error_http_response = create_firebase_user(
        email, password, role)

    if error_http_response:
        return error_http_response

    firebase_uid = firebase_user.uid

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
    firebase_user = None
    user = None

    try:
        firebase_user = firebase_client.auth().sign_in_with_email_and_password(
            email, password
        )
    except Exception as e:
        if Users.objects(email=email):
            user = Users.objects.get(email=email)

            # old account, need to create a firebase account
            # no password -> no sign-in methods -> forced to reset password
            role = None
            if user.role == MENTOR_ROLE:
                role = Account.MENTOR
            elif user.role == MENTEE_ROLE:
                role = Account.MENTEE
            elif user.role == ADMIN_ROLE:
                role = Account.ADMIN

            firebase_user, error_http_response = create_firebase_user(
                email, None, role.value
            )

            if error_http_response:
                return error_http_response

            # user.delete()

            # send password reset email
            error = send_forgot_password_email(email)

            msg = "Created new Firebase account for existing user"
            logger.info(msg)
            return error and error or create_response(status=201, message=msg, data={"passwordReset": True})
        else:
            msg = "Could not login"
            logger.info(msg)
            return create_response(status=422, message=msg)

    firebase_uid = firebase_user["localId"]
    firebase_user_admin = firebase_admin_auth.get_user(firebase_uid)
    role = firebase_user_admin.custom_claims.get('role')

    try:
        if MentorProfile.objects(email=email):
            mentor = MentorProfile.objects.get(email=email)
            mentor_id = mentor.id

            if not mentor.firebase_uid:
                mentor.firebase_uid = firebase_uid
                mentor.save()
    except:
        msg = "Couldn't find mentor with these credentials"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(
        message="Logged in",
        data={
            "mentorId": str(mentor_id),
            "token": firebase_admin_auth.create_custom_token(
                firebase_uid, {"role": role, "mentorId": str(mentor_id)}
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
        error and error or create_response(
            message="Sent password reset link to email")
    )


@auth.route("/refreshToken", methods=["POST"])
def refresh_token():
    data = request.json
    token = data.get('token')

    claims = firebase_admin_auth.verify_id_token(token)
    firebase_uid = claims.get('uid')

    try:
        mentor = MentorProfile.objects.get(firebase_uid=firebase_uid)
    except:
        msg = "Mentor profile not found"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(status=200, data={
        "token": firebase_admin_auth.create_custom_token(
            firebase_uid, {"role": claims.get('role'), "mentorId": str(mentor.id)}
        ).decode("utf-8"),
    })
