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
from mongoengine.queryset.visitor import Q

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


DEFAULT_MESSAGE_FLAGGING_MODEL = "gpt-5-nano"
OMNI_MODERATION_MODEL = "omni-moderation-latest"
SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2}

SOURCE_DIRECT = "direct"
SOURCE_GROUP = "group"
SOURCE_PARTNER_GROUP = "partner_group"

SOURCE_COLLECTIONS = {
    SOURCE_DIRECT: "direct_message",
    SOURCE_GROUP: "group_message",
    SOURCE_PARTNER_GROUP: "partner_group_message",
}

# The LLM only judges the platform-specific categories below. General safety
# (harassment, hate, sexual, self-harm, violence) is handled separately by the
# calibrated moderation API, so it is deliberately NOT in this prompt.
LLM_CATEGORIES = [
    "financial_solicitation",
    "scam",
    "spam_advertising",
    "age_safety",
    "grooming",
]

MODERATION_SYSTEM_PROMPT = (
    "You review messages on Mentee Global, a mentorship platform that connects "
    "immigrant and refugee youth (mentees) with volunteer mentors. Safety issues "
    "such as harassment, hate, sexual content, self-harm, and violence are "
    "handled by a separate system -- do NOT flag those here. Your job is ONLY "
    "these platform-misuse categories:\n"
    "- financial_solicitation: the sender asks the other person to give, send, "
    "lend, or pay money, shares payment details to receive money, or shares a "
    "link to their own fundraiser asking people to contribute or spread it. "
    "Saying they need money or funding, asking for advice about scholarships or "
    "funding options, asking for help preparing a fundraiser, or advising the "
    "other person about raising money for their own needs is guidance, NOT "
    "solicitation -- flag only a direct ask for money or a shared fundraising "
    "link.\n"
    "- scam: phishing or deception, such as fake offers or requests for "
    "passwords, bank or card details, or identity documents. Simply sharing a "
    "real phone number, WhatsApp, or email is NOT a scam, and sharing a link to "
    "a real website, course, or signup page without any deceptive claim in the "
    "message is NOT a scam. Scam means the SENDER is deceiving someone; "
    "describing a login form, mentioning that a site asks for a password, or "
    "asking for technical help with an account is NOT a scam.\n"
    "- spam_advertising: the sender is seeking customers, clients, workers, or "
    "investors -- selling or promoting a product or service, posting or "
    "pitching a job (e.g. announcing that you or your company are hiring or "
    "looking for a developer, designer, or other worker), or recruiting for a "
    "business or investment scheme (including multi-level marketing). Offering "
    "your services counts even when framed as charitable, discounted, or "
    "social-impact, and a job post counts even when framed as networking (e.g. "
    "asking whether anyone in the group knows someone for a role). But sharing "
    "an opportunity the recipient could apply for or attend -- a scholarship, "
    "internship, training program, course, community event, or useful link -- "
    "is normal mentoring, NOT advertising, even when the sender's own "
    "organization runs it. "
    "Sharing your own phone number, WhatsApp, email, or social handle to "
    "coordinate, or asking for the other person's, is NOT advertising.\n"
    "- age_safety: a conversation participant or prospective mentee is under 18 "
    "-- the sender giving their own age as under 18 (e.g. 15, 16, or 17), "
    "someone being introduced as a prospective mentee who is under 18 or still "
    "in high school, or the sender asking a young mentee's age (mentees must be "
    "18+). A sender mentioning their own children's or relatives' ages in small "
    "talk is NOT age_safety.\n"
    "- grooming: an adult pressures a young mentee into a private or secret "
    "channel, or any grooming pattern.\n"
    "Everything else is normal and must NOT be flagged. In particular, sharing or "
    "asking for a phone number, WhatsApp, email, or social handle, proposing or "
    "scheduling a meeting or call, sending meeting links, introductions, "
    "greetings, thanks, small talk, reaching out for mentorship, and discussing "
    "careers, jobs, education, finances, scholarships, or immigration as guidance "
    "are all normal and must NOT be flagged. "
    "A violation is often a single sentence buried in an otherwise normal, "
    "polite message: a warm multi-paragraph mentorship introduction that "
    "mentions an age under 18 is still age_safety, and a friendly group post "
    "that pitches a job or service is still spam_advertising. Check every "
    "sentence against the categories before deciding.\n"
    "Only flag if you can quote the exact words that constitute the violation; "
    "put that quote in the evidence field. If you cannot quote specific violating "
    "words, set flagged to false and evidence to an empty string.\n"
    "Examples (message -> decision):\n"
    "'Could you share your WhatsApp so we can plan our next session?' -> not "
    "flagged.\n"
    "'Hi, my number is +1 555 014 9920, text me anytime.' -> not flagged.\n"
    "'Tuesday at 4pm works for me. I will email you the Zoom link.' -> not "
    "flagged.\n"
    "'Thank you so much for your advice, see you next week!' -> not flagged.\n"
    "'Have you considered starting a GoFundMe for your tuition? I could help "
    "you write your story.' -> not flagged.\n"
    "'I want to share two scholarship programs you could apply for, here are "
    "the links.' -> not flagged.\n"
    "'The website is asking me to enter my name, email, and a password -- is "
    "that normal?' -> not flagged.\n"
    "'I have two daughters, 7 and 10, and on weekends we all go hiking.' -> not "
    "flagged.\n"
    "'Our organization runs a free summer coding bootcamp for students -- you "
    "could apply, here is the link.' -> not flagged.\n"
    "'Could you lend me $200? I promise to pay you back next month.' -> flagged "
    "financial_solicitation.\n"
    "'I sell phone cases and watches, check my page and order today!' -> flagged "
    "spam_advertising.\n"
    "'Our company is hiring remote workers, earn $500 a week -- reply to join.' "
    "-> flagged spam_advertising.\n"
    "'Hi all, our startup is looking for a graphic designer to join our team, "
    "send me your CV if interested.' -> flagged spam_advertising.\n"
    "'Your account will be closed today, verify your password at this link.' -> "
    "flagged scam.\n"
    "'Dear Ms. Rivera, I hope you are doing well. My name is Karim and I "
    "recently moved to Canada with my family. I am 16 years old and in grade "
    "11, I enjoy soccer and drawing, and I would be honored to have you as my "
    "mentor.' -> flagged age_safety (the age is buried mid-message, flag it "
    "anyway).\n"
    "'I want to introduce my younger cousin, a 15-year-old high-school student "
    "who needs guidance.' -> flagged age_safety.\n"
    "You may be given the recent conversation as context; use it only to "
    "understand the latest message, and classify ONLY the latest message. "
    "Messages may be in any language. Return concise JSON only."
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


def message_flagging_reasoning_effort() -> str:
    # "low" instead of "minimal": at minimal effort gpt-5-nano's decisions are
    # so noisy that eval F1 swings between 0.42-0.46 on identical inputs; at low
    # effort it is stable (F1 ~0.9-1.0 on the gold set) for ~0.8s extra latency.
    return os.environ.get("MESSAGE_FLAGGING_REASONING_EFFORT", "low")


@lru_cache(maxsize=1)
def _get_openai_client(api_key: str):
    # Reuse one client (and its keep-alive connection pool) across calls so each
    # classification doesn't pay a fresh TLS handshake to OpenAI.
    from openai import OpenAI

    return OpenAI(api_key=api_key)


def _run_off_hub(fn, *args, **kwargs):
    # The server runs on eventlet's single cooperative hub, but OpenAI's HTTP
    # calls use blocking sockets, so a multi-second moderation would freeze every
    # other request. Offload the whole moderation to a native worker thread so the
    # hub stays responsive and concurrent sends moderate in parallel. Falls back
    # to a direct call when eventlet isn't available (scripts/tests), which run
    # their own thread pool, so the moderation function itself stays plain.
    try:
        from eventlet import tpool
    except ImportError:
        return fn(*args, **kwargs)
    return tpool.execute(lambda: fn(*args, **kwargs))


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
                "items": {"type": "string", "enum": LLM_CATEGORIES},
                "maxItems": len(LLM_CATEGORIES),
            },
            "evidence": {"type": "string"},
            "reason": {"type": "string"},
            "language": {"type": ["string", "null"]},
            "confidence": {"type": ["number", "null"], "minimum": 0, "maximum": 1},
        },
        "required": [
            "flagged",
            "severity",
            "categories",
            "evidence",
            "reason",
            "language",
            "confidence",
        ],
    }


