import json
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from html import escape
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId
from bson.errors import InvalidId
from mongoengine.errors import NotUniqueError

from api import socketio
from api.core import logger
from api.models import (
    Admin,
    Availability,
    DirectMessage,
    FlaggedTerm,
    GroupMessage,
    Hub,
    MenteeProfile,
    MentorProfile,
    MessageFlag,
    PartnerGroupMessage,
    PartnerProfile,
)
from api.utils.request_utils import send_email_html


DEFAULT_MESSAGE_FLAGGING_MODEL = "gpt-5-nano"
SEVERITY_ORDER = {"low": 1, "medium": 2, "high": 3}

SOURCE_DIRECT = "direct"
SOURCE_GROUP = "group"
SOURCE_PARTNER_GROUP = "partner_group"

SOURCE_COLLECTIONS = {
    SOURCE_DIRECT: "direct_message",
    SOURCE_GROUP: "group_message",
    SOURCE_PARTNER_GROUP: "partner_group_message",
}


class ModerationUnavailable(Exception):
    pass


@dataclass
class ModerationResult:
    flagged: bool
    severity: str = "low"
    categories: List[str] = field(default_factory=list)
    reason: str = ""
    language: Optional[str] = None
    confidence: Optional[float] = None
    term_matches: List[Dict[str, Any]] = field(default_factory=list)
    model: str = ""
    response: Dict[str, Any] = field(default_factory=dict)


def message_flagging_enabled() -> bool:
    return os.environ.get("MESSAGE_FLAGGING_ENABLED", "true").lower() != "false"


def message_flagging_model() -> str:
    return os.environ.get(
        "OPENAI_MESSAGE_FLAGGING_MODEL", DEFAULT_MESSAGE_FLAGGING_MODEL
    )


def _parse_object_id(value: Any) -> Optional[ObjectId]:
    if isinstance(value, ObjectId):
        return value
    if value in (None, ""):
        return None
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        return None


def _parse_datetime(value: Any) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value
    if not value:
        return None
    if isinstance(value, dict) and "$date" in value:
        value = value["$date"]
    if isinstance(value, (int, float)):
        return datetime.utcfromtimestamp(value / 1000)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(
                tzinfo=None
            )
        except ValueError:
            return None
    return None


def _best_severity(values: List[str]) -> str:
    return max(values or ["low"], key=lambda item: SEVERITY_ORDER.get(item, 1))


def _safe_text(value: Any, max_length: int = 500) -> str:
    text = "" if value is None else str(value)
    text = " ".join(text.split())
    return text if len(text) <= max_length else text[: max_length - 3] + "..."


def scan_flagged_terms(text: str) -> List[Dict[str, Any]]:
    if not text:
        return []
    normalized = text.lower()
    matches = []
    for term in FlaggedTerm.objects(enabled=True):
        needle = (term.term or "").strip().lower()
        if needle and needle in normalized:
            matches.append(
                {
                    "term": term.term,
                    "language": term.language or "all",
                    "category": term.category or "custom",
                    "severity": term.severity or "medium",
                }
            )
    return matches


def _openai_schema() -> Dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "flagged": {"type": "boolean"},
            "severity": {"type": "string", "enum": ["low", "medium", "high"]},
            "categories": {
                "type": "array",
                "items": {"type": "string"},
                "maxItems": 8,
            },
            "reason": {"type": "string"},
            "language": {"type": ["string", "null"]},
            "confidence": {"type": ["number", "null"], "minimum": 0, "maximum": 1},
        },
        "required": [
            "flagged",
            "severity",
            "categories",
            "reason",
            "language",
            "confidence",
        ],
    }


def classify_message_with_openai(
    text: str, model: Optional[str] = None
) -> Dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ModerationUnavailable("OPENAI_API_KEY is required for message flagging")

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise ModerationUnavailable("openai package is not installed") from exc

    model = model or message_flagging_model()
    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You review platform messages for safety. Flag only genuine "
                    "policy concerns such as harassment, sexual content, threats, "
                    "self-harm encouragement, hate, exploitation, scams, or abusive "
                    "language. Prioritize English, Spanish, Portuguese, Arabic, and "
                    "Persian, but review the message in any other language if it is "
                    "written in a different language. Return concise JSON only."
                ),
            },
            {
                "role": "user",
                "content": f"Message to classify:\n{text}",
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "message_flag_result",
                "schema": _openai_schema(),
                "strict": True,
            }
        },
        max_output_tokens=300,
    )
    raw = getattr(response, "output_text", "") or "{}"
    return json.loads(raw)


