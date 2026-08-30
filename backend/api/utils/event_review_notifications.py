import os
from datetime import datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId
from mongoengine.queryset.visitor import Q

from api.core import logger
from api.models import (
    Admin,
    AdminEventNotification,
    Event,
    EventReviewNotificationJob,
    Hub,
    MenteeProfile,
    MentorProfile,
    PartnerProfile,
    Support,
)
from api.utils.constants import ALERT_TO_ADMINS, Account
from api.utils.request_utils import send_email


CREATOR_MODELS = {
    Account.ADMIN.value: Admin,
    Account.SUPPORT.value: Support,
    Account.MENTOR.value: MentorProfile,
    Account.MENTEE.value: MenteeProfile,
    Account.PARTNER.value: PartnerProfile,
    Account.HUB.value: Hub,
}

ROLE_NAMES = {
    Account.ADMIN.value: "Administrator",
    Account.SUPPORT.value: "Support",
    Account.MENTOR.value: "Mentor",
    Account.MENTEE.value: "Mentee",
    Account.PARTNER.value: "Partner",
    Account.HUB.value: "Hub",
}


class EventReviewNotificationError(Exception):
    def __init__(self, message, status=400):
        self.message = message
        self.status = status
        super().__init__(message)


def event_review_recipients():
    selected = list(Admin.objects(receive_event_review_alerts=True))
    return selected or list(Admin.objects())


def event_review_recipient_options():
    admins = list(
        Admin.objects().only(
            "id",
            "name",
            "email",
            "receive_event_review_alerts",
        )
    )
    configured = any(admin.receive_event_review_alerts for admin in admins)
    selected = [
        admin for admin in admins if admin.receive_event_review_alerts or not configured
    ]
    return {
        "admins": [
            {
                "id": str(admin.id),
                "name": admin.name,
                "email": admin.email,
            }
            for admin in admins
        ],
        "selected_admin_ids": [str(admin.id) for admin in selected],
        "uses_default": not configured,
    }


def set_event_review_recipient_ids(admin_ids):
    if not isinstance(admin_ids, list) or not admin_ids:
        raise EventReviewNotificationError("Select at least one administrator")

    try:
        object_ids = list(dict.fromkeys(ObjectId(admin_id) for admin_id in admin_ids))
    except (InvalidId, TypeError):
        raise EventReviewNotificationError("Invalid administrator selection")

    selected = list(Admin.objects(id__in=object_ids).only("id"))
    if len(selected) != len(object_ids):
        raise EventReviewNotificationError("Invalid administrator selection")

    Admin.objects(id__in=object_ids).update(set__receive_event_review_alerts=True)
    Admin.objects(id__nin=object_ids).update(set__receive_event_review_alerts=False)
    return event_review_recipient_options()


def _serialize_admin_notification(notification):
    return {
        "id": str(notification.id),
        "event_id": str(notification.event_id),
        "title": notification.title,
        "message": notification.message,
        "link": notification.link,
        "created_at": notification.created_at.isoformat(),
        "read_at": (notification.read_at.isoformat() if notification.read_at else None),
    }


def admin_event_notifications(admin_uid, limit=20):
    unread_notifications = list(
        AdminEventNotification.objects(recipient_uid=admin_uid, read_at=None)
        .order_by("-created_at")
        .limit(limit)
    )
    remaining = max(0, limit - len(unread_notifications))
    read_notifications = (
        list(
            AdminEventNotification.objects(
                recipient_uid=admin_uid,
                read_at__ne=None,
            )
            .order_by("-created_at")
            .limit(remaining)
        )
        if remaining
        else []
    )
    notifications = unread_notifications + read_notifications
    return {
        "notifications": [
            _serialize_admin_notification(notification)
            for notification in notifications
        ],
        "unread_count": AdminEventNotification.objects(
            recipient_uid=admin_uid,
            read_at=None,
        ).count(),
    }


def mark_admin_event_notification_read(admin_uid, notification_id):
    try:
        object_id = ObjectId(notification_id)
    except (InvalidId, TypeError):
        raise EventReviewNotificationError("Notification not found", 404)

    notification = AdminEventNotification.objects(
        id=object_id,
        recipient_uid=admin_uid,
    ).first()
    if not notification:
        raise EventReviewNotificationError("Notification not found", 404)
    if not notification.read_at:
        notification.read_at = datetime.utcnow()
        notification.save()
    return _serialize_admin_notification(notification)


def mark_all_admin_event_notifications_read(admin_uid):
    return AdminEventNotification.objects(
        recipient_uid=admin_uid,
        read_at=None,
    ).update(set__read_at=datetime.utcnow())