def _user_classification_content(text: str, context: Optional[str]) -> str:
    if context:
        return (
            f"Recent conversation for context:\n{context}\n\n"
            f"Classify ONLY this latest message: {text}"
        )
    return f"Message to classify: {text}"


def classify_message_with_openai(
    text: str, model: Optional[str] = None, context: Optional[str] = None
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
                "content": _user_classification_content(text, context),
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
        # Reasoning shares this budget with the JSON answer, so anything above
        # minimal effort needs enough headroom or the JSON comes back empty.
        max_output_tokens=(
            600 if message_flagging_reasoning_effort() == "minimal" else 2500
        ),
    )
    # Reasoning models (gpt-5*, o-series) reason before answering; without a
    # low-effort hint, reasoning consumes the whole token budget and the JSON
    # comes back empty (every message would look unflagged). Non-reasoning
    # models (e.g. gpt-4o-mini) reject the parameter, so only send it when needed.
    if _is_reasoning_model(model):
        request["reasoning"] = {"effort": message_flagging_reasoning_effort()}
    response = client.responses.create(**request)
    raw = getattr(response, "output_text", "") or "{}"
    return json.loads(raw)


_OMNI_CATEGORY_MAP = {
    "harassment": "harassment",
    "harassment_threatening": "harassment",
    "hate": "hate",
    "hate_threatening": "hate",
    "self_harm": "self_harm",
    "self_harm_intent": "self_harm",
    "self_harm_instructions": "self_harm",
    "sexual": "sexual_content",
    "sexual_minors": "sexual_content",
    "violence": "violence",
    "violence_graphic": "violence",
}


