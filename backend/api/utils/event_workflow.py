import json
import os
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from types import SimpleNamespace
from urllib.parse import urlparse

from bson import ObjectId
from dateutil.parser import isoparse
from mongoengine.queryset.visitor import Q

from api.core import core_logger
from api.models import (
    Admin,
    Event,
    EventNotificationJob,
    Hub,
    MenteeProfile,
    MentorProfile,
    PartnerProfile,
    Support,
)
from api.utils.constants import Account
from api.utils.translate import get_all_translations


STAFF_ROLES = {Account.ADMIN.value}
PROPOSAL_ROLES = {Account.MENTOR.value, Account.MENTEE.value}
AUDIENCE_ROLES = {
    Account.MENTOR.value,
    Account.MENTEE.value,
    Account.PARTNER.value,
    Account.HUB.value,
}


def queue_event_review_notifications(event):
    from api.utils.event_review_notifications import queue_event_review_notifications

    return queue_event_review_notifications(event)


class EventWorkflowError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


@dataclass(frozen=True)
class EventActor:
    role: int
    uid: str
    profile_id: str
    kind: str
    hub_id: str = None
    partner_id: str = None

    @property
    def is_staff(self):
        return self.role in STAFF_ROLES


def _first_by_uid(model, uid, fields):
    return model.objects(firebase_uid=uid).only(*fields).first()


def resolve_event_actor(claims):
    try:
        role = int(claims.get("role"))
    except (TypeError, ValueError):
        raise EventWorkflowError("Invalid account role", 401)

    uid = claims.get("uid")
    if not uid:
        raise EventWorkflowError("Invalid authenticated user", 401)

    if role == Account.ADMIN.value:
        profile = _first_by_uid(Admin, uid, ("id",))
        kind = "staff"
    elif role == Account.SUPPORT.value:
        profile = _first_by_uid(Support, uid, ("id",))
        kind = "staff"
    elif role == Account.MENTOR.value:
        profile = _first_by_uid(MentorProfile, uid, ("id",))
        kind = "mentor"
    elif role == Account.MENTEE.value:
        profile = _first_by_uid(MenteeProfile, uid, ("id",))
        kind = "mentee"
    elif role == Account.PARTNER.value:
        profile = _first_by_uid(PartnerProfile, uid, ("id", "hub_id"))
        kind = "partner"
    elif role == Account.HUB.value:
        profile = _first_by_uid(Hub, uid, ("id",))
        if profile:
            return EventActor(role, uid, str(profile.id), "hub", hub_id=str(profile.id))
        profile = _first_by_uid(PartnerProfile, uid, ("id", "hub_id"))
        kind = "partner"
    else:
        raise EventWorkflowError("This account cannot manage events", 403)

    if not profile:
        raise EventWorkflowError("Account profile not found", 403)

    partner_id = str(profile.id) if kind == "partner" else None
    hub_id = getattr(profile, "hub_id", None) if kind == "partner" else None
    return EventActor(role, uid, str(profile.id), kind, hub_id, partner_id)


def _event_status(event):
    return event.status or "published"


def _event_scope(event):
    if event.scope_type and event.scope_id:
        return event.scope_type, str(event.scope_id)
    if event.hub_id:
        return "hub", str(event.hub_id)
    return event.scope_type or "global", None


