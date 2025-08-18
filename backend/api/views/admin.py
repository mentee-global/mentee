from api.models.Moderator import Moderator
from api.views.messages import invite
from flask import Blueprint, request
from firebase_admin import auth as firebase_admin_auth
from api.core import create_response, logger
from api.models import (
    MenteeApplication,
    MenteeProfile,
    MentorApplication,
    MentorProfile,
    NewMentorApplication,
    PartnerProfile,
    Support,
    Users,
    VerifiedEmail,
    Admin,
    Guest,
    Hub,
    Image,
)
from api.utils.require_auth import admin_only, all_users
from api.utils.input_validation import (
    validate_file_upload,
    sanitize_text,
    validate_email_format,
    secure_filename_enhanced,
)
from api.utils.request_utils import get_profile_model, imgur_client
from api.utils.constants import Account
from api.utils.web_security import auth_rate_limit, CSRFProtection, api_rate_limit
import csv
import io
from api.views.auth import create_firebase_user
from numpy import imag

admin = Blueprint("admin", __name__)  # initialize blueprint


@admin.route("/account/<int:role>/<string:id>", methods=["DELETE"])
@admin_only
@api_rate_limit
@CSRFProtection.csrf_protect
def delete_account(role, id):
    """Allows for the deletion of a specific account from the
    Mentee/Mentor documents

    Args:
        role (Account): Specifies role of account
        id (int): The _id of the specific account document

    Returns:
        HTTP Response
    """
    try:
        account = get_profile_model(role).objects.get(id=id)
    except:
        msg = "No account currently exist with ID " + id
        logger.info(msg)
        return create_response(status=422, message=msg)

    firebase_uid = account.firebase_uid
    email = account.email
    login = None

    if not firebase_uid:
        # MenteeProfile does not contain user_id field
        if role == Account.MENTEE:
            account.delete()
            return create_response(status=200, message="Successful deletion")

        user_id = account.user_id
        try:
            login = Users.objects.get(id=user_id.id)
        except:
            msg = "No account currently exist with user_id " + user_id
            logger.info(msg)
            return create_response(status=422, message=msg)

        verified = None
        if login.verified:
            try:
                verified = VerifiedEmail.objects.get(email=email)
            except:
                msg = "No verified account currently exist with email " + email
                logger.info(msg)

        login.delete()
        if verified:
            verified.delete()
    else:
        login = firebase_admin_auth.get_user(firebase_uid)

        if not login.email_verified:
            msg = "No verified account currently exist with email " + email
            logger.info(msg)

    account.delete()
    return create_response(status=200, message="Successful deletion")


@admin.route("/upload/accounts", methods=["POST"])
@admin_only
@api_rate_limit
@CSRFProtection.csrf_protect
def upload_account_emails():
    """Upload account emails to permit registering

    Returns:
        HTTP Response
    """
    if "fileupload" not in request.files:
        return create_response(status=422, message="No file provided")

    f = request.files["fileupload"]

    valid, error_msg = validate_file_upload(
        f, allowed_extensions={"csv"}, max_size_mb=5
    )
    if not valid:
        return create_response(status=422, message=error_msg)

    password = sanitize_text(request.form.get("pass", ""))
    isMentor = request.form.get("mentorOrMentee") == "true"

    if not password:
        return create_response(status=422, message="Password is required")

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        for line in reader:
            if line and len(line) > 0:
                email = sanitize_text(line[0])

                valid, error_msg = validate_email_format(email)
                if not valid:
                    continue

                duplicates = VerifiedEmail.objects(
                    email=email, is_mentor=isMentor, password=password
                )
                if not duplicates:
                    email_obj = VerifiedEmail(
                        email=email, is_mentor=isMentor, password=password
                    )
                    email_obj.save()
    return create_response(status=200, message="success")


@admin.route("hub_register", methods=["PUT"])
@admin_only
@api_rate_limit
@CSRFProtection.csrf_protect
def create_hub_account():
    id = sanitize_text(request.form.get("id", ""))
    email = sanitize_text(request.form.get("email", ""))
    password = sanitize_text(request.form.get("password", ""))
    name = sanitize_text(request.form.get("name", ""))
    url = sanitize_text(request.form.get("url", ""))
    invite_key = sanitize_text(request.form.get("invite_key", ""))

    if not email or not password or not name:
        return create_response(
            status=400, message="Email, password, and name are required"
        )

    if not validate_email_format(email):
        return create_response(status=400, message="Invalid email format")

    image = None
    if "image" in request.files:
        image = request.files["image"]

    role = Account.HUB

    if id is not None and id != "":
        hub_account = Hub.objects.get(id=id)
        if hub_account is not None:
            hub_account.name = name
            hub_account.url = url
            hub_account.invite_key = invite_key
            if hub_account.email != email:
                ex_email = hub_account.email
                firebase_user = firebase_admin_auth.get_user_by_email(ex_email)
                if password is not None:
                    firebase_admin_auth.update_user(
                        firebase_user.uid, email=email, password=password
                    )
                else:
                    firebase_admin_auth.update_user(
                        firebase_user.uid,
                        email=email,
                    )
                hub_account.email = email
                ex_data = Users.objects.filter(email=ex_email)
                if len(ex_data) > 0:
                    for ex_item in ex_data:
                        ex_item.email = email
                        ex_item.save()
                ex_data = VerifiedEmail.objects.filter(email=ex_email)
                if len(ex_data) > 0:
                    for ex_item in ex_data:
                        ex_item.email = email
                        ex_item.save()

            if hub_account.image is True and hub_account.image.image_hash is True:
                image_response = imgur_client.delete_image(hub_account.image.image_hash)
            if image is not None:
                image_response = imgur_client.send_image(image)
                new_image = Image(
                    url=image_response["data"]["link"],
                    image_hash=image_response["data"]["deletehash"],
                )
                hub_account.image = new_image
            hub_account.save()
        return create_response(status=200, message="Edit Hub user successfully")
    else:
        duplicates = VerifiedEmail.objects(email=email, role=str(role), password="")
        if not duplicates:
            firebase_user, error_http_response = create_firebase_user(email, password)
            if error_http_response:
                try:
                    firebase_user = firebase_admin_auth.get_user_by_email(email)
                except Exception as e:
                    logger.error(e)
                    logger.warning(f"{email} is not verified in Firebase")
                    return create_response(
                        status=422, message="Can't create firebase user"
                    )
            firebase_uid = firebase_user.uid
            hub = Hub(
                name=name,
                email=email,
                firebase_uid=firebase_uid,
                url=url,
                invite_key=invite_key,
            )

            if image is not None:
                image_response = imgur_client.send_image(image)
                new_image = Image(
                    url=image_response["data"]["link"],
                    image_hash=image_response["data"]["deletehash"],
                )
                hub.image = new_image

            hub.save()

            verified_email = VerifiedEmail(email=email, role=str(role), password="")
            verified_email.save()
        else:
            return create_response(
                status=500, message="This Email is already registered"
            )

        return create_response(status=200, message="Add Hub user successfully")


