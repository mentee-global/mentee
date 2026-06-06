import math
import os
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from firebase_admin import auth as firebase_admin_auth
from firebase_admin.exceptions import FirebaseError
from flask import Blueprint, g, request
from mongoengine.queryset.visitor import Q

from api.core import create_response, logger
from api.models import (
    MentorApplication,
    MentorProfile,
    MenteeApplication,
    MenteeProfile,
    NewMentorApplication,
    OnboardingEmailEvent,
    PartnerProfile,
    Users,
)
from api.utils.constants import (
    APP_APROVED,
    NEW_APPLICATION_STATUS,
    TRAINING_COMPLETED,
    TRANSLATIONS,
    USER_FORGOT_PASSWORD_TEMPLATE,
    USER_VERIFICATION_TEMPLATE,
    Account,
    N50_ID_DEV,
    N50_ID_PROD,
)
from api.utils.request_utils import send_email
from api.utils.require_auth import admin_only
from api.views.auth import _verify_email_continue_url, send_forgot_password_email

admin_onboarding = Blueprint("admin_onboarding", __name__)

STAGE_APPLIED = "applied"
STAGE_TRAINING = "training"
STAGE_PROFILE = "profile"
STAGE_UNVERIFIED = "active_unverified"
STAGE_ACTIVE = "active"
STAGE_REJECTED = "rejected"
STAGE_ORPHAN = "completed_no_profile"
STAGE_PROFILE_ONLY = "profile_without_completed_application"

STAGE_LABELS = {
    STAGE_APPLIED: "Applied",
    STAGE_TRAINING: "Approved — in training",
    STAGE_PROFILE: "Training done — building profile",
    STAGE_UNVERIFIED: "Profile created — email not verified",
    STAGE_ACTIVE: "Active",
    STAGE_REJECTED: "Rejected",
    STAGE_ORPHAN: "Completed (profile missing)",
    STAGE_PROFILE_ONLY: "Profile exists — application not completed",
}

ACTION_RESEND_TRAINING = "resend_training"
ACTION_RESEND_BUILD_PROFILE = "resend_build_profile"
ACTION_RESEND_VERIFICATION = "resend_verification"
ACTION_RESEND_PASSWORD_RESET = "resend_password_reset"
ACTION_SYNC_VERIFICATION = "sync_verification"
ACTION_REVIEW_APPLICATION = "review_application"
ACTION_ENGINEERING_REVIEW = "engineering_review"

STALE_ONBOARDING_DAYS = 14

ATTENTION_PENDING_REVIEW = "pending_review"
ATTENTION_PROFILE_NOT_CREATED = "profile_not_created"
ATTENTION_COMPLETED_MISSING_PROFILE = "completed_missing_profile"
ATTENTION_PROFILE_APP_INCOMPLETE = "profile_app_incomplete"
ATTENTION_LOGIN_MISSING = "login_missing"
ATTENTION_READY_TO_MARK_VERIFIED = "ready_to_mark_verified"
ATTENTION_EMAIL_NOT_VERIFIED = "email_not_verified"


def _attention_reason(code, message):
    return {"code": code, "message": message}


def _normalize_email(email):
    return (email or "").strip().lower()


def _role_label(role):
    return "Mentor" if int(role) == Account.MENTOR else "Mentee"


def _profile_model(role):
    return MentorProfile if int(role) == Account.MENTOR else MenteeProfile


def _application_models(role):
    if int(role) == Account.MENTOR:
        return (NewMentorApplication, MentorApplication)
    return (MenteeApplication,)


def _request_json():
    return request.get_json(silent=True) or {}


def _front_url():
    front_url = request.args.get("front_url") or _request_json().get("front_url")
    return front_url or os.environ.get("FRONTEND_URL", "http://localhost:3000")


def _preferred_language():
    language = (
        request.args.get("preferred_language")
        if request.method == "GET"
        else _request_json().get("preferred_language", "en-US")
    )
    return language if language in TRANSLATIONS else "en-US"


def _days_since(dt):
    if not dt:
        return None
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return max(0, (now - dt).days)


def _isoformat(dt):
    return dt.isoformat() if dt else None


def _timestamp(dt):
    if not dt:
        return 0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.timestamp()