def _requested_scope(actor, data):
    requested_type = data.get("scope_type")
    requested_id = data.get("scope_id")

    if actor.kind == "partner":
        if requested_type and (
            requested_type != "partner"
            or (requested_id and str(requested_id) != actor.partner_id)
        ):
            raise EventWorkflowError(
                "Partners can only create events for their own community", 403
            )
        return "partner", actor.partner_id
    if actor.kind == "hub":
        if requested_type and (
            requested_type != "hub"
            or (requested_id and str(requested_id) != actor.hub_id)
        ):
            raise EventWorkflowError(
                "Hubs can only create events for their own community", 403
            )
        return "hub", actor.hub_id
    if actor.role in PROPOSAL_ROLES:
        if requested_type and requested_type != "global":
            raise EventWorkflowError("Event proposals must use the global scope", 403)
        return "global", None

    if not requested_type:
        return "global", None

    if requested_type not in {"global", "hub", "partner"}:
        raise EventWorkflowError("Invalid event scope")
    if requested_type != "global" and not requested_id:
        raise EventWorkflowError("A community must be selected")
    if requested_type == "global":
        return "global", None
    if requested_id and not ObjectId.is_valid(str(requested_id)):
        raise EventWorkflowError("Invalid community")
    if requested_type == "hub" and not Hub.objects(id=requested_id).only("id").first():
        raise EventWorkflowError("Hub not found")
    if (
        requested_type == "partner"
        and not PartnerProfile.objects(id=requested_id).only("id").first()
    ):
        raise EventWorkflowError("Partner not found")
    return requested_type, str(requested_id) if requested_id else None


def can_publish_event(actor, event):
    if actor.is_staff:
        return True
    scope_type, scope_id = _event_scope(event)
    if actor.kind == "partner":
        return scope_type == "partner" and scope_id == actor.partner_id
    if actor.kind == "hub":
        return scope_type == "hub" and scope_id == actor.hub_id
    return False


def can_edit_event(actor, event):
    if actor.is_staff:
        return True
    if (
        _event_status(event) in {"draft", "rejected"}
        and event.created_by_uid
        and event.created_by_uid == actor.uid
    ):
        return True
    return _event_status(event) != "cancelled" and can_publish_event(actor, event)


def can_cancel_event(actor, event):
    status = _event_status(event)
    if status == "cancelled":
        return False
    if status == "published":
        return actor.is_staff or can_publish_event(actor, event)
    is_creator = bool(event.created_by_uid and event.created_by_uid == actor.uid)
    return actor.is_staff or is_creator or can_publish_event(actor, event)


def _assigned_ids(partners, field):
    ids = set()
    for partner in partners:
        for assigned in getattr(partner, field, None) or []:
            if assigned.get("id"):
                ids.add(str(assigned["id"]))
    return ids


def _partners_for_scope(scope_type, scope_id):
    if scope_type == "partner":
        partner = PartnerProfile.objects(id=scope_id).first()
        return [partner] if partner else []
    if scope_type == "hub":
        return list(PartnerProfile.objects(hub_id=scope_id))
    return []


def _profile_is_in_scope(actor, scope_type, scope_id):
    if scope_type == "global":
        return True
    if actor.kind == "hub":
        return scope_type == "hub" and actor.hub_id == scope_id
    if actor.kind == "partner":
        if scope_type == "partner":
            return actor.partner_id == scope_id
        return scope_type == "hub" and actor.hub_id == scope_id

    partners = _partners_for_scope(scope_type, scope_id)
    field = "assign_mentors" if actor.kind == "mentor" else "assign_mentees"
    return actor.profile_id in _assigned_ids(partners, field)


def can_view_event(actor, event):
    status = _event_status(event)
    if actor.is_staff:
        return True
    if status != "published":
        return bool(event.created_by_uid == actor.uid) or can_publish_event(
            actor, event
        )
    if actor.role not in (event.role or []):
        return False
    scope_type, scope_id = _event_scope(event)
    if (
        scope_type == "hub"
        and event.partner_ids
        and actor.kind == "partner"
        and actor.partner_id not in event.partner_ids
    ):
        return False
    return _profile_is_in_scope(actor, scope_type, scope_id)


def _profile_summary(profile, role):
    image = getattr(profile, "image", None)
    return {
        "id": str(profile.id),
        "role": role,
        "name": getattr(profile, "name", None)
        or getattr(profile, "person_name", None)
        or getattr(profile, "organization", None)
        or "MENTEE",
        "image_url": image.url if image else None,
    }