def _severity_from_score(score: float) -> str:
    if score >= 0.7:
        return "high"
    if score >= 0.4:
        return "medium"
    return "low"


def _omni_safety(client, text: str):
    """Calibrated safety check via the moderation API (free, no contact bias).
    Returns (flagged_categories, severity); severity 'low' means a weak signal."""
    try:
        result = client.moderations.create(
            model=OMNI_MODERATION_MODEL, input=text[:4000]
        ).results[0]
        cats = result.categories.model_dump()
        scores = result.category_scores.model_dump()
    except Exception:
        logger.exception("omni moderation failed; relying on the LLM check only")
        return [], "low"
    flagged, top = set(), 0.0
    for key, ours in _OMNI_CATEGORY_MAP.items():
        if cats.get(key):
            flagged.add(ours)
            top = max(top, float(scores.get(key) or 0.0))
    return sorted(flagged), _severity_from_score(top)


def _max_severity(severities) -> str:
    return max(severities, key=lambda s: SEVERITY_RANK.get(s, 0))


def moderate_message_text(
    text: str, model: Optional[str] = None, context: Optional[str] = None
) -> ModerationResult:
    if not message_flagging_enabled():
        return ModerationResult(flagged=False)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ModerationUnavailable("OPENAI_API_KEY is required for message flagging")
    try:
        client = _get_openai_client(api_key)
    except ImportError as exc:
        raise ModerationUnavailable("openai package is not installed") from exc

    # 1. Safety via the calibrated moderation API.
    omni_cats, omni_sev = _omni_safety(client, text)

    # 2. Platform-specific misuse via the LLM (money, scams, spam, age, grooming).
    ai = classify_message_with_openai(text, model=model, context=context)
    llm_cats = list(ai.get("categories") or [])
    llm_sev = ai.get("severity") or "low"
    # Require a quoted-evidence span so the model can't flag on a hallucinated
    # category; the enum schema already limits it to the real categories. A flag
    # carrying nearly every category at once is a known degenerate output of the
    # small model (no real message violates them all), so treat it as noise.
    llm_flagged = (
        bool(ai.get("flagged"))
        and bool((ai.get("evidence") or "").strip())
        and llm_cats
        and len(llm_cats) < 4
    )

    # 3. Combine. Drop only weak OMNI signals (its score is calibrated, so a low
    #    score genuinely means uncertain). LLM flags are already high-precision
    #    (enum category + quoted evidence), and gpt-5-nano under-rates severity
    #    (it calls a clear money request "low"), so we trust the flag and just
    #    floor its display severity at medium rather than dropping it.
    parts = []
    if omni_cats and omni_sev != "low":
        parts.append((omni_cats, omni_sev))
    if llm_flagged:
        parts.append((llm_cats, _max_severity([llm_sev, "medium"])))

    categories = sorted({c for cats, _ in parts for c in cats})
    response = {"omni": {"categories": omni_cats, "severity": omni_sev}, "llm": ai}
    if not parts:
        return ModerationResult(
            flagged=False,
            categories=sorted(set(omni_cats) | set(llm_cats)),
            language=ai.get("language"),
            confidence=ai.get("confidence"),
            model=model or message_flagging_model(),
            response=response,
        )

    return ModerationResult(
        flagged=True,
        severity=_max_severity(sev for _, sev in parts),
        categories=categories,
        reason=ai.get("reason") or "Flagged for review.",
        language=ai.get("language"),
        confidence=ai.get("confidence"),
        model=model or message_flagging_model(),
        response=response,
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


def _is_team_sender(sender_id: Any) -> bool:
    """Only Letitia's accounts (letitia@menteeglobal.org and letitia+alias
    addresses) are trusted and never moderated. Everyone else -- including
    admins and other @menteeglobal.org team accounts -- is moderated normally."""
    profile = _sender_profile(sender_id)
    if profile is None:
        return False
    email = (getattr(profile, "email", "") or "").lower()
    local, _, domain = email.partition("@")
    return domain == "menteeglobal.org" and (
        local == "letitia" or local.startswith("letitia+")
    )


def _recent_direct_context(
    sender_id: Any, recipient_id: Any, limit: int = 3, before: Any = None
) -> str:
    """The last few delivered messages of this 1:1 conversation, labelled by who
    sent each, to give the classifier context for the latest message. Pass
    `before` (a datetime) to get the messages preceding a historical message."""
    s = _parse_object_id(sender_id)
    r = _parse_object_id(recipient_id)
    if not s or not r:
        return ""
    conversation = (Q(sender_id=s) & Q(recipient_id=r)) | (
        Q(sender_id=r) & Q(recipient_id=s)
    )
    if before is not None:
        conversation = conversation & Q(created_at__lt=before)
    messages = list(
        DirectMessage.objects(conversation).order_by("-created_at").limit(limit)
    )
    messages.reverse()
    lines = [
        f"{'sender' if m.sender_id == s else 'other'}: {_safe_text(m.body, 300)}"
        for m in messages
    ]
    return "\n".join(lines)


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

    sender_id = payload.get("sender_id")
    if _is_team_sender(sender_id):
        return False, None

    body = payload.get("body", "")
    context = ""
    if source_type == SOURCE_DIRECT:
        context = _recent_direct_context(sender_id, payload.get("recipient_id"))
    try:
        # Run the (blocking) moderation off eventlet's hub so it can't stall
        # other requests; scripts call moderate_message_text directly.
        moderation = _run_off_hub(moderate_message_text, body, context=context)
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