def _firebase_millis_to_datetime(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def _firebase_metadata(user, field):
    metadata = getattr(user, "user_metadata", None)
    return _firebase_millis_to_datetime(getattr(metadata, field, None))


def _partner_names():
    return {
        str(p.id): p.organization for p in PartnerProfile.objects.only("organization")
    }


def _firebase_user_record(user):
    return {
        "exists": True,
        "uid": user.uid,
        "email_verified": bool(user.email_verified),
        "disabled": bool(user.disabled),
        "created_at": _firebase_metadata(user, "creation_timestamp"),
        "last_sign_in_at": _firebase_metadata(user, "last_sign_in_timestamp"),
    }


def _firebase_lookup_batch(batch):
    result = {}
    try:
        response = firebase_admin_auth.get_users(
            [firebase_admin_auth.EmailIdentifier(email) for email in batch]
        )
        for user in response.users:
            if user.email:
                result[_normalize_email(user.email)] = _firebase_user_record(user)
    except Exception as exc:
        logger.warning(f"Firebase batch lookup failed: {exc}")
        for email in batch:
            try:
                user = firebase_admin_auth.get_user_by_email(email)
                result[email] = _firebase_user_record(user)
            except Exception:
                pass
    return result


def _firebase_lookup(emails):
    normalized = [e for e in {_normalize_email(email) for email in emails} if e]
    batches = [normalized[idx : idx + 100] for idx in range(0, len(normalized), 100)]
    if not batches:
        return {}
    # Each batch is a separate Firebase round trip; running them sequentially is the
    # dominant cost of this endpoint. Fan them out so the network waits overlap.
    result = {}
    with ThreadPoolExecutor(max_workers=min(8, len(batches))) as executor:
        for batch_result in executor.map(_firebase_lookup_batch, batches):
            result.update(batch_result)
    return result


def _serialize_event(event):
    return {
        "action": event.action,
        "success": event.success,
        "error_message": event.error_message,
        "created_at": _isoformat(event.created_at),
        "admin_email": event.admin_email,
    }


def _events_by_email(emails, role, limit_per_email=10):
    lookup = {}
    normalized = [e for e in {_normalize_email(email) for email in emails} if e]
    if not normalized:
        return lookup
    events = OnboardingEmailEvent.objects(
        email__in=normalized, role=str(int(role))
    ).order_by("-created_at")
    for event in events:
        event_email = _normalize_email(event.email)
        if len(lookup.get(event_email, [])) < limit_per_email:
            lookup.setdefault(event_email, []).append(_serialize_event(event))
    return lookup


def _application_queryset(role, query, partner_id=""):
    applications = []
    for model in _application_models(role):
        if partner_id and model is MentorApplication:
            continue
        model_query = query
        if partner_id:
            model_query &= Q(partner=partner_id)
        applications.extend(list(model.objects.filter(model_query)))
    return applications


def _app_for_email(email, role):
    for model in _application_models(role):
        app = model.objects(email__iexact=email).first()
        if app:
            return app
    return None


def _build_link(app, role, page, front_url):
    base = (front_url or "").rstrip("/")
    if base:
        base += "/"
    n50_url = ""
    partner = getattr(app, "partner", None)
    if partner in (N50_ID_DEV, N50_ID_PROD):
        n50_url = "n50/"
    return (
        base
        + n50_url
        + page
        + "?role="
        + str(int(role))
        + "&email="
        + urllib.parse.quote(getattr(app, "email", ""))
    )


def _effective_stage(app, email, profile, mongo_user, firebase_user):
    if app is None:
        return STAGE_PROFILE_ONLY if profile else STAGE_APPLIED
    state = getattr(app, "application_state", None)
    if profile and state != NEW_APPLICATION_STATUS["COMPLETED"]:
        return STAGE_PROFILE_ONLY
    if state == NEW_APPLICATION_STATUS["REJECTED"]:
        return STAGE_REJECTED
    if state == NEW_APPLICATION_STATUS["PENDING"]:
        return STAGE_APPLIED
    if state == NEW_APPLICATION_STATUS["APPROVED"]:
        return STAGE_TRAINING
    if state == NEW_APPLICATION_STATUS["BUILDPROFILE"]:
        return STAGE_PROFILE
    if state == NEW_APPLICATION_STATUS["COMPLETED"]:
        if not profile:
            return STAGE_ORPHAN
        verified = bool(firebase_user and firebase_user.get("email_verified"))
        if not verified:
            verified = bool(mongo_user and getattr(mongo_user, "verified", False))
        return STAGE_ACTIVE if verified else STAGE_UNVERIFIED
    if profile:
        return STAGE_PROFILE_ONLY
    return STAGE_APPLIED


def _recommendation(app, profile, mongo_user, firebase_user):
    state = getattr(app, "application_state", None) if app else None
    firebase_exists = bool(firebase_user and firebase_user.get("exists"))
    firebase_verified = bool(firebase_user and firebase_user.get("email_verified"))
    mongo_verified = bool(mongo_user and getattr(mongo_user, "verified", False))

    if state == NEW_APPLICATION_STATUS["COMPLETED"] and not profile:
        return ACTION_ENGINEERING_REVIEW
    if state == NEW_APPLICATION_STATUS["PENDING"]:
        return ACTION_REVIEW_APPLICATION
    if profile and firebase_verified and not mongo_verified:
        return ACTION_SYNC_VERIFICATION
    if profile and firebase_exists and not firebase_verified:
        return ACTION_RESEND_VERIFICATION
    if state == NEW_APPLICATION_STATUS["BUILDPROFILE"] and not profile:
        return ACTION_RESEND_BUILD_PROFILE
    if state == NEW_APPLICATION_STATUS["APPROVED"] and not profile:
        return ACTION_RESEND_TRAINING
    if app and firebase_exists and not profile:
        return ACTION_RESEND_BUILD_PROFILE
    if app and profile and state != NEW_APPLICATION_STATUS["COMPLETED"]:
        return ACTION_ENGINEERING_REVIEW
    if profile and not firebase_exists:
        return ACTION_ENGINEERING_REVIEW
    return None


def _available_actions(app, profile, mongo_user, firebase_user):
    actions = []
    state = getattr(app, "application_state", None) if app else None
    firebase_exists = bool(firebase_user and firebase_user.get("exists"))
    firebase_verified = bool(firebase_user and firebase_user.get("email_verified"))
    mongo_verified = bool(mongo_user and getattr(mongo_user, "verified", False))

    if state == NEW_APPLICATION_STATUS["PENDING"]:
        actions.append(ACTION_REVIEW_APPLICATION)
    if state == NEW_APPLICATION_STATUS["APPROVED"] and not profile:
        actions.append(ACTION_RESEND_TRAINING)
    if state == NEW_APPLICATION_STATUS["BUILDPROFILE"] and not profile:
        actions.append(ACTION_RESEND_BUILD_PROFILE)
    if (
        app
        and firebase_exists
        and not profile
        and state != NEW_APPLICATION_STATUS["COMPLETED"]
    ):
        actions.append(ACTION_RESEND_BUILD_PROFILE)
    if firebase_exists and not firebase_verified:
        actions.append(ACTION_RESEND_VERIFICATION)
    if firebase_exists:
        actions.append(ACTION_RESEND_PASSWORD_RESET)
    if profile and firebase_exists and firebase_verified and not mongo_verified:
        actions.append(ACTION_SYNC_VERIFICATION)
    return list(dict.fromkeys(actions))


def _attention_reasons(app, profile, mongo_user, firebase_user):
    reasons = []
    state = getattr(app, "application_state", None) if app else None
    firebase_exists = bool(firebase_user and firebase_user.get("exists"))
    firebase_verified = bool(firebase_user and firebase_user.get("email_verified"))
    mongo_verified = bool(mongo_user and getattr(mongo_user, "verified", False))
    days_since_submit = (
        _days_since(getattr(app, "date_submitted", None)) if app else None
    )
    days_since_profile = _days_since(_profile_created_at(profile))

    if (
        state == NEW_APPLICATION_STATUS["PENDING"]
        and days_since_submit is not None
        and days_since_submit >= STALE_ONBOARDING_DAYS
    ):
        reasons.append(
            _attention_reason(
                ATTENTION_PENDING_REVIEW,
                f"Application has been waiting for review for {days_since_submit} days",
            )
        )
    if (
        state
        in (NEW_APPLICATION_STATUS["APPROVED"], NEW_APPLICATION_STATUS["BUILDPROFILE"])
        and not profile
        and days_since_submit is not None
        and days_since_submit >= STALE_ONBOARDING_DAYS
    ):
        reasons.append(
            _attention_reason(
                ATTENTION_PROFILE_NOT_CREATED,
                f"Application was submitted {days_since_submit} days ago and the profile is not created yet",
            )
        )
    if app and profile and state != NEW_APPLICATION_STATUS["COMPLETED"]:
        reasons.append(
            _attention_reason(
                ATTENTION_PROFILE_APP_INCOMPLETE,
                "Profile exists but application is not completed",
            )
        )
    if state == NEW_APPLICATION_STATUS["COMPLETED"] and not profile:
        reasons.append(
            _attention_reason(
                ATTENTION_COMPLETED_MISSING_PROFILE,
                "Application is completed but profile is missing",
            )
        )
    if profile and not firebase_exists:
        reasons.append(
            _attention_reason(
                ATTENTION_LOGIN_MISSING,
                "Profile exists but login account is missing",
            )
        )
    if profile and firebase_verified and not mongo_verified:
        reasons.append(
            _attention_reason(
                ATTENTION_READY_TO_MARK_VERIFIED,
                "Email is verified but the app has not caught up yet",
            )
        )
    if (
        profile
        and firebase_exists
        and not firebase_verified
        and days_since_profile is not None
        and days_since_profile >= STALE_ONBOARDING_DAYS
    ):
        reasons.append(
            _attention_reason(
                ATTENTION_EMAIL_NOT_VERIFIED,
                f"Profile was created {days_since_profile} days ago and email is still not verified",
            )
        )
    return reasons


def _profile_created_at(profile):
    """Reliable profile creation time.

    The profile models declare ``created_at = DateTimeField(default=datetime.utcnow)``,
    but legacy documents never stored the field, so MongoEngine applies the default at
    read time and ``created_at`` reads back as "now". The ObjectId generation time is
    the true creation date, so we use it instead for dates and staleness checks.
    """
    if not profile:
        return None
    return profile.id.generation_time


def _profileless_attention_candidate(app):
    """Whether a profile-less applicant could need attention without a Firebase lookup.

    Every Firebase-dependent attention reason (login missing, ready to mark verified,
    email not verified) requires a profile, so a row with no profile can only be
    flagged from its application alone. This lets the listing skip the Firebase call
    for the large tail of applicants who never started a profile and are not stale.
    """
    if app is None:
        return False
    state = getattr(app, "application_state", None)
    if state == NEW_APPLICATION_STATUS["COMPLETED"]:
        return True
    days_since_submit = _days_since(getattr(app, "date_submitted", None))
    if days_since_submit is None or days_since_submit < STALE_ONBOARDING_DAYS:
        return False
    return state in (
        NEW_APPLICATION_STATUS["PENDING"],
        NEW_APPLICATION_STATUS["APPROVED"],
        NEW_APPLICATION_STATUS["BUILDPROFILE"],
    )


def _serialize_row(
    email, role, app, profile, mongo_user, firebase_user, events, partners
):
    stage = _effective_stage(app, email, profile, mongo_user, firebase_user)
    partner = getattr(app, "partner", None) or getattr(profile, "organization", None)
    date_submitted = getattr(app, "date_submitted", None) if app else None
    profile_created_at = _profile_created_at(profile)
    firebase_created_at = firebase_user.get("created_at") if firebase_user else None
    firebase_last_sign_in_at = (
        firebase_user.get("last_sign_in_at") if firebase_user else None
    )
    action_events = events.get(email, [])
    last_action_event = action_events[0] if action_events else None
    latest_action_at = (
        datetime.fromisoformat(last_action_event["created_at"])
        if last_action_event and last_action_event.get("created_at")
        else None
    )
    latest_activity_at = max(
        (
            date_submitted,
            profile_created_at,
            firebase_created_at,
            firebase_last_sign_in_at,
            latest_action_at,
        ),
        key=_timestamp,
    )
    return {
        "id": f"{int(role)}:{email}",
        "email": email,
        "name": getattr(app, "name", None) or getattr(profile, "name", None),
        "role": int(role),
        "role_label": _role_label(role),
        "application_id": str(app.id) if app else None,
        "profile_id": str(profile.id) if profile else None,
        "application_state": getattr(app, "application_state", None) if app else None,
        "partner": partner,
        "organization": partners.get(str(partner)) if partner else None,
        "date_submitted": _isoformat(date_submitted),
        "profile_created_at": _isoformat(profile_created_at),
        "firebase_created_at": _isoformat(firebase_created_at),
        "firebase_last_sign_in_at": _isoformat(firebase_last_sign_in_at),
        "latest_activity_at": _isoformat(latest_activity_at),
        "days_since_submit": _days_since(date_submitted) if app else None,
        "sort_submitted_at": _timestamp(date_submitted),
        "sort_activity_at": _timestamp(latest_activity_at),
        "effective_stage": stage,
        "effective_stage_label": STAGE_LABELS[stage],
        "application_exists": bool(app),
        "profile_exists": bool(profile),
        "mongo_user_exists": bool(mongo_user),
        "mongo_verified": bool(mongo_user and getattr(mongo_user, "verified", False)),
        "firebase_exists": bool(firebase_user and firebase_user.get("exists")),
        "firebase_verified": bool(
            firebase_user and firebase_user.get("email_verified")
        ),
        "firebase_disabled": bool(firebase_user and firebase_user.get("disabled")),
        "verification_synced": bool(
            firebase_user
            and firebase_user.get("email_verified")
            and mongo_user
            and getattr(mongo_user, "verified", False)
        ),
        "recommended_action": _recommendation(app, profile, mongo_user, firebase_user),
        "available_actions": _available_actions(
            app, profile, mongo_user, firebase_user
        ),
        "attention_reasons": _attention_reasons(
            app, profile, mongo_user, firebase_user
        ),
        "action_events": action_events,
        "last_email_event": last_action_event,
    }


def _record_event(
    email, role, action, template_id, link_type, success, error, metadata=None
):
    claims = getattr(g, "auth_claims", {}) or {}
    event = OnboardingEmailEvent(
        email=_normalize_email(email),
        role=str(int(role)),
        action=action,
        template_id=template_id,
        link_type=link_type,
        success=success,
        error_message=error or "",
        admin_uid=claims.get("uid"),
        admin_email=claims.get("email"),
        metadata=metadata or {},
    )
    event.save()


@admin_onboarding.route("", methods=["GET"])
@admin_only
def list_onboarding():
    try:
        role = int(request.args.get("role", Account.MENTEE.value))
    except (TypeError, ValueError):
        return create_response(status=422, message="Invalid role")
    if role not in (Account.MENTOR.value, Account.MENTEE.value):
        return create_response(status=422, message="Unsupported role")

    try:
        page = max(1, int(request.args.get("page", 1)))
        page_size = max(1, min(int(request.args.get("page_size", 20)), 100))
    except (TypeError, ValueError):
        page = 1
        page_size = 20

    search = request.args.get("search", "").strip()
    partner_id = request.args.get("partner_id", "").strip()
    stage_filter = request.args.get("effective_stage", "").strip()
    attention = request.args.get("attention", "").strip()
    attention_type = request.args.get("attention_type", "").strip()

    query = Q()
    profile_query = Q()
    if search:
        query &= Q(name__icontains=search) | Q(email__icontains=search)
        profile_query &= Q(name__icontains=search) | Q(email__icontains=search)
    if partner_id:
        profile_query &= Q(organization=partner_id)

    apps = _application_queryset(role, query, partner_id)
    profiles = list(_profile_model(role).objects.filter(profile_query))
    emails = {
        _normalize_email(getattr(app, "email", None))
        for app in apps
        if getattr(app, "email", None)
    } | {
        _normalize_email(getattr(profile, "email", None))
        for profile in profiles
        if getattr(profile, "email", None)
    }

    app_by_email = {}
    for app in apps:
        email = _normalize_email(getattr(app, "email", None))
        if email and email not in app_by_email:
            app_by_email[email] = app
    profile_by_email = {
        _normalize_email(profile.email): profile
        for profile in profiles
        if profile.email
    }
    mongo_users = {}
    for user in Users.objects(role=str(role)).only("email", "firebase_uid", "verified"):
        user_email = _normalize_email(user.email)
        if user_email in emails:
            mongo_users[user_email] = user
    # Firebase lookups are the most expensive part of this endpoint (one API call
    # per ~100 emails). In the default attention-only view a profile-less row can
    # only qualify via application-only reasons, so we skip Firebase for the rest.
    if attention == "true":
        firebase_emails = {
            email
            for email in emails
            if profile_by_email.get(email)
            or _profileless_attention_candidate(app_by_email.get(email))
        }
    else:
        firebase_emails = emails
    firebase_users = _firebase_lookup(firebase_emails)
    events = _events_by_email(emails, role)
    partners = _partner_names()

    rows = [
        _serialize_row(
            email,
            role,
            app_by_email.get(email),
            profile_by_email.get(email),
            mongo_users.get(email),
            firebase_users.get(email),
            events,
            partners,
        )
        for email in sorted(emails)
    ]

    # Stage/search/partner define the "view" population. The summary counts that
    # whole population so "People in view" and "Need attention" stay distinct; the
    # attention toggle and attention-type only filter the table below.
    if stage_filter and stage_filter != "all":
        rows = [row for row in rows if row["effective_stage"] == stage_filter]

    summary = {"stages": {}, "actions": {}, "needs_attention": 0, "total": len(rows)}
    for row in rows:
        summary["stages"][row["effective_stage"]] = (
            summary["stages"].get(row["effective_stage"], 0) + 1
        )
        if row["attention_reasons"]:
            summary["needs_attention"] += 1
            action = row["recommended_action"]
            if action:
                summary["actions"][action] = summary["actions"].get(action, 0) + 1
            for reason in row["attention_reasons"]:
                summary.setdefault("attention_types", {})
                summary["attention_types"][reason["code"]] = (
                    summary["attention_types"].get(reason["code"], 0) + 1
                )

    table_rows = rows
    if attention == "true":
        table_rows = [row for row in table_rows if row["attention_reasons"]]
    if attention_type and attention_type != "all":
        table_rows = [
            row
            for row in table_rows
            if any(
                reason["code"] == attention_type for reason in row["attention_reasons"]
            )
        ]

    table_rows.sort(
        key=lambda row: (
            0 if row["attention_reasons"] else 1,
            -row["sort_submitted_at"],
            -row["sort_activity_at"],
            row["email"],
        )
    )

    total = len(table_rows)
    offset = (page - 1) * page_size
    return create_response(
        data={
            "rows": table_rows[offset : offset + page_size],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size > 0 else 0,
            "summary": summary,
        }
    )


def _send_template_action(email, role, action):
    email = _normalize_email(email)
    app = _app_for_email(email, role)
    if not app:
        return create_response(status=404, message="No application found")

    preferred_language = _preferred_language()
    front_url = _front_url()
    state = getattr(app, "application_state", None)

    if action == ACTION_RESEND_TRAINING:
        if state != NEW_APPLICATION_STATUS["APPROVED"]:
            return create_response(status=409, message="Application is not approved")
        link = _build_link(app, role, "application-training", front_url)
        template_id = APP_APROVED
        subject_key = "app_approved"
        link_type = "application-training"
    elif action == ACTION_RESEND_BUILD_PROFILE:
        if state == NEW_APPLICATION_STATUS["COMPLETED"]:
            return create_response(
                status=409, message="Completed applications require manual review"
            )
        link = _build_link(app, role, "build-profile", front_url)
        template_id = TRAINING_COMPLETED
        subject_key = "training_complete"
        link_type = "build-profile"
    else:
        return create_response(status=422, message="Unsupported action")

    success, msg = send_email(
        recipient=email,
        template_id=template_id,
        data={
            "link": link,
            preferred_language: True,
            "subject": TRANSLATIONS[preferred_language][subject_key],
        },
    )
    _record_event(
        email,
        role,
        action,
        template_id,
        link_type,
        success,
        msg,
        {"application_id": str(app.id), "link": link},
    )
    if not success:
        return create_response(status=500, message=msg)
    return create_response(message="Email sent")


@admin_onboarding.route(
    "/<int:role>/<path:email>/actions/resend-training", methods=["POST"]
)
@admin_only
def resend_training(role, email):
    return _send_template_action(email, role, ACTION_RESEND_TRAINING)


@admin_onboarding.route(
    "/<int:role>/<path:email>/actions/resend-build-profile", methods=["POST"]
)
@admin_only
def resend_build_profile(role, email):
    return _send_template_action(email, role, ACTION_RESEND_BUILD_PROFILE)


@admin_onboarding.route(
    "/<int:role>/<path:email>/actions/resend-verification", methods=["POST"]
)
@admin_only
def resend_verification(role, email):
    email = _normalize_email(email)
    preferred_language = _preferred_language()
    try:
        firebase_admin_auth.get_user_by_email(email)
        settings = firebase_admin_auth.ActionCodeSettings(
            url=_verify_email_continue_url(),
            handle_code_in_app=True,
        )
        link = firebase_admin_auth.generate_email_verification_link(
            email, action_code_settings=settings
        )
    except (ValueError, FirebaseError) as exc:
        msg = str(exc)
        _record_event(
            email,
            role,
            ACTION_RESEND_VERIFICATION,
            USER_VERIFICATION_TEMPLATE,
            "verify-email",
            False,
            msg,
        )
        return create_response(status=422, message=msg)

    success, msg = send_email(
        recipient=email,
        data={
            "link": link,
            preferred_language: True,
            "subject": TRANSLATIONS[preferred_language]["verify_email"],
        },
        template_id=USER_VERIFICATION_TEMPLATE,
    )
    _record_event(
        email,
        role,
        ACTION_RESEND_VERIFICATION,
        USER_VERIFICATION_TEMPLATE,
        "verify-email",
        success,
        msg,
        {"link": link},
    )
    if not success:
        return create_response(status=500, message=msg)
    return create_response(message="Verification email sent")


@admin_onboarding.route(
    "/<int:role>/<path:email>/actions/resend-password-reset", methods=["POST"]
)
@admin_only
def resend_password_reset(role, email):
    email = _normalize_email(email)
    try:
        firebase_admin_auth.get_user_by_email(email)
    except Exception:
        msg = "No login account exists for this email"
        _record_event(
            email,
            role,
            ACTION_RESEND_PASSWORD_RESET,
            USER_FORGOT_PASSWORD_TEMPLATE,
            "password-reset",
            False,
            msg,
        )
        return create_response(status=404, message=msg)

    error_response = send_forgot_password_email(email, _preferred_language())
    success = error_response is None
    msg = "" if success else error_response[0].get_json().get("message", "")
    _record_event(
        email,
        role,
        ACTION_RESEND_PASSWORD_RESET,
        USER_FORGOT_PASSWORD_TEMPLATE,
        "password-reset",
        success,
        msg,
    )
    if error_response:
        return error_response
    return create_response(message="Password reset email sent")


@admin_onboarding.route(
    "/<int:role>/<path:email>/actions/sync-verification", methods=["POST"]
)
@admin_only
def sync_verification(role, email):
    email = _normalize_email(email)
    profile = _profile_model(role).objects(email__iexact=email).first()
    if not profile:
        _record_event(
            email,
            role,
            ACTION_SYNC_VERIFICATION,
            None,
            "sync-verification",
            False,
            "Profile does not exist",
        )
        return create_response(status=409, message="Profile does not exist")

    try:
        firebase_user = firebase_admin_auth.get_user_by_email(email)
    except Exception:
        _record_event(
            email,
            role,
            ACTION_SYNC_VERIFICATION,
            None,
            "sync-verification",
            False,
            "No login account exists",
        )
        return create_response(status=404, message="No login account exists")

    user = Users.objects(email__iexact=email, role=str(role)).first()
    if not user:
        user = Users(
            firebase_uid=firebase_user.uid,
            email=email,
            role=str(role),
            verified=bool(firebase_user.email_verified),
        )
    else:
        user.firebase_uid = firebase_user.uid
        user.verified = bool(firebase_user.email_verified)
    user.save()

    if getattr(profile, "firebase_uid", None) != firebase_user.uid:
        profile.firebase_uid = firebase_user.uid
        profile.save()

    _record_event(
        email,
        role,
        ACTION_SYNC_VERIFICATION,
        None,
        "sync-verification",
        True,
        "",
        {"firebase_uid": firebase_user.uid},
    )

    return create_response(
        message="Verification marked in the app",
        data={"verified": bool(firebase_user.email_verified)},
    )