def _creator_summary(event):
    role = event.creator_role
    profile = None
    if event.created_by_uid:
        model = {
            Account.ADMIN.value: Admin,
            Account.SUPPORT.value: Support,
            Account.MENTOR.value: MentorProfile,
            Account.MENTEE.value: MenteeProfile,
            Account.PARTNER.value: PartnerProfile,
            Account.HUB.value: Hub,
        }.get(role)
        if model:
            profile = model.objects(firebase_uid=event.created_by_uid).first()
    if not profile and event.user_id:
        for model in (
            Admin,
            MentorProfile,
            MenteeProfile,
            PartnerProfile,
            Hub,
            Support,
        ):
            profile = model.objects(id=event.user_id).first()
            if profile:
                break
    if not profile:
        return {"id": str(event.user_id), "role": role, "name": "MENTEE"}

    return _profile_summary(profile, role)


def serialize_event(event, lang="en-US", actor=None, creator=None):
    result = json.loads(event.to_json())
    result["status"] = _event_status(event)
    scope_type, scope_id = _event_scope(event)
    result["scope_type"] = scope_type
    result["scope_id"] = scope_id
    result["creator"] = creator or _creator_summary(event)
    result["audience_roles"] = list(event.role or [])
    if lang and lang != "en-US":
        result["name"] = (event.titleTranslated or {}).get(lang, event.title)
        result["description"] = (event.descriptionTranslated or {}).get(
            lang, event.description
        )
    if actor:
        result["permissions"] = {
            "edit": can_edit_event(actor, event),
            "publish": can_publish_event(actor, event),
            "submit": bool(
                actor.role in PROPOSAL_ROLES
                and event.created_by_uid == actor.uid
                and _event_status(event) in {"draft", "rejected"}
            ),
            "review": actor.is_staff and _event_status(event) == "pending_review",
            "cancel": can_cancel_event(actor, event),
        }
    return result


def serialize_events(events, lang="en-US", actor=None):
    event_list = list(events)
    profile_ids_by_role = {}
    fallback_profile_ids = set()
    known_roles = {
        Account.ADMIN.value,
        Account.MENTOR.value,
        Account.MENTEE.value,
        Account.PARTNER.value,
        Account.HUB.value,
        Account.SUPPORT.value,
    }
    for event in event_list:
        if not event.user_id:
            continue
        if event.creator_role in known_roles:
            profile_ids_by_role.setdefault(event.creator_role, set()).add(event.user_id)
        else:
            fallback_profile_ids.add(event.user_id)

    profiles_by_id = {}
    for role, model in (
        (Account.ADMIN.value, Admin),
        (Account.MENTOR.value, MentorProfile),
        (Account.MENTEE.value, MenteeProfile),
        (Account.PARTNER.value, PartnerProfile),
        (Account.HUB.value, Hub),
        (Account.SUPPORT.value, Support),
    ):
        profile_ids = set(profile_ids_by_role.get(role, set()))
        if model is PartnerProfile:
            profile_ids.update(profile_ids_by_role.get(Account.HUB.value, set()))
        profile_ids.update(fallback_profile_ids)
        if not profile_ids:
            continue
        for profile in model.objects(id__in=list(profile_ids)):
            profiles_by_id[str(profile.id)] = _profile_summary(profile, role)

    result = []
    for event in event_list:
        creator = profiles_by_id.get(str(event.user_id)) or {
            "id": str(event.user_id),
            "role": event.creator_role,
            "name": "MENTEE",
        }
        if creator and event.creator_role is not None:
            creator = {**creator, "role": event.creator_role}
        result.append(serialize_event(event, lang=lang, actor=actor, creator=creator))
    return result