def moderate_message_text(text: str, model: Optional[str] = None) -> ModerationResult:
    if not message_flagging_enabled():
        return ModerationResult(flagged=False)

    term_matches = scan_flagged_terms(text)
    ai_result = classify_message_with_openai(text, model=model)

    term_flagged = bool(term_matches)
    ai_flagged = bool(ai_result.get("flagged"))
    severity_values = [ai_result.get("severity") or "low"] + [
        match.get("severity") or "medium" for match in term_matches
    ]
    categories = list(
        dict.fromkeys(
            list(ai_result.get("categories") or [])
            + [match.get("category") or "custom" for match in term_matches]
        )
    )
    reason = ai_result.get("reason") or ""
    if term_flagged:
        matched = ", ".join(match["term"] for match in term_matches[:5])
        reason = f"{reason} Matched flagged term(s): {matched}.".strip()

    return ModerationResult(
        flagged=term_flagged or ai_flagged,
        severity=_best_severity(severity_values),
        categories=categories,
        reason=reason or "Potentially inappropriate message.",
        language=ai_result.get("language"),
        confidence=ai_result.get("confidence"),
        term_matches=term_matches,
        model=model or message_flagging_model(),
        response=ai_result,
    )


def _source_key(source_type: str, source_message_id: Optional[Any], origin: str) -> str:
    if source_message_id:
        return f"{source_type}:{source_message_id}"
    return f"{origin}:{source_type}:{uuid.uuid4()}"


def _sender_profile(sender_id: Any):
    oid = _parse_object_id(sender_id)
    if not oid:
        return None
    for model in (MentorProfile, MenteeProfile, PartnerProfile, Hub, Admin):
        profile = model.objects(id=oid).first()
        if profile:
            return profile
    return None


def sender_label(sender_id: Any) -> Dict[str, str]:
    profile = _sender_profile(sender_id)
    if not profile:
        return {"name": str(sender_id or "Unknown"), "email": ""}
    return {
        "name": getattr(profile, "name", None)
        or getattr(profile, "person_name", None)
        or getattr(profile, "email", "")
        or str(profile.id),
        "email": getattr(profile, "email", "") or "",
    }


def create_message_flag(
    *,
    source_type: str,
    body: str,
    sender_id: Any,
    moderation: ModerationResult,
    origin: str = "live",
    pending_payload: Optional[Dict[str, Any]] = None,
    source_message_id: Optional[Any] = None,
    title: Optional[str] = None,
    recipient_id: Optional[Any] = None,
    hub_user_id: Optional[Any] = None,
    parent_message_id: Optional[str] = None,
    message_read: bool = False,
    original_created_at: Optional[Any] = None,
    notify_admins: bool = True,
) -> Tuple[MessageFlag, bool]:
    source_key = _source_key(source_type, source_message_id, origin)
    existing = MessageFlag.objects(source_key=source_key).first()
    if existing:
        return existing, False

    flag = MessageFlag(
        source_key=source_key,
        source_type=source_type,
        source_collection=SOURCE_COLLECTIONS[source_type],
        source_message_id=_parse_object_id(source_message_id),
        origin=origin,
        status="pending",
        title=title,
        body=body,
        sender_id=_parse_object_id(sender_id),
        recipient_id=_parse_object_id(recipient_id),
        hub_user_id=_parse_object_id(hub_user_id),
        parent_message_id=parent_message_id,
        message_read=bool(message_read),
        original_created_at=_parse_datetime(original_created_at),
        pending_payload=pending_payload or {},
        severity=moderation.severity,
        categories=moderation.categories,
        reason=moderation.reason,
        language=moderation.language,
        confidence=moderation.confidence,
        term_matches=moderation.term_matches,
        openai_model=moderation.model,
        openai_response=moderation.response,
    )
    try:
        flag.save()
        created = True
    except NotUniqueError:
        return MessageFlag.objects(source_key=source_key).first(), False

    if notify_admins and flag.origin == "live" and _should_email_flag(flag):
        notify_admins_of_flag(flag)
    return flag, created