@admin.route("/upload/accountsEmails", methods=["POST"])
@admin_only
@api_rate_limit
@CSRFProtection.csrf_protect
def upload_account_emailText():
    """Upload account emails to permit registering

    Returns:
        HTTP Response
    """

    role_str = sanitize_text(request.form.get("role", ""))
    messageText = sanitize_text(request.form.get("messageText", ""))
    password = sanitize_text(request.form.get("password", ""))
    name = sanitize_text(request.form.get("name", ""))

    if not role_str or not messageText or not password or not name:
        return create_response(status=400, message="All fields are required")

    try:
        role = int(role_str)
    except ValueError:
        return create_response(status=400, message="Invalid role format")

    if role == Account.GUEST or role == Account.SUPPORT or role == Account.MODERATOR:
        email = messageText
        email = email.replace(" ", "")
        duplicates = VerifiedEmail.objects(email=email, role=str(role), password="")
        if not duplicates:
            firebase_user, error_http_response = create_firebase_user(email, password)
            if error_http_response:
                try:
                    firebase_user = firebase_admin_auth.get_user_by_email(email)
                except Exception as e:
                    logger.error(e)
                    logger.warning(f"{email} is not verified in Firebase")
                    return create_response(
                        status=422, message="Can't create firebase user"
                    )

            firebase_uid = firebase_user.uid

            if role == Account.GUEST:
                guest = Guest(email=email, name=name, firebase_uid=firebase_uid)
                guest.save()
            elif role == Account.SUPPORT:
                support = Support(email=email, name=name, firebase_uid=firebase_uid)
                support.save()
            elif role == Account.MODERATOR:
                moderator = Moderator(email=email, name=name, firebase_uid=firebase_uid)
                moderator.save()

            verified_email = VerifiedEmail(email=email, role=str(role), password="")
            verified_email.save()
        else:
            return create_response(
                status=500, message="This Email is already registered"
            )
    else:
        for email in messageText.split(";"):
            email = email.replace(" ", "")
            duplicates = VerifiedEmail.objects(email=email, role=str(role), password="")
            if not duplicates:
                email = VerifiedEmail(email=email, role=str(role), password="")
                email.save()

    return create_response(status=200, message="Add users successfully")


@admin.route("/admin/<id>", methods=["GET"])
def get_admin(id):
    # return create_response(data={"admin": {"_id":{"$oid":"60765e9289899aeee51a8b27"},"email":"klhester3@gmail.com","firebase_uid":"xsW41z9Hc6Y9r6Te0JAcXhlYneA2","name":"candle"}})

    """Get admin account info

    Args:
        id (int): ObjectId of Admin

    Returns:
        HTTP Response
    """
    try:
        admin = Admin.objects.get(id=id)
        return create_response(data={"admin": admin})

    except:
        msg = "Admin does not exist"
        logger.info(msg)
        return create_response(status=422, message=msg)


@admin.route("edit_email_password", methods=["POST"])
@admin_only
@api_rate_limit
@CSRFProtection.csrf_protect
def editEmailPassword():
    data = request.get_json()
    email = data["email"]
    ex_email = data["ex_email"]
    password = None
    if "password" in data:
        password = data["password"]
    firebase_user = firebase_admin_auth.get_user_by_email(ex_email)

    if password is not None:
        firebase_admin_auth.update_user(
            firebase_user.uid, email=email, password=password
        )
    else:
        firebase_admin_auth.update_user(
            firebase_user.uid,
            email=email,
        )
    if email != ex_email:
        ex_data = MenteeApplication.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = MentorApplication.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = MenteeProfile.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = MentorProfile.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = NewMentorApplication.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = PartnerProfile.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = Users.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = VerifiedEmail.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = Guest.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = Support.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()
        ex_data = Moderator.objects.filter(email=ex_email)
        if len(ex_data) > 0:
            for ex_item in ex_data:
                ex_item.email = email
                ex_item.save()

    return create_response(status=200, message="successful edited")
