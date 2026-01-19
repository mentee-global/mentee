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
    BugReport,
)
from api.utils.require_auth import admin_only
from api.utils.request_utils import get_profile_model, imgur_client
from api.utils.constants import Account
import csv
import io
from api.views.auth import create_firebase_user
from numpy import imag

admin = Blueprint("admin", __name__)  # initialize blueprint


@admin.route("/account/<int:role>/<string:id>", methods=["DELETE"])
@admin_only
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
def upload_account_emails():
    """Upload account emails to permit registering

    Returns:
        HTTP Response
    """
    f = request.files["fileupload"]
    password = request.form["pass"]
    isMentor = request.form["mentorOrMentee"] == "true"

    with io.TextIOWrapper(f, encoding="utf-8", newline="\n") as fstring:
        reader = csv.reader(fstring, delimiter="\n")
        for line in reader:
            duplicates = VerifiedEmail.objects(
                email=line[0], is_mentor=isMentor, password=password
            )
            if not duplicates:
                email = VerifiedEmail(
                    email=line[0], is_mentor=isMentor, password=password
                )
                email.save()
    return create_response(status=200, message="success")


@admin.route("hub_register", methods=["PUT"])
@admin_only
def create_hub_account():
    id = request.form["id"]
    email = request.form["email"]
    password = request.form["password"]
    name = request.form["name"]
    url = request.form["url"]
    invite_key = request.form["invite_key"]
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
def upload_account_emailText():
    """Upload account emails to permit registering

    Returns:
        HTTP Response
    """

    role = request.form["role"]
    role = int(role)
    messageText = request.form["messageText"]
    password = request.form["password"]
    name = request.form["name"]
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


# Bug Reports Management - MUST come before /admin/<id> route
@admin.route("/admin/bug-reports", methods=["GET"])
@admin_only
def get_bug_reports():
    """Get all bug reports with optional filtering

    Query params:
        status: Filter by status (new, in_progress, resolved, closed)
        priority: Filter by priority (low, medium, high, critical)
        user_email: Filter by user email
        limit: Number of results (default 100)
    """
    try:
        # Get query parameters
        status = request.args.get("status")
        priority = request.args.get("priority")
        user_email = request.args.get("user_email")
        limit = int(request.args.get("limit", 100))

        # Build query
        query = {}
        if status:
            query["status"] = status
        if priority:
            query["priority"] = priority
        if user_email:
            query["user_email"] = user_email

        # Fetch bug reports, sorted by date (newest first)
        if query:
            bug_reports = (
                BugReport.objects(**query).order_by("-date_submitted").limit(limit)
            )
        else:
            bug_reports = BugReport.objects().order_by("-date_submitted").limit(limit)

        return create_response(data={"bug_reports": bug_reports})

    except Exception as e:
        logger.error(f"Failed to fetch bug reports: {e}")
        return create_response(status=500, message=str(e))


@admin.route("/admin/bug-reports/<string:id>", methods=["GET"])
@admin_only
def get_bug_report(id):
    """Get a specific bug report by ID"""
    try:
        bug_report = BugReport.objects.get(id=id)
        return create_response(data={"bug_report": bug_report})
    except:
        msg = "Bug report not found"
        logger.info(msg)
        return create_response(status=404, message=msg)


@admin.route("/admin/bug-reports/<string:id>", methods=["PUT"])
@admin_only
def update_bug_report(id):
    """Update bug report status, priority, or notes

    Request body:
        status: new, in_progress, resolved, closed
        priority: low, medium, high, critical
        notes: Admin notes
        resolved_by: Admin name who resolved it
    """
    try:
        bug_report = BugReport.objects.get(id=id)
        data = request.get_json()

        if "status" in data:
            bug_report.status = data["status"]
            # If marking as resolved, add timestamp
            if data["status"] == "resolved" and not bug_report.resolved_date:
                from datetime import datetime

                bug_report.resolved_date = datetime.utcnow()

        if "priority" in data:
            bug_report.priority = data["priority"]

        if "notes" in data:
            bug_report.notes = data["notes"]

        if "resolved_by" in data:
            bug_report.resolved_by = data["resolved_by"]

        bug_report.save()
        logger.info(f"Bug report {id} updated")

        return create_response(
            data={"bug_report": bug_report}, message="Bug report updated successfully"
        )

    except Exception as e:
        logger.error(f"Failed to update bug report {id}: {e}")
        return create_response(status=500, message=str(e))


@admin.route("/admin/bug-reports/<string:id>", methods=["DELETE"])
@admin_only
def delete_bug_report(id):
    """Delete a bug report"""
    try:
        bug_report = BugReport.objects.get(id=id)
        bug_report.delete()
        logger.info(f"Bug report {id} deleted")

        return create_response(message="Bug report deleted successfully")

    except:
        msg = "Bug report not found"
        logger.info(msg)
        return create_response(status=404, message=msg)


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
