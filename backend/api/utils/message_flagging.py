import json
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from functools import lru_cache
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
    GroupMessage,
    Hub,
    MenteeProfile,
    MentorProfile,
    MessageFlag,
    PartnerGroupMessage,
    PartnerProfile,
)
from api.utils.request_utils import send_email_html


DEFAULT_MESSAGE_FLAGGING_MODEL = "gpt-4o-mini"

SOURCE_DIRECT = "direct"
SOURCE_GROUP = "group"
SOURCE_PARTNER_GROUP = "partner_group"

SOURCE_COLLECTIONS = {
    SOURCE_DIRECT: "direct_message",
    SOURCE_GROUP: "group_message",
    SOURCE_PARTNER_GROUP: "partner_group_message",
}

MODERATION_SYSTEM_PROMPT = (
    "You review messages on Mentee Global, a mentorship platform that connects "
    "immigrant and refugee youth (mentees) with volunteer mentors. Most messages "
    "are normal conversation and must NOT be flagged. Flag a message, in any "
    "language, only when it clearly and genuinely violates platform safety or "
    "misuses the platform. Violations are: harassment, hate, threats, violence, "
    "sexual content, self-harm encouragement, exploitation, or abusive language; "
    "financial solicitation, meaning actually asking the other person to give, "
    "send, lend, or pay money, or sending payment details to receive money; "
    "scams and fraud, such as phishing, fake offers, or requests for sensitive "
    "personal or financial information (passwords, bank or card details, "
    "identity documents); advertising, selling, or recruiting (including "
    "multi-level marketing and job or investment pitches); explicit romantic or "
    "sexual advances; and sharing or requesting personal contact details (phone "
    "number, WhatsApp, email, social handles) or pushing to move the "
    "conversation off the platform. "
    "Do NOT flag normal conversation or mentorship logistics. Greetings, small "
    "talk, thanks, and arranging to meet -- proposing or asking to meet, "
    "scheduling or asking about a call or session, and asking when or where to "
    "meet -- are legitimate and must not be flagged. Suggesting a meeting is not "
    "a contact-detail or off-platform violation. Discussing careers, education, "
    "jobs, budgeting, finances, scholarships, or immigration as guidance is "
    "normal; only flag an actual request for money or other clear misuse, not a "
    "mere mention of these topics. When a message is short, ambiguous, or only "
    "mentions a sensitive topic without a clear violation, do NOT flag it. "
    "Prioritize English, Spanish, Portuguese, Arabic, Persian, and Dari, but "
    "review messages written in any language. In the categories field, use short "
    "snake_case labels such as harassment, hate, sexual_content, threats, "
    "self_harm, exploitation, scam, financial_solicitation, spam_advertising, "
    "off_topic, romantic_advance, or contact_info_request. Set severity by how "
    "harmful the content is. Return concise JSON only."
)


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
    model: str = ""
    response: Dict[str, Any] = field(default_factory=dict)


def message_flagging_enabled() -> bool:
    return os.environ.get("MESSAGE_FLAGGING_ENABLED", "true").lower() != "false"


def message_flagging_model() -> str:
    return os.environ.get(
        "OPENAI_MESSAGE_FLAGGING_MODEL", DEFAULT_MESSAGE_FLAGGING_MODEL
    )


def _is_reasoning_model(model: str) -> bool:
    m = (model or "").lower()
    return m.startswith(("gpt-5", "o1", "o3", "o4"))


@lru_cache(maxsize=1)
def _get_openai_client(api_key: str):
    # Reuse one client (and its keep-alive connection pool) across calls so each
    # classification doesn't pay a fresh TLS handshake to OpenAI.
    from openai import OpenAI

    return OpenAI(api_key=api_key)


def _create_openai_response(client, request: Dict[str, Any]):
    # The server runs on eventlet's single cooperative hub, but the OpenAI HTTP
    # call uses blocking sockets, so a multi-second classification would freeze
    # every other request while it runs. Offload it to a native worker thread so
    # the hub stays responsive and concurrent sends moderate in parallel. Fall
    # back to a direct call when eventlet isn't available (scripts/tests).
    try:
        from eventlet import tpool
    except ImportError:
        return client.responses.create(**request)
    return tpool.execute(client.responses.create, **request)


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


