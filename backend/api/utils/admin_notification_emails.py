"""HTML notification emails fired when an admin edits a user's email or
password via /api/edit_email_password.

Three flows, shared brand styling (matches the legacy-user migration email):
  - notify_email_changed_to_old(old_email, new_email): heads-up to the OLD
    address that the account was moved away from it.
  - notify_email_changed_to_new(old_email, new_email): heads-up to the NEW
    address that the account is now linked to it.
  - notify_password_changed(email): heads-up that the password was reset by
    an admin.

All three go from SENDER_EMAIL (the standard transactional address) via the
existing send_email_html helper. The Mentee logo is embedded inline via CID
so we don't depend on any external hosting.
"""

import datetime as dt
import os
from typing import Tuple

from api.core import logger
from api.utils.request_utils import send_email_html

LOGO_PATH = os.path.join(
    os.path.dirname(__file__), "..", "resources", "mentee_logo.png"
)
LOGO_CID = "mentee-logo"

# Brand palette pulled from frontend/src/components/css/_app.scss:
#   $theme-orange #e4bb4f, $theme-orange-dark #a58123,
#   $theme-orange-light #fff7e2, $theme-orange-pastel #fcf6e8.
_SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#fcf6e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fcf6e8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04);overflow:hidden;">
        <tr><td align="center" style="background:#ffffff;padding:28px 32px 8px 32px;">
          <img src="cid:{logo_cid}" alt="Mentee Global" width="80" style="display:block;width:80px;height:auto;border:0;">
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;font-size:13px;color:#a58123;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Mentee Global</td></tr>
        <tr><td style="padding:4px 32px 16px 32px;font-size:20px;font-weight:600;line-height:1.4;color:#1f2937;">{heading}</td></tr>
        {body}
        <tr><td style="padding:16px 32px 24px 32px;font-size:13px;line-height:1.6;color:#6b7280;border-top:1px solid #fcf6e8;background:#fff7e2;">
          This is an automated security notification from <a href="https://app.menteeglobal.org" style="color:#a58123;">app.menteeglobal.org</a>.<br>
          Sent {timestamp}.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def _now_utc_str() -> str:
    return dt.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")


def _para(text: str, color: str = "#1f2937") -> str:
    return (
        f'<tr><td style="padding:0 32px 16px 32px;font-size:15px;'
        f'line-height:1.6;color:{color};">{text}</td></tr>'
    )


def _alert_box(text: str) -> str:
    return (
        '<tr><td style="padding:0 32px 16px 32px;">'
        '<div style="background:#fcf6e8;border-left:4px solid #a58123;'
        "padding:12px 16px;font-size:14px;line-height:1.6;color:#1f2937;"
        f'border-radius:4px;">{text}</div></td></tr>'
    )


def _wrap(title: str, heading: str, body_rows: str) -> str:
    return _SHELL.format(
        title=title,
        heading=heading,
        body=body_rows,
        timestamp=_now_utc_str(),
        logo_cid=LOGO_CID,
    )


def _send(recipient: str, subject: str, html: str, context: str) -> Tuple[bool, str]:
    ok, err = send_email_html(
        recipient=recipient,
        subject=subject,
        html_content=html,
        inline_image_path=LOGO_PATH,
        inline_image_cid=LOGO_CID,
        inline_image_type="image/png",
    )
    if not ok:
        logger.error(f"admin_notification ({context}) to {recipient} failed: {err}")
    return ok, err


def notify_email_changed_to_old(old_email: str, new_email: str) -> Tuple[bool, str]:
    """Tell the OLD address the account was moved off of it."""
    subject = "Your Mentee Global account email was changed"
    body = (
        _para("Hi,")
        + _para(
            "We're letting you know that the email address on your Mentee "
            f"Global account was just changed from <strong>{old_email}</strong> "
            f"to <strong>{new_email}</strong> by an administrator."
        )
        + _alert_box(
            "If you authorized this change, no action is needed and you can "
            "ignore this message."
            "<br><br>"
            "<strong>If you did not authorize this change</strong>, please reply "
            "to this email immediately so we can investigate and secure your "
            "account."
        )
        + _para(
            "For your records, future emails from Mentee Global about this "
            f"account will go to <strong>{new_email}</strong>.",
            color="#374151",
        )
    )
    html = _wrap(
        title="Your Mentee Global account email was changed",
        heading="Your account email was changed",
        body_rows=body,
    )
    return _send(old_email, subject, html, context="email_changed_old")


def notify_email_changed_to_new(old_email: str, new_email: str) -> Tuple[bool, str]:
    """Tell the NEW address the account is now linked to it."""
    subject = "This email is now linked to a Mentee Global account"
    body = (
        _para("Hi,")
        + _para(
            "A Mentee Global account is now associated with this email address "
            f"(<strong>{new_email}</strong>). Previously, the account used "
            f"<strong>{old_email}</strong>. The change was made by an "
            "administrator."
        )
        + _para(
            "You can sign in at "
            '<a href="https://app.menteeglobal.org/login" style="color:#a58123;">'
            "app.menteeglobal.org/login</a> using this email address. If you've "
            "forgotten your password or never set one, click "
            "<em>Forgot Password</em> on the login page and we'll send a reset "
            "link to this address."
        )
        + _alert_box(
            "<strong>If you weren't expecting this notification</strong>, please "
            "reply to this email so we can investigate."
        )
    )
    html = _wrap(
        title="This email is now linked to a Mentee Global account",
        heading="This email is now linked to your account",
        body_rows=body,
    )
    return _send(new_email, subject, html, context="email_changed_new")


def notify_password_changed(email: str) -> Tuple[bool, str]:
    """Tell the user their password was just reset by an admin."""
    subject = "Your Mentee Global account password was changed"
    body = (
        _para("Hi,")
        + _para(
            "We're letting you know that the password on your Mentee Global "
            f"account (<strong>{email}</strong>) was just changed by an "
            "administrator. Any active sessions have been signed out — you'll "
            "need to log in again with your new password."
        )
        + _alert_box(
            "If you requested this change (for example, you asked an admin to "
            "reset your password), no action is needed."
            "<br><br>"
            "<strong>If you did not request this change</strong>, please reply "
            "to this email immediately so we can investigate and secure your "
            "account."
        )
        + _para(
            "You can sign in at "
            '<a href="https://app.menteeglobal.org/login" style="color:#a58123;">'
            "app.menteeglobal.org/login</a>. If you'd prefer to set your own "
            "password rather than use the one provided, click <em>Forgot "
            "Password</em> on the login page for a fresh reset link.",
            color="#374151",
        )
    )
    html = _wrap(
        title="Your Mentee Global account password was changed",
        heading="Your account password was changed",
        body_rows=body,
    )
    return _send(email, subject, html, context="password_changed")