def _creator_details(event):
    model = CREATOR_MODELS.get(event.creator_role)
    profile = model.objects(id=event.user_id).first() if model else None
    return {
        "name": (
            getattr(profile, "name", None)
            or getattr(profile, "person_name", None)
            or getattr(profile, "organization", None)
            or "MENTEE member"
        ),
        "email": getattr(profile, "email", None) or "",
        "role": ROLE_NAMES.get(event.creator_role, "Member"),
    }


def queue_event_review_notifications(event):
    recipients = event_review_recipients()
    if not recipients:
        return 0

    creator = _creator_details(event)
    target_url = (
        os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
        + "/events?tab=review"
    )
    now = datetime.utcnow()
    recipient_data = [
        {
            "admin_id": str(recipient.id),
            "uid": recipient.firebase_uid,
            "name": recipient.name,
            "email": recipient.email,
        }
        for recipient in recipients
    ]

    EventReviewNotificationJob.objects(
        event_id=event.id,
        submission_version=event.submission_version,
    ).modify(
        upsert=True,
        new=True,
        set__status="staged",
        set__recipients=recipient_data,
        set__creator=creator,
        set__target_url=target_url,
        set__created_at=now,
        set__sent_recipients=[],
        set__sent_count=0,
        set__failed_count=0,
        set__errors=[],
        unset__started_at=1,
        unset__completed_at=1,
    )
    return len(recipient_data)


def _deliver_event_review_notification(job):
    event = Event.objects(id=job.event_id).first()
    if not event:
        job.update(
            set__status="failed",
            set__errors=["Event no longer exists"],
            set__completed_at=datetime.utcnow(),
        )
        return True
    if event.status != "pending_review":
        created_at = getattr(job, "created_at", datetime.utcnow())
        if event.status in {"draft", "rejected"} and created_at > (
            datetime.utcnow() - timedelta(minutes=5)
        ):
            job.update(set__status="staged", unset__started_at=1)
            return False
        job.update(
            set__status="cancelled",
            set__completed_at=datetime.utcnow(),
            unset__started_at=1,
        )
        return True

    now = datetime.utcnow()
    message = f'{job.creator["name"]} submitted “{event.title}” for review.'
    for recipient in job.recipients:
        AdminEventNotification.objects(
            recipient_uid=recipient["uid"],
            event_id=job.event_id,
            submission_version=job.submission_version,
        ).modify(
            upsert=True,
            new=True,
            set_on_insert__recipient_admin_id=ObjectId(recipient["admin_id"]),
            set_on_insert__title="Event proposal needs review",
            set_on_insert__message=message,
            set_on_insert__link="/events?tab=review",
            set_on_insert__created_at=now,
        )

    sent_recipients = set(getattr(job, "sent_recipients", None) or [])
    errors = []
    for recipient in job.recipients:
        if recipient["email"] in sent_recipients:
            continue
        job.update(set__started_at=datetime.utcnow())
        subject = f"Event proposal needs review: {event.title}"
        success, message = send_email(
            recipient=recipient["email"],
            subject=subject,
            template_id=ALERT_TO_ADMINS,
            data={
                "subject": subject,
                "name": job.creator["name"],
                "email": job.creator["email"],
                "role": job.creator["role"],
                "action": f"submitted the event “{event.title}” for review",
                "event_title": event.title,
                "admin_name": recipient.get("name") or "Administrator",
                "link": job.target_url,
                "en-US": True,
            },
        )
        if success:
            sent_recipients.add(recipient["email"])
            job.update(
                add_to_set__sent_recipients=recipient["email"],
                set__sent_count=len(sent_recipients),
            )
        else:
            errors.append(f'{recipient["email"]}: {message}'[:500])

    status = "completed" if not errors else "completed_with_errors"
    if not sent_recipients and errors:
        status = "failed"
    job.update(
        set__status=status,
        set__sent_count=len(sent_recipients),
        set__failed_count=len(errors),
        set__errors=errors[:100],
        set__completed_at=datetime.utcnow(),
    )
    return True


def process_next_event_review_notification():
    stale_before = datetime.utcnow() - timedelta(minutes=10)
    job = EventReviewNotificationJob.objects(
        Q(status="staged")
        | Q(status="queued")
        | Q(status="processing", started_at__lt=stale_before)
    ).modify(
        new=True,
        set__status="processing",
        set__started_at=datetime.utcnow(),
    )
    if not job:
        return False
    try:
        return _deliver_event_review_notification(job)
    except Exception as error:
        logger.exception("Event review notification job failed")
        job.update(
            set__status="failed",
            push__errors=str(error)[:500],
            set__completed_at=datetime.utcnow(),
        )
    return True