def _should_email_flag(flag: MessageFlag) -> bool:
    threshold = os.environ.get("MESSAGE_FLAGGING_EMAIL_SEVERITY", "high").lower()
    return SEVERITY_ORDER.get(flag.severity, 1) >= SEVERITY_ORDER.get(threshold, 3)


def notify_admins_of_flag(flag: MessageFlag) -> None:
    label = sender_label(flag.sender_id)
    subject = f"Mentee message held for review ({flag.severity})"
    frontend_url = os.environ.get("FRONT_BASE_URL") or os.environ.get(
        "FRONTEND_URL", "https://app.menteeglobal.org"
    )
    html = f"""
    <p>A {escape(flag.severity)} severity message was held for admin review.</p>
    <p><strong>Sender:</strong> {escape(label.get("name") or "")} {escape(label.get("email") or "")}</p>
    <p><strong>Type:</strong> {escape(flag.source_type)}</p>
    <p><strong>Reason:</strong> {escape(flag.reason)}</p>
    <p><strong>Message:</strong> {escape(_safe_text(flag.body, 800))}</p>
    <p><a href="{escape(frontend_url.rstrip('/'))}/admin/message-flags">Review flagged messages</a></p>
    """
    for admin in Admin.objects():
        ok, err = send_email_html(
            recipient=admin.email,
            subject=subject,
            html_content=html,
        )
        if not ok:
            logger.error(f"message_flag alert to {admin.email} failed: {err}")


def send_warning_to_sender(flag: MessageFlag, note: str = "") -> Tuple[bool, str]:
    label = sender_label(flag.sender_id)
    email = label.get("email")
    if not email:
        return False, "Sender email not found"
    html = f"""
    <p>Hi {escape(label.get("name") or "there")},</p>
    <p>A recent message you wrote on Mentee Global was reviewed by an administrator because it may not follow our communication guidelines.</p>
    <p>Please keep all communication respectful, safe, and appropriate for the platform.</p>
    {f'<p><strong>Admin note:</strong> {escape(note)}</p>' if note else ''}
    """
    ok, err = send_email_html(
        recipient=email,
        subject="A note about your Mentee Global message",
        html_content=html,
    )
    if ok:
        flag.warning_sent_at = datetime.utcnow()
        flag.warning_sent_to = email
        flag.updated_at = datetime.utcnow()
        flag.save()
    return ok, err


def build_direct_payload(
    data: Dict[str, Any], body_key: str = "body"
) -> Dict[str, Any]:
    return {
        "body": data.get(body_key) if body_key in data else data.get("message", ""),
        "message_read": data.get("message_read", False),
        "sender_id": data.get("sender_id") or data.get("user_id"),
        "recipient_id": data.get("recipient_id"),
        "created_at": data.get("time") or data.get("created_at") or datetime.utcnow(),
        "availabes_in_future": data.get("availabes_in_future"),
    }


def build_group_payload(msg: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "title": msg.get("title"),
        "body": msg.get("body", ""),
        "message_read": msg.get("message_read", False),
        "sender_id": msg.get("sender_id"),
        "hub_user_id": msg.get("hub_user_id"),
        "parent_message_id": msg.get("parent_message_id"),
        "created_at": msg.get("time") or msg.get("created_at") or datetime.utcnow(),
    }


def build_partner_group_payload(msg: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "body": msg.get("body", ""),
        "message_read": msg.get("message_read", False),
        "sender_id": msg.get("sender_id"),
        "parent_message_id": msg.get("parent_message_id"),
        "created_at": msg.get("time") or msg.get("created_at") or datetime.utcnow(),
    }


