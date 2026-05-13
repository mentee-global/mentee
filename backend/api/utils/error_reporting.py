"""Best-effort error capture for both backend exceptions and frontend reports.

All public functions are designed to NEVER raise, since they run from
exception handlers. Failures are logged and swallowed.

Errors are persisted to MongoDB (ErrorLog collection, 90-day TTL). A
SendGrid alert is sent to every Admin whose `receive_error_alerts` flag is
True (managed via the admin Error Logs page), rate-limited per
exception/endpoint.
"""
import json
import logging
import traceback as tb_module
from datetime import datetime, timedelta
from typing import Optional

from html import escape as _html_escape

from api.models import Admin, ErrorLog
from api.utils.request_utils import send_email_html

logger = logging.getLogger(__name__)


SENSITIVE_KEYS = {
    "password",
    "confirmpassword",
    "token",
    "authorization",
    "image",
    "firebase_uid",
    "id_token",
    "access_token",
    "refresh_token",
}

_MAX_STRING_LEN = 1024
_MAX_FIELD_LEN = 8192
_NOTIFY_WINDOW_MIN = 30


def _truncate(value: Optional[str], n: int = _MAX_FIELD_LEN) -> Optional[str]:
    if value is None:
        return None
    if len(value) <= n:
        return value
    return value[:n] + "...[truncated]"


def _sanitize(obj, depth: int = 0):
    """Recursively drop sensitive keys and truncate long strings."""
    if depth > 6:
        return "[...]"
    if isinstance(obj, dict):
        return {
            k: _sanitize(v, depth + 1)
            for k, v in obj.items()
            if str(k).lower() not in SENSITIVE_KEYS
        }
    if isinstance(obj, (list, tuple)):
        return [_sanitize(v, depth + 1) for v in obj[:50]]
    if isinstance(obj, str):
        return obj if len(obj) <= _MAX_STRING_LEN else obj[:_MAX_STRING_LEN] + "..."
    if isinstance(obj, (int, float, bool)) or obj is None:
        return obj
    return str(obj)[:_MAX_STRING_LEN]


def _extract_request_payload(request_obj) -> Optional[str]:
    if request_obj is None:
        return None
    try:
        body = request_obj.get_json(silent=True)
        if body is None and request_obj.form:
            body = dict(request_obj.form)
        if body is None:
            return None
        return _truncate(json.dumps(_sanitize(body), default=str))
    except Exception:
        return None


def _extract_ip(request_obj) -> Optional[str]:
    if request_obj is None:
        return None
    try:
        fwd = request_obj.headers.get("X-Forwarded-For")
        if fwd:
            return fwd.split(",")[0].strip()
        return request_obj.remote_addr
    except Exception:
        return None


def record_error(
    severity: str,
    source: str,
    exc: BaseException,
    request_obj=None,
    extra: Optional[dict] = None,
) -> Optional[str]:
    """Persist an error to the ErrorLog collection. Returns the doc id as str
    or None on failure. Never raises."""
    try:
        extra = extra or {}
        tb_text = None
        try:
            tb_text = "".join(
                tb_module.format_exception(type(exc), exc, exc.__traceback__)
            )
        except Exception:
            pass

        endpoint = extra.get("endpoint")
        if not endpoint and request_obj is not None:
            try:
                endpoint = f"{request_obj.method} {request_obj.path}"
            except Exception:
                endpoint = None

        user_agent = extra.get("user_agent")
        if not user_agent and request_obj is not None:
            try:
                user_agent = request_obj.headers.get("User-Agent")
            except Exception:
                pass

        log = ErrorLog(
            timestamp=datetime.utcnow(),
            severity=severity if severity in ("error", "warning") else "error",
            source=source,
            endpoint=_truncate(endpoint, 256),
            user_email=_truncate(extra.get("user_email"), 256),
            user_role=_truncate(extra.get("user_role"), 64),
            exception_type=_truncate(type(exc).__name__, 128),
            exception_message=_truncate(str(exc), _MAX_FIELD_LEN),
            traceback=_truncate(extra.get("traceback") or tb_text),
            request_payload=_extract_request_payload(request_obj),
            user_agent=_truncate(user_agent, 512),
            ip=_truncate(_extract_ip(request_obj), 64),
            notified=False,
        )
        log.save()
        return str(log.id)
    except Exception:
        logger.exception("record_error failed")
        return None


