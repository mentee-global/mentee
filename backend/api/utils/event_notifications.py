import re
from datetime import datetime, timedelta, timezone

from mongoengine.queryset.visitor import Q

from api.core import logger
from api.models import Event, EventNotificationJob
from api.utils.constants import EVENT_TEMPLATE, TRANSLATIONS
from api.utils.request_utils import send_email


ROLE_NAMES = {1: "MENTOR", 2: "MENTEE", 3: "PARTNER", 6: "HUB"}


def _event_period(event, timezone_value):
    target_timezone = timezone.utc
    match = re.fullmatch(r"UTC([+-]\d{2}):(\d{2})", timezone_value or "")
    if match:
        hours = int(match.group(1))
        minutes = int(match.group(2))
        if hours < 0:
            minutes = -minutes
        target_timezone = timezone(timedelta(hours=hours, minutes=minutes))

    def format_datetime(value):
        if not value:
            return ""
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(target_timezone).strftime("%m-%d-%Y %I:%M%p %Z")

    return f"{format_datetime(event.start_datetime)} ~ {format_datetime(event.end_datetime)}"


def _deliver_job(job):
    event = Event.objects(id=job.event_id).first()
    if not event:
        job.update(
            set__status="failed",
            set__errors=["Event no longer exists"],
            set__completed_at=datetime.utcnow(),
        )
        return True
    if event.status != "published":
        created_at = getattr(job, "created_at", datetime.utcnow())
        if event.status in {"draft", "pending_review"} and created_at > (
            datetime.utcnow() - timedelta(minutes=5)
        ):
            job.update(set__status="staged", unset__started_at=1)
            return False
        job.update(
            set__status="cancelled",
            set__completed_at=datetime.utcnow(),
            unset__started_at=1,
        )
        event.update(set__notification_status="cancelled")
        return True

    sent_recipients = set(getattr(job, "sent_recipients", None) or [])
    errors = []
    role_name = ", ".join(
        ROLE_NAMES[role] for role in event.role or [] if role in ROLE_NAMES
    )
    for recipient in job.recipients:
        if recipient["email"] in sent_recipients:
            continue
        job.update(set__started_at=datetime.utcnow())
        language = recipient.get("preferred_language") or "en-US"
        translations = TRANSLATIONS.get(language, TRANSLATIONS["en-US"])
        success, message = send_email(
            recipient=recipient["email"],
            data={
                "link": job.target_url,
                "eventtitle": event.title,
                "eventdate": _event_period(event, recipient.get("timezone")),
                "role": ROLE_NAMES.get(recipient.get("role"), role_name),
                language: True,
                "subject": translations["new_event"],
            },
            template_id=EVENT_TEMPLATE,
        )
        if success:
            sent_recipients.add(recipient["email"])
            job.update(
                add_to_set__sent_recipients=recipient["email"],
                set__sent_count=len(sent_recipients),
            )
        else:
            errors.append(f"{recipient['email']}: {message}"[:500])

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
    event.update(set__notification_status=status)
    return True


def process_next_event_notification():
    stale_before = datetime.utcnow() - timedelta(minutes=10)
    job = EventNotificationJob.objects(
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
    Event.objects(id=job.event_id).update(set__notification_status="processing")
    try:
        return _deliver_job(job)
    except Exception as error:
        logger.exception("Event notification job failed")
        job.update(
            set__status="failed",
            push__errors=str(error)[:500],
            set__completed_at=datetime.utcnow(),
        )
        Event.objects(id=job.event_id).update(set__notification_status="failed")
    return True