def flag_pending_message_if_needed(
    *,
    source_type: str,
    payload: Dict[str, Any],
    notify_admins: bool = True,
) -> Tuple[bool, Optional[MessageFlag], Optional[str]]:
    if not message_flagging_enabled():
        return False, None, None

    body = payload.get("body", "")
    try:
        moderation = moderate_message_text(body)
    except Exception as exc:
        logger.exception("message moderation failed")
        return False, None, str(exc)

    if not moderation.flagged:
        return False, None, None

    flag, _ = create_message_flag(
        source_type=source_type,
        body=body,
        sender_id=payload.get("sender_id"),
        recipient_id=payload.get("recipient_id"),
        hub_user_id=payload.get("hub_user_id"),
        title=payload.get("title"),
        parent_message_id=payload.get("parent_message_id"),
        message_read=payload.get("message_read", False),
        original_created_at=payload.get("created_at"),
        pending_payload=payload,
        moderation=moderation,
        origin="live",
        notify_admins=notify_admins,
    )
    return True, flag, None


def create_direct_message_from_payload(payload: Dict[str, Any]) -> DirectMessage:
    availabes_in_future = payload.get("availabes_in_future")
    if availabes_in_future:
        availabes_in_future = [
            Availability(
                start_time=(
                    availability.get("start_time", {}).get("$date")
                    if isinstance(availability.get("start_time"), dict)
                    else availability.get("start_time")
                ),
                end_time=(
                    availability.get("end_time", {}).get("$date")
                    if isinstance(availability.get("end_time"), dict)
                    else availability.get("end_time")
                ),
            )
            for availability in availabes_in_future
        ]
    message = DirectMessage(
        body=payload["body"],
        message_read=payload.get("message_read", False),
        sender_id=payload["sender_id"],
        recipient_id=payload["recipient_id"],
        created_at=_parse_datetime(payload.get("created_at")) or datetime.utcnow(),
        availabes_in_future=availabes_in_future,
    )
    message.save()
    socketio.emit(str(message.recipient_id), json.loads(message.to_json()))
    return message


def create_group_message_from_payload(payload: Dict[str, Any]) -> GroupMessage:
    message = GroupMessage(
        title=payload.get("title"),
        body=payload["body"],
        message_read=payload.get("message_read", False),
        sender_id=payload["sender_id"],
        hub_user_id=payload["hub_user_id"],
        parent_message_id=payload.get("parent_message_id"),
        created_at=_parse_datetime(payload.get("created_at")) or datetime.utcnow(),
    )
    message.save()
    socketio.emit(str(message.hub_user_id), json.loads(message.to_json()))
    return message


def create_partner_group_message_from_payload(
    payload: Dict[str, Any]
) -> PartnerGroupMessage:
    message = PartnerGroupMessage(
        body=payload["body"],
        message_read=payload.get("message_read", False),
        sender_id=payload["sender_id"],
        parent_message_id=payload.get("parent_message_id"),
        created_at=_parse_datetime(payload.get("created_at")) or datetime.utcnow(),
    )
    message.save()
    socketio.emit("group-partner", json.loads(message.to_json()))
    return message


def deliver_flagged_message(flag: MessageFlag):
    if flag.source_message_id:
        return None
    if flag.source_type == SOURCE_DIRECT:
        message = create_direct_message_from_payload(flag.pending_payload)
    elif flag.source_type == SOURCE_GROUP:
        message = create_group_message_from_payload(flag.pending_payload)
    elif flag.source_type == SOURCE_PARTNER_GROUP:
        message = create_partner_group_message_from_payload(flag.pending_payload)
    else:
        raise ValueError("Invalid message flag source type")

    flag.source_message_id = message.id
    flag.source_key = f"{flag.source_type}:{message.id}"
    flag.status = "allowed"
    flag.reviewed_at = datetime.utcnow()
    flag.updated_at = datetime.utcnow()
    flag.save()
    return message


def original_message_for_flag(flag: MessageFlag):
    if not flag.source_message_id:
        return None
    model = {
        SOURCE_DIRECT: DirectMessage,
        SOURCE_GROUP: GroupMessage,
        SOURCE_PARTNER_GROUP: PartnerGroupMessage,
    }.get(flag.source_type)
    return model.objects(id=flag.source_message_id).first() if model else None


def hide_or_delete_original_message(flag: MessageFlag) -> None:
    message = original_message_for_flag(flag)
    if not message:
        return
    if flag.source_type == SOURCE_GROUP:
        message.is_deleted = True
        message.save()
    else:
        message.delete()
