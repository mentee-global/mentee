from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_auth
from firebase_admin.exceptions import FirebaseError
from api.models import db, Users, MentorProfile
from api.core import create_response, serialize_list, logger
from api.utils.constants import AUTH_URL, USER_VERIFICATION_TEMPLATE, USER_FORGOT_PASSWORD_TEMPLATE
from api.utils.request_utils import send_email
import requests

auth = Blueprint("auth", __name__)  # initialize blueprint

@auth.route("/verifyEmail", methods=["POST"])
def verify_email():
    data = request.json
    email = data.get('email')
    verification_link = None

    try:
        # TODO: Add ActionCodeSetting for custom link/redirection back to main page
        verification_link = firebase_auth.generate_email_verification_link(email)
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
        data={'link': verification_link},
        template_id=USER_VERIFICATION_TEMPLATE
        ):
        msg = "Could not send email"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(message="Sent verification link to email")


def create_firebase_user(email, password, role):
    firebase_user = None
    error_http_response = None

    try:
        firebase_user = firebase_auth.create_user(
            email=email,
            email_verified=False,
            password=password,
        )

        firebase_auth.set_custom_user_claims(
            firebase_user.uid, {'role': role})
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
    email = data.get('email')
    email_verified = False
    password = data.get('password')
    role = data.get('role')
    firebase_user, error_http_response = create_firebase_user(email, password, role)

    if error_http_response:
        return error_http_response

    firebase_uid = firebase_user.uid

    # create User object
    user = Users(
        firebase_uid=firebase_uid,
        email=email,
        role=role,
        verified=email_verified
    )

    user.save()

    return create_response(
        message="Created account",
        data={
            "token": firebase_auth.create_custom_token(firebase_uid, {'role': role, 'user_id': str(user.id)}).decode('utf-8'),
            "userId": str(user.id),
            "permission": role,
        },
    )


@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    firebase_user = None
    user = None

    try:
        firebase_user = firebase_auth.get_user_by_email(email)
    except Exception as e:
        if Users.objects(email=email):
            user = Users.objects.get(email=email);
            # old account, need to create a firebase account
            firebase_user, error_http_response = create_firebase_user(email, password, user.role)

            if error_http_response:
                return error_http_response

            user.firebase_uid = firebase_user.uid
            user.save()
        else:
            msg = "Could not login"
            logger.info(msg)
            return create_response(status=422, message=msg)

    if not user:
        try:
            user = Users.objects.get(firebase_uid=firebase_user.uid)
        except:
            msg = "Firebase user exists but not MongoDB user"
            logger.info(msg)
            return create_response(status=500, message=msg)

    # clear sensitive legacy fields
    if user.password:
        user.password = ""
        user.save()
    
    try:
        mentor = MentorProfile.objects.get(user_id=user)
        mentor_id = mentor.id
    except:
        msg = "Couldn't find mentor with these credentials"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(
        message="Logged in",
        data={
            "userId": str(user.id),
            "mentorId": str(mentor_id),
            "token": firebase_auth.create_custom_token(firebase_user.uid, {'role': user.role, 'user_id': str(user.id)}).decode('utf-8'),
        },
    )


@auth.route("/forgotPassword", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.email('email')
    reset_link = None

    try:
        # TODO: Add ActionCodeSetting for custom link/redirection back to main page
        reset_link = firebase_auth.generate_password_reset_link(email)
    except ValueError:
        msg = 'Invalid email'
        logger.info(msg)
        return create_response(status=422, message=msg)
    except FirebaseError as e:
        msg = e.message
        logger.info(msg)
        return create_response(status=422, message=msg)

    if not send_email(
        recipient=email, 
        subject='Mentee Password Reset',
        data={'link': reset_link},
        template_id=USER_FORGOT_PASSWORD_TEMPLATE
        ):
        msg = "Cannot send email"
        logger.info(msg)
        return create_response(status=500, message=msg)

    return create_response(
        message="Sent password reset link to email"
    )


@auth.route("/passwordReset", methods=["POST"])
def reset_password():
    data = request.json
    body = {"email": data["email"], "pin": data["pin"],
            "password": data["password"]}
    headers = {"Content-Type": "application/json"}
    results = requests.post(AUTH_URL + "/passwordReset",
                            headers=headers, json=body)
    return results.json()