def _build_alert_html(log) -> str:
    """Render a minimal, plain-styled HTML body for an error alert email.

    Kept inline (no Jinja template) so this module has no extra dependencies
    and the helper never has to reach into the broader app context while
    running from an exception handler.
    """

    def _row(label, value):
        return (
            f'<tr><td style="padding:4px 8px; font-weight:bold; '
            f'vertical-align:top; white-space:nowrap;">{label}</td>'
            f'<td style="padding:4px 8px; font-family:monospace;">'
            f"{_html_escape(str(value)) if value is not None else ''}</td></tr>"
        )

    ts = log.timestamp.isoformat() if log.timestamp else ""
    message = (log.exception_message or "")[:1000]
    trace = (log.traceback or "")[:4000]

    rows = [
        _row("When", ts),
        _row("Source", log.source),
        _row("Severity", log.severity),
        _row("Endpoint", log.endpoint or "(unknown)"),
        _row("Exception", log.exception_type or "Error"),
        _row("User", log.user_email or "(none)"),
    ]
    if log.user_role:
        rows.append(_row("Role", log.user_role))
    if log.ip:
        rows.append(_row("IP", log.ip))

    trace_block = ""
    if trace:
        trace_block = (
            '<p style="margin-top:18px;"><strong>Traceback (truncated)</strong></p>'
            '<pre style="background:#f6f8fa; padding:12px; border-radius:4px; '
            'font-size:12px; white-space:pre-wrap; overflow-x:auto;">'
            f"{_html_escape(trace)}</pre>"
        )

    return (
        '<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif; '
        'color:#222; max-width:720px;">'
        f'<h2 style="margin:0 0 8px 0;">Mentee error: '
        f"{_html_escape(log.exception_type or 'Error')}</h2>"
        f'<p style="margin:0 0 16px 0; color:#555;">'
        f"{_html_escape(message)}</p>"
        '<table style="border-collapse:collapse; font-size:14px;">'
        f"{''.join(rows)}"
        "</table>"
        f"{trace_block}"
        '<p style="margin-top:24px; font-size:12px; color:#888;">'
        "You're receiving this because your admin account is opted in to error "
        'alerts. Manage recipients at <a href="/admin/error-logs">'
        "/admin/error-logs</a>.</p>"
        "</div>"
    )


def _resolve_alert_recipients():
    """Return emails of admins opted in to error alerts."""
    try:
        emails = Admin.objects(receive_error_alerts=True).distinct("email")
    except Exception:
        logger.exception("Admin lookup failed during error alert")
        return []
    return [e for e in emails if e]


def maybe_notify_dev(error_log_id: Optional[str]) -> None:
    """Email opted-in admins about an ErrorLog. Rate-limited."""
    if not error_log_id:
        return
    try:
        recipients = _resolve_alert_recipients()
        if not recipients:
            return

        log = ErrorLog.objects(id=error_log_id).first()
        if log is None:
            return

        # Rate-limit: skip if a notified entry for the same exception+endpoint
        # was sent in the last NOTIFY_WINDOW_MIN minutes.
        window_start = datetime.utcnow() - timedelta(minutes=_NOTIFY_WINDOW_MIN)
        already = ErrorLog.objects(
            exception_type=log.exception_type,
            endpoint=log.endpoint,
            notified=True,
            timestamp__gte=window_start,
            id__ne=log.id,
        ).first()
        if already is not None:
            return

        subject = (
            f"[Mentee Alert] {log.source}: "
            f"{log.exception_type or 'Error'} @ "
            f"{log.endpoint or 'unknown'}"
        )

        # We deliberately don't reuse the ALERT_TO_ADMINS dynamic template here:
        # its subject and body are wired for account-activity alerts ("user X
        # completed training") and override our subject with a blank string. A
        # plain HTML email gives us full control of subject and body and avoids
        # depending on SendGrid template configuration we don't own.
        html_content = _build_alert_html(log)

        any_sent = False
        for addr in recipients:
            try:
                ok, msg = send_email_html(
                    recipient=addr,
                    subject=subject,
                    html_content=html_content,
                )
                if ok:
                    any_sent = True
                else:
                    logger.warning("Dev alert send failed to %s: %s", addr, msg)
            except Exception:
                logger.exception("Dev alert send raised for %s", addr)

        if any_sent:
            log.notified = True
            log.save()
    except Exception:
        logger.exception("maybe_notify_dev failed")
