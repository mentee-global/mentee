import math
from datetime import datetime, timezone
from os import name
from bson import is_valid
from flask import Blueprint, request
from sqlalchemy import null
from mongoengine.queryset.visitor import Q
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
    N50_ID_DEV,
    N50_ID_PROD,
)
from api.utils.request_utils import (
    send_email,
    is_invalid_form,
    MentorApplicationForm,
    MenteeApplicationForm,
    PartnerApplicationForm,
    get_profile_model,
    get_organizations_by_applications,
)
from api.utils.constants import Account
from firebase_admin import auth as firebase_admin_auth
import urllib

apply = Blueprint("apply", __name__)

# GET request for all mentor applications


@apply.route("/", methods=["GET"])
@admin_only
def get_applications():
    new_applications = list(NewMentorApplication.objects.all())
    old_applications = list(MentorApplication.objects.all())
    new_applications = get_organizations_by_applications(new_applications)
    applications = new_applications + old_applications
    return create_response(data={"mentor_applications": applications})


@apply.route("/menteeApps", methods=["GET"])
@admin_only
def get_mentee_applications():
    applications = list(MenteeApplication.objects.all())
    applications = get_organizations_by_applications(applications)
    return create_response(data={"mentor_applications": applications})


def _enrich_applications_with_orgs(applications):
    """Lightweight org enrichment — only fetches the organization field from partners.

    Uses getattr for safe access because MentorApplication (old model) has no
    partner/organization fields, unlike NewMentorApplication and MenteeApplication.
    """
    partner_ids = set()
    for app in applications:
        pid = getattr(app, "partner", None)
        if pid:
            partner_ids.add(pid)
    if not partner_ids:
        return applications

    partners = PartnerProfile.objects.filter(id__in=partner_ids).only("organization")
    partner_dict = {str(p.id): p.organization for p in partners}
    for app in applications:
        pid = getattr(app, "partner", None)
        if pid and pid in partner_dict:
            app.organization = partner_dict[pid]
    return applications


# Fields the table actually displays — split by model because
# MentorApplication (old) has no partner/organization fields.
_TABLE_FIELDS_BASE = ("name", "email", "notes", "application_state", "date_submitted")
_TABLE_FIELDS_WITH_PARTNER = _TABLE_FIELDS_BASE + ("partner", "organization")


# Effective-stage ids — stable keys for the frontend. Labels are human-facing
# but the id is what filters and exports should key off.
STAGE_APPLIED = "applied"  # PENDING
STAGE_TRAINING = "training"  # APPROVED, awaiting/doing training
STAGE_PROFILE = "profile"  # BuildProfile, training done, profile in progress
STAGE_UNVERIFIED = "active_unverified"  # profile created, email not verified
STAGE_ACTIVE = "active"  # fully onboarded
STAGE_REJECTED = "rejected"
STAGE_ORPHAN = "completed_no_profile"  # state=COMPLETED but no profile row

_STAGE_LABELS = {
    STAGE_APPLIED: "Applied",
    STAGE_TRAINING: "Approved — in training",
    STAGE_PROFILE: "Training done — building profile",
    STAGE_UNVERIFIED: "Profile created — email unverified",
    STAGE_ACTIVE: "Active",
    STAGE_REJECTED: "Rejected",
    STAGE_ORPHAN: "Completed (profile missing)",
}


def _compute_effective_stage(app_state, email, profile_emails, verified_emails):
    """Map raw application_state + profile/verification presence to a stable stage id."""
    if app_state == "REJECTED":
        return STAGE_REJECTED
    if app_state == "PENDING":
        return STAGE_APPLIED
    if app_state == "APPROVED":
        return STAGE_TRAINING
    if app_state == "BuildProfile":
        return STAGE_PROFILE
    if app_state == "COMPLETED":
        if email not in profile_emails:
            return STAGE_ORPHAN
        return STAGE_ACTIVE if email in verified_emails else STAGE_UNVERIFIED
    return STAGE_APPLIED


def _days_since(dt):
    if not dt:
        return None
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max(0, (now - dt).days)


def _serialize_application(app, profile_emails, verified_emails):
    """Build the dict the frontend table consumes — existing fields + stage metadata."""
    email = (getattr(app, "email", "") or "").lower()
    stage_id = _compute_effective_stage(
        getattr(app, "application_state", None),
        email,
        profile_emails,
        verified_emails,
    )
    return {
        "_id": {"$oid": str(app.id)},
        "name": getattr(app, "name", None),
        "email": getattr(app, "email", None),
        "notes": getattr(app, "notes", None),
        "application_state": getattr(app, "application_state", None),
        "partner": getattr(app, "partner", None),
        "organization": getattr(app, "organization", None),
        "date_submitted": (
            getattr(app, "date_submitted").isoformat()
            if getattr(app, "date_submitted", None)
            else None
        ),
        "effective_stage": stage_id,
        "effective_stage_label": _STAGE_LABELS[stage_id],
        "days_since_submit": _days_since(getattr(app, "date_submitted", None)),
    }


def _build_lookup_sets(role):
    """One query each for profiles and verified users, keyed by lowercased email."""
    if role == "mentee":
        profile_model = MenteeProfile
        user_role = "2"
    else:
        profile_model = MentorProfile
        user_role = "1"

    profile_emails = {
        (e or "").lower() for e in profile_model.objects.distinct("email") if e
    }
    verified_emails = {
        (u.email or "").lower()
        for u in Users.objects(role=user_role, verified=True).only("email")
        if u.email
    }
    return profile_emails, verified_emails


def _enrich_applications_with_stage(applications, role):
    profile_emails, verified_emails = _build_lookup_sets(role)
    return [
        _serialize_application(a, profile_emails, verified_emails) for a in applications
    ]