def list_events(actor, view="published", status=None):
    if view == "review":
        if not actor.is_staff:
            raise EventWorkflowError("Forbidden", 403)
        query = Event.objects(status=status or "pending_review")
    elif view == "mine":
        query = Event.objects(created_by_uid=actor.uid)
        if status:
            query = query.filter(status=status)
    elif view == "community":
        if actor.kind == "partner":
            query = Event.objects(
                Q(scope_type="partner", scope_id=actor.partner_id)
                | Q(created_by_uid=actor.uid)
            )
        elif actor.kind == "hub":
            query = Event.objects(
                Q(scope_type="hub", scope_id=actor.hub_id) | Q(created_by_uid=actor.uid)
            )
        elif actor.is_staff:
            query = Event.objects()
        else:
            raise EventWorkflowError("Forbidden", 403)
        if status:
            query = query.filter(status=status)
    elif view == "published":
        query = Event.objects(Q(status="published") | Q(status__exists=False))
    else:
        raise EventWorkflowError("Invalid event view")

    if view == "community":
        return [
            event
            for event in query.order_by("-start_datetime")
            if can_edit_event(actor, event) or event.created_by_uid == actor.uid
        ]
    return [
        event
        for event in query.order_by("-start_datetime")
        if can_view_event(actor, event)
    ]


def _validated_audience_roles(data):
    roles = data.get("audience_roles", data.get("role")) or []
    try:
        roles = sorted({int(role) for role in roles})
    except (TypeError, ValueError):
        raise EventWorkflowError("Invalid audience")
    if not roles or not set(roles).issubset(AUDIENCE_ROLES):
        raise EventWorkflowError("Select at least one valid audience")
    return roles


def _validate_event_data(data):
    title = (data.get("title") or "").strip()
    roles = _validated_audience_roles(data)
    if not title:
        raise EventWorkflowError("Title is required")
    try:
        start = isoparse(data.get("start_datetime"))
        end = isoparse(data.get("end_datetime"))
    except (TypeError, ValueError):
        raise EventWorkflowError("Start and end times are required")
    if end < start:
        raise EventWorkflowError("End time must be after start time")
    url = (data.get("url") or "").strip()
    if url and not urlparse(url).scheme:
        url = f"https://{url}"
    parsed_url = urlparse(url)
    if url and (parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc):
        raise EventWorkflowError("Enter a valid event URL")
    return title, roles, start, end, url


def _apply_event_data(event, actor, data, creating=False):
    title, roles, start, end, url = _validate_event_data(data)
    if not creating and "scope_type" not in data:
        scope_type, scope_id = _event_scope(event)
    else:
        scope_type, scope_id = _requested_scope(actor, data)
    description = data.get("description") or None
    title_changed = creating or event.title != title
    description_changed = creating or event.description != description
    event.title = title
    if title_changed:
        event.titleTranslated = get_all_translations(title)
    event.description = description
    if description_changed:
        event.descriptionTranslated = (
            get_all_translations(description) if description else None
        )
    event.role = roles
    event.start_datetime = start
    event.end_datetime = end
    event.url = url or None
    event.scope_type = scope_type
    event.scope_id = scope_id
    event.hub_id = scope_id if scope_type == "hub" else None
    event.partner_ids = [scope_id] if scope_type == "partner" else []
    event.updated_at = datetime.utcnow()
    if creating:
        event.user_id = ObjectId(actor.profile_id)
        event.creator_role = actor.role
        event.created_by_uid = actor.uid
        event.created_at = datetime.utcnow()
        event.date_submitted = datetime.utcnow()


def create_event(actor, data):
    event = Event(status="draft")
    _apply_event_data(event, actor, data, creating=True)
    event.save()
    return event


def update_event(actor, event, data):
    if not can_edit_event(actor, event):
        raise EventWorkflowError("Forbidden", 403)
    status = _event_status(event)
    if status == "pending_review":
        raise EventWorkflowError("Pending events cannot be edited", 409)
    if status == "cancelled":
        raise EventWorkflowError("Cancelled events cannot be edited", 409)
    _apply_event_data(event, actor, data)
    if status == "published" and not can_publish_event(actor, event):
        event.status = "draft"
        event.published_at = None
        event.published_by_uid = None
        event.notification_requested = False
        event.notification_status = "not_requested"
        event.notification_recipient_count = 0
    if status == "rejected":
        event.status = "draft"
        event.review_feedback = None
        event.reviewed_at = None
        event.reviewed_by_uid = None
    event.save()
    return event