def _safe_text(value: Any, max_length: int = 500) -> str:
    text = "" if value is None else str(value)
    text = " ".join(text.split())
    return text if len(text) <= max_length else text[: max_length - 3] + "..."


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
        client = _get_openai_client(api_key)
    except ImportError as exc:
        raise ModerationUnavailable("openai package is not installed") from exc

    model = model or message_flagging_model()
    request = dict(
        model=model,
        input=[
            {
                "role": "system",
                "content": MODERATION_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": f"Message to classify: {text}",
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
        max_output_tokens=600,
    )
    # Reasoning models (gpt-5*, o-series) reason before answering; without a
    # minimal-reasoning hint, reasoning consumes the whole token budget and the
    # JSON comes back empty (every message would look unflagged). Non-reasoning
    # models (e.g. gpt-4o-mini) reject the parameter, so only send it when needed.
    if _is_reasoning_model(model):
        request["reasoning"] = {"effort": "minimal"}
    response = _create_openai_response(client, request)
    raw = getattr(response, "output_text", "") or "{}"
    return json.loads(raw)


def moderate_message_text(text: str, model: Optional[str] = None) -> ModerationResult:
    if not message_flagging_enabled():
        return ModerationResult(flagged=False)

    ai_result = classify_message_with_openai(text, model=model)

    return ModerationResult(
        flagged=bool(ai_result.get("flagged")),
        severity=ai_result.get("severity") or "low",
        categories=list(ai_result.get("categories") or []),
        reason=ai_result.get("reason") or "Potentially inappropriate message.",
        language=ai_result.get("language"),
        confidence=ai_result.get("confidence"),
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
        openai_model=moderation.model,
        openai_response=moderation.response,
    )
    try:
        flag.save()
        created = True
    except NotUniqueError:
        return MessageFlag.objects(source_key=source_key).first(), False

    if notify_admins and flag.origin == "live":
        # Send admin alerts off the request path so messaging stays fast.
        socketio.start_background_task(notify_admins_of_flag, flag)
    return flag, created


def notify_admins_of_flag(flag: MessageFlag) -> None:
    label = sender_label(flag.sender_id)
    severity = (flag.severity or "low").lower()
    subject = f"Flagged message for review ({severity})"
    frontend_url = (
        os.environ.get("FRONT_BASE_URL")
        or os.environ.get("FRONTEND_URL", "https://app.menteeglobal.org")
    ).rstrip("/")

    severity_palette = {
        "high": ("#fdecea", "#b71c1c"),
        "medium": ("#fff4e5", "#b15c00"),
        "low": ("#e8f0fe", "#1a56b0"),
    }
    sev_bg, sev_fg = severity_palette.get(severity, severity_palette["low"])

    sender_name = escape(label.get("name") or "Unknown")
    sender_email = escape(label.get("email") or "")
    sender_line = (
        f"{sender_name} &lt;{sender_email}&gt;" if sender_email else sender_name
    )
    type_label = escape(
        {
            SOURCE_DIRECT: "Direct message",
            SOURCE_GROUP: "Hub group",
            SOURCE_PARTNER_GROUP: "Partner group",
        }.get(flag.source_type, flag.source_type or "")
    )
    categories = ", ".join(escape(c) for c in (flag.categories or [])) or "—"
    reason = escape(flag.reason or "")
    body = escape(_safe_text(flag.body, 800))
    review_url = f"{escape(frontend_url)}/admin/message-flags"

    html = f"""\
<div style="margin:0;padding:24px;background:#f4f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ececf1;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="background:#7a2c3b;padding:20px 28px;">
        <div style="color:#ffffff;font-size:12px;letter-spacing:0.6px;text-transform:uppercase;opacity:0.8;">Mentee Global</div>
        <div style="color:#ffffff;font-size:19px;font-weight:700;margin-top:3px;">A message was flagged for review</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px;">
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:{sev_bg};color:{sev_fg};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">{escape(severity)} severity</span>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;font-size:14px;color:#1f2330;">
          <tr><td style="padding:6px 0;color:#8a8f9c;width:96px;vertical-align:top;">Sender</td><td style="padding:6px 0;">{sender_line}</td></tr>
          <tr><td style="padding:6px 0;color:#8a8f9c;vertical-align:top;">Type</td><td style="padding:6px 0;">{type_label}</td></tr>
          <tr><td style="padding:6px 0;color:#8a8f9c;vertical-align:top;">Categories</td><td style="padding:6px 0;">{categories}</td></tr>
          <tr><td style="padding:6px 0;color:#8a8f9c;vertical-align:top;">Reason</td><td style="padding:6px 0;">{reason}</td></tr>
        </table>
        <div style="margin-top:16px;padding:14px 16px;background:#f4f5f9;border-left:3px solid #7a2c3b;border-radius:8px;font-size:14px;color:#1f2330;line-height:1.5;white-space:pre-wrap;">{body}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr><td style="border-radius:8px;background:#7a2c3b;"><a href="{review_url}" style="display:inline-block;padding:11px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Review flagged messages</a></td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;background:#fafafa;border-top:1px solid #ececf1;font-size:12px;color:#9aa0ad;line-height:1.5;">
        You're receiving this because you're set to receive flagged-message alerts. Manage recipients on the Flagged Messages admin page.
      </td>
    </tr>
  </table>
</div>"""

    # Email the admins who opted in on /admin/message-flags; if none are
    # selected, fall back to every admin so alerts are never silently off.
    recipients = Admin.objects(receive_flag_alerts=True) or Admin.objects()
    admin_emails = [admin.email for admin in recipients if admin.email]
    if not admin_emails:
        return

    # One SendGrid call: send to the platform address and BCC every admin so
    # their addresses stay hidden from each other.
    to_address = os.environ.get("SENDER_EMAIL")
    if to_address:
        bcc = admin_emails
    else:
        to_address, bcc = admin_emails[0], admin_emails[1:]

    ok, err = send_email_html(
        recipient=to_address,
        subject=subject,
        html_content=html,
        bcc=bcc,
    )
    if not ok:
        logger.error(f"message_flag admin alert failed: {err}")


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


def held_messages_for_viewer(caller_id, sender_id, recipient_id):
    """Pending held (flagged, undelivered) direct messages the caller sent in
    this conversation, shaped like DirectMessage JSON with held=True.

    Only the sender ever sees their own held messages; the recipient never does,
    because held messages live in MessageFlag and are not DirectMessages.
    """
    caller = _parse_object_id(caller_id)
    if not caller or str(caller_id) not in (str(sender_id), str(recipient_id)):
        return []
    other = _parse_object_id(
        recipient_id if str(caller_id) == str(sender_id) else sender_id
    )
    if not other:
        return []
    flags = MessageFlag.objects(
        source_type=SOURCE_DIRECT,
        status="pending",
        source_message_id=None,
        sender_id=caller,
        recipient_id=other,
    ).order_by("created_at", "id")
    return [
        {
            "_id": {"$oid": str(flag.id)},
            "body": flag.body,
            "sender_id": {"$oid": str(flag.sender_id)},
            "recipient_id": {"$oid": str(flag.recipient_id)},
            "created_at": (
                {"$date": flag.created_at.isoformat() + "Z"}
                if flag.created_at
                else None
            ),
            "message_read": False,
            "held": True,
        }
        for flag in flags
    ]


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
) -> Tuple[bool, Optional[MessageFlag]]:
    if not message_flagging_enabled():
        return False, None

    body = payload.get("body", "")
    try:
        moderation = moderate_message_text(body)
    except Exception:
        # Moderation is best-effort: if it can't run (missing OPENAI_API_KEY,
        # no OpenAI credits, API/network error) let the message through
        # unflagged instead of blocking users from messaging each other.
        logger.exception("message moderation unavailable; allowing message unflagged")
        return False, None

    if not moderation.flagged:
        return False, None

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
    return True, flag


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