@apply.route("/search", methods=["GET"])
@admin_only
def search_mentor_applications():
    """Server-side paginated + filtered mentor applications (NewMentorApplication + MentorApplication)."""
    try:
        page = max(1, int(request.args.get("page", 1)))
        page_size = max(1, min(int(request.args.get("page_size", 20)), 100))
    except (ValueError, TypeError):
        page = 1
        page_size = 20

    search = request.args.get("search", "").strip()
    application_state = request.args.get("application_state", "").strip()
    partner_id = request.args.get("partner_id", "").strip()
    effective_stage = request.args.get("effective_stage", "").strip()

    query = Q()
    partner_query = Q()
    if search:
        query &= Q(name__icontains=search) | Q(email__icontains=search)
    if application_state:
        query &= Q(application_state=application_state)
    if partner_id:
        # Partner filter only applies to the new-model collection;
        # MentorApplication (legacy) has no partner field.
        partner_query = Q(partner=partner_id)

    new_qs = NewMentorApplication.objects.filter(query & partner_query).only(
        *_TABLE_FIELDS_WITH_PARTNER
    )
    # Legacy collection is skipped entirely when a partner filter is active.
    if partner_id:
        old_qs = MentorApplication.objects.none()
    else:
        old_qs = MentorApplication.objects.filter(query).only(*_TABLE_FIELDS_BASE)

    if effective_stage:
        # Stage filtering must happen on the full filtered set because the
        # stage is computed post-query by joining profile + user collections.
        # Admin-scoped data is small enough to enrich in-memory.
        all_records = _enrich_applications_with_orgs(list(new_qs) + list(old_qs))
        serialized = _enrich_applications_with_stage(all_records, role="mentor")
        serialized = [r for r in serialized if r["effective_stage"] == effective_stage]
        total = len(serialized)
        offset = (page - 1) * page_size
        serialized = serialized[offset : offset + page_size]
    else:
        total_new = new_qs.count()
        total_old = old_qs.count()
        total = total_new + total_old
        offset = (page - 1) * page_size

        records = []
        if offset < total_new:
            take_from_new = min(page_size, total_new - offset)
            records = list(new_qs.skip(offset).limit(take_from_new))
            if len(records) < page_size:
                remaining = page_size - len(records)
                records += list(old_qs.skip(0).limit(remaining))
        else:
            old_offset = offset - total_new
            records = list(old_qs.skip(old_offset).limit(page_size))

        records = _enrich_applications_with_orgs(records)
        serialized = _enrich_applications_with_stage(records, role="mentor")

    return create_response(
        data={
            "applications": serialized,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size > 0 else 0,
        }
    )


@apply.route("/menteeApps/search", methods=["GET"])
@admin_only
def search_mentee_applications():
    """Server-side paginated + filtered mentee applications."""
    try:
        page = max(1, int(request.args.get("page", 1)))
        page_size = max(1, min(int(request.args.get("page_size", 20)), 100))
    except (ValueError, TypeError):
        page = 1
        page_size = 20

    search = request.args.get("search", "").strip()
    application_state = request.args.get("application_state", "").strip()
    partner_id = request.args.get("partner_id", "").strip()
    effective_stage = request.args.get("effective_stage", "").strip()

    query = Q()
    if search:
        query &= Q(name__icontains=search) | Q(email__icontains=search)
    if application_state:
        query &= Q(application_state=application_state)
    if partner_id:
        query &= Q(partner=partner_id)

    queryset = MenteeApplication.objects.filter(query).only(*_TABLE_FIELDS_WITH_PARTNER)

    if effective_stage:
        # Same approach as the mentor search: stage is computed post-query,
        # so filter-then-paginate in-memory to keep pages consistent.
        all_records = _enrich_applications_with_orgs(list(queryset))
        serialized = _enrich_applications_with_stage(all_records, role="mentee")
        serialized = [r for r in serialized if r["effective_stage"] == effective_stage]
        total = len(serialized)
        offset = (page - 1) * page_size
        serialized = serialized[offset : offset + page_size]
    else:
        total = queryset.count()
        offset = (page - 1) * page_size
        records = list(queryset.skip(offset).limit(page_size))
        records = _enrich_applications_with_orgs(records)
        serialized = _enrich_applications_with_stage(records, role="mentee")

    return create_response(
        data={
            "applications": serialized,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size > 0 else 0,
        }
    )


# GET request for mentor applications for by id
@apply.route("/<id>", methods=["GET"])
@admin_only
def get_application_by_id(id):
    try:
        application = NewMentorApplication.objects.get(id=id)
        if application is not None and application.partner is not None:
            partner_data = PartnerProfile.objects.get(id=application.partner)
            if partner_data is not None:
                application.organization = partner_data.organization
        return create_response(data={"mentor_application": application})
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
        n50_url = ""
        if (
            application["partner"] == N50_ID_DEV
            or application["partner"] == N50_ID_PROD
        ):
            n50_url = "n50/"
        if "front_url" in request.args:
            front_url = request.args["front_url"]
            target_url = (
                front_url
                + n50_url
                + "build-profile?role="
                + str(role)
                + "&email="
                + urllib.parse.quote(application["email"])
            )

        preferred_language = request.args.get("preferred_language", "en-US")
        if preferred_language not in TRANSLATIONS:
            preferred_language = "en-US"
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
    if preferred_language not in TRANSLATIONS:
        preferred_language = "en-US"
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
        n50_url = ""
        if application.partner == N50_ID_DEV or application.partner == N50_ID_PROD:
            n50_url = "n50/"
        target_url = (
            front_url
            + n50_url
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
    if preferred_language not in TRANSLATIONS:
        preferred_language = "en-US"

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
            partner = data.get("partner")
            if partner == 0:
                partner = None
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
                partner=partner,
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