def submit_event(actor, event):
    if actor.role not in PROPOSAL_ROLES:
        raise EventWorkflowError(
            "Only mentors and mentees can submit event proposals", 403
        )
    if event.created_by_uid != actor.uid:
        raise EventWorkflowError("Forbidden", 403)
    if _event_status(event) not in {"draft", "rejected"}:
        raise EventWorkflowError("Only drafts or rejected events can be submitted", 409)
    previous_submission_version = event.submission_version or 0
    event.submission_version = previous_submission_version + 1
    try:
        queue_event_review_notifications(event)
    except Exception:
        event.submission_version = previous_submission_version
        core_logger.exception(
            "Could not queue admin notifications for event %s",
            getattr(event, "id", "unknown"),
        )
        raise EventWorkflowError(
            "The proposal could not be submitted. Please try again.", 503
        )

    event.status = "pending_review"
    event.submitted_at = datetime.utcnow()
    event.review_feedback = None
    event.updated_at = datetime.utcnow()
    event.save()
    return event


def review_event(actor, event, decision, feedback=None):
    if not actor.is_staff:
        raise EventWorkflowError("Forbidden", 403)
    if _event_status(event) != "pending_review":
        raise EventWorkflowError("This event is not awaiting review", 409)
    if decision not in {"approve", "reject"}:
        raise EventWorkflowError("Decision must be approve or reject")
    if decision == "reject" and not (feedback or "").strip():
        raise EventWorkflowError("Feedback is required when rejecting")
    event.reviewed_by_uid = actor.uid
    event.reviewed_at = datetime.utcnow()
    event.review_feedback = (feedback or "").strip() or None
    event.review_history = list(event.review_history or [])
    event.review_history.append(
        {
            "decision": decision,
            "feedback": event.review_feedback,
            "reviewed_by_uid": actor.uid,
            "reviewed_at": event.reviewed_at,
        }
    )
    event.updated_at = datetime.utcnow()
    if decision == "reject":
        event.status = "rejected"
        event.save()
    return event


def _recipient_profiles(event):
    scope_type, scope_id = _event_scope(event)
    partners = _partners_for_scope(scope_type, scope_id)
    mentor_ids = _assigned_ids(partners, "assign_mentors")
    mentee_ids = _assigned_ids(partners, "assign_mentees")

    recipients = []
    for role in event.role or []:
        if role == Account.MENTOR.value:
            query = MentorProfile.objects()
            if scope_type != "global":
                query = query.filter(id__in=list(mentor_ids))
            recipients.extend((role, item) for item in query)
        elif role == Account.MENTEE.value:
            query = MenteeProfile.objects()
            if scope_type != "global":
                query = query.filter(id__in=list(mentee_ids))
            recipients.extend((role, item) for item in query)
        elif role == Account.PARTNER.value:
            query = PartnerProfile.objects()
            if scope_type == "partner":
                query = query.filter(id=scope_id)
            elif scope_type == "hub":
                query = query.filter(hub_id=scope_id)
            recipients.extend((role, item) for item in query)
        elif role == Account.HUB.value:
            query = Hub.objects()
            if scope_type == "hub":
                query = query.filter(id=scope_id)
            elif scope_type == "partner":
                partner = partners[0] if partners else None
                query = (
                    query.filter(id=partner.hub_id)
                    if partner and partner.hub_id
                    else []
                )
            recipients.extend((role, item) for item in query)
    return recipients


def event_recipients(event):
    recipients = []
    seen = set()
    for role, profile in _recipient_profiles(event):
        email = (getattr(profile, "email", None) or "").strip().lower()
        if not email or email in seen:
            continue
        if getattr(profile, "email_notifications", None) is False:
            continue
        if role == Account.MENTOR.value and getattr(profile, "paused_flag", False):
            continue
        seen.add(email)
        recipients.append(
            {
                "email": email,
                "preferred_language": getattr(profile, "preferred_language", None)
                or "en-US",
                "timezone": getattr(profile, "timezone", None),
                "role": role,
            }
        )
    return recipients


def audience_preview(actor, data):
    roles = _validated_audience_roles(data)
    scope_type, scope_id = _requested_scope(actor, data)
    preview_event = SimpleNamespace(
        role=roles,
        scope_type=scope_type,
        scope_id=scope_id,
        hub_id=scope_id if scope_type == "hub" else None,
    )
    recipients = event_recipients(preview_event)
    counts_by_role = Counter(str(recipient["role"]) for recipient in recipients)
    return {
        "recipient_count": len(recipients),
        "recipient_counts_by_role": dict(counts_by_role),
        "audience_roles": roles,
        "scope_type": scope_type,
        "scope_id": scope_id,
    }


def publication_preview(actor, event):
    if not can_publish_event(actor, event):
        raise EventWorkflowError("This event requires administrator approval", 403)
    allowed_statuses = {"draft", "published"}
    if actor.is_staff:
        allowed_statuses.add("pending_review")
    if _event_status(event) not in allowed_statuses:
        raise EventWorkflowError("This event is not ready to publish", 409)
    recipients = event_recipients(event)
    return {
        "recipient_count": len(recipients),
        "audience_roles": list(event.role or []),
        "scope_type": _event_scope(event)[0],
        "scope_id": _event_scope(event)[1],
    }


def publish_event(actor, event, notify):
    if not can_publish_event(actor, event):
        raise EventWorkflowError("This event requires administrator approval", 403)
    allowed_statuses = {"draft", "published"}
    if actor.is_staff:
        allowed_statuses.add("pending_review")
    if _event_status(event) not in allowed_statuses:
        raise EventWorkflowError("This event is not ready to publish", 409)
    if _event_status(event) == "published" and notify:
        raise EventWorkflowError(
            "Notifications were already decided for this publication", 409
        )

    current_status = _event_status(event)
    previous_publication_version = event.publication_version or 0
    publication_version = previous_publication_version
    if current_status != "published":
        publication_version += 1
    recipients = event_recipients(event) if notify else []
    now = datetime.utcnow()
    if notify:
        target_url = (
            os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
            + "/event/"
            + str(event.id)
        )
        try:
            EventNotificationJob.objects(
                event_id=event.id,
                publication_version=publication_version,
            ).modify(
                upsert=True,
                new=True,
                set__status="staged",
                set__recipients=recipients,
                set__target_url=target_url,
                set__created_at=now,
                set__sent_recipients=[],
                set__sent_count=0,
                set__failed_count=0,
                set__errors=[],
                unset__started_at=1,
                unset__completed_at=1,
            )
        except Exception:
            core_logger.exception(
                "Could not queue audience notifications for event %s", event.id
            )
            raise EventWorkflowError(
                "The event could not be published. Please try again.", 503
            )

    event.publication_version = publication_version
    event.status = "published"
    event.published_by_uid = actor.uid
    event.published_at = event.published_at or now
    event.updated_at = now
    event.notification_requested = bool(notify)
    event.notification_recipient_count = len(recipients)
    event.notification_status = "queued" if notify else "not_requested"
    event.save()
    return event


def cancel_event(actor, event):
    if not can_cancel_event(actor, event):
        raise EventWorkflowError("Forbidden", 403)
    event.status = "cancelled"
    event.cancelled_by_uid = actor.uid
    event.cancelled_at = datetime.utcnow()
    event.updated_at = datetime.utcnow()
    event.save()
    return event
