"""Account deletion cascade policy.

Deleting an account used to remove only the profile document, which stranded
the `Users` record, the Firebase Auth user, OAuth tokens, and every
`DirectMessage` the person ever exchanged. The orphaned message ids then broke
the Messages sidebar and triggered phantom "unread message" emails.

This module centralises a single, role-agnostic policy:

DELETE (identity, access, and PII owned solely by this account)
  - the profile document (MentorProfile / MenteeProfile / PartnerProfile / Hub)
  - the `Users` record (linked by firebase_uid, mentor `user_id` ref, or email)
  - `VerifiedEmail` allowlist rows for the email
  - all OAuth tokens / consents issued to the firebase_uid
  - the Firebase Auth user (frees the email for re-registration)

RETAIN (artifacts that belong to *other* people / program history)
  - `DirectMessage` and group messages — kept so the other party still has the
    conversation; the resolver renders the deleted side as "Deleted Account" and
    the UI blocks replying. The deleted account's own unread sent messages are
    marked read so they can never trigger another unread notification.
  - `AppointmentRequest` history
  - applications (MenteeApplication / NewMentorApplication / PartnerApplication)

Hub deletion is refused while the hub still owns shared content, to avoid mass
orphaning of announcements / events / training / partners.
"""

from firebase_admin import auth as firebase_admin_auth

from api.core import logger
from api.models import (
    Users,
    VerifiedEmail,
    DirectMessage,
    OAuthAccessToken,
    OAuthRefreshToken,
    OAuthAuthorizationCode,
    OAuthConsent,
    Announcement,
    Event,
    Training,
    CommunityLibrary,
    SignedDocs,
    PartnerProfile,
)
from api.utils.constants import Account

_OAUTH_MODELS = (
    OAuthAccessToken,
    OAuthRefreshToken,
    OAuthAuthorizationCode,
    OAuthConsent,
)


def hub_dependents(hub):
    """Counts of shared content still owned by a hub (blocks hub deletion)."""
    hub_id = str(hub.id)
    checks = {
        "announcements": Announcement.objects(hub_id=hub_id).count(),
        "events": Event.objects(hub_id=hub_id).count(),
        "training": Training.objects(hub_id=hub_id).count(),
        "community_library": CommunityLibrary.objects(hub_id=hub_id).count(),
        "partners": PartnerProfile.objects(hub_id=hub_id).count(),
        "signed_docs": SignedDocs.objects(hub_id=hub_id).count(),
    }
    return {name: count for name, count in checks.items() if count}


def delete_account_cascade(role, profile):
    """Cascade-delete an account per the policy above.

    Returns (ok: bool, message: str, summary: dict). When ok is False the
    profile is left untouched (e.g. a hub that still owns content)."""
    profile_id = profile.id
    firebase_uid = getattr(profile, "firebase_uid", None)
    email = getattr(profile, "email", None)
    summary = {}

    if role == Account.HUB.value:
        deps = hub_dependents(profile)
        if deps:
            detail = ", ".join(f"{name}={count}" for name, count in deps.items())
            return False, f"Hub still owns content ({detail})", {}

    # Retain messages, but neutralise: this account's unread *sent* messages
    # must never fire another unread notification once it no longer resolves.
    summary["dm_marked_read"] = DirectMessage.objects(
        sender_id=profile_id, message_read=False
    ).update(message_read=True)

    # Revoke OAuth access (tokens/consents are keyed by firebase_uid).
    if firebase_uid:
        for model in _OAUTH_MODELS:
            deleted = model.objects(user_id=firebase_uid).delete()
            if deleted:
                summary[model.__name__] = deleted

    # Remove the verified-email allowlist entries.
    if email:
        verified_deleted = VerifiedEmail.objects(email=email).delete()
        if verified_deleted:
            summary["verified_email"] = verified_deleted

    # Delete the central Users record. Prefer firebase_uid; fall back to the
    # mentor user_id reference, then email (covers legacy mentees with no uid).
    users_qs = None
    if firebase_uid:
        users_qs = Users.objects(firebase_uid=firebase_uid)
    if not (users_qs and users_qs.count()):
        ref = getattr(profile, "user_id", None)
        if ref is not None:
            try:
                users_qs = Users.objects(id=ref.id)
            except Exception:
                users_qs = None
    if not (users_qs and users_qs.count()) and email:
        users_qs = Users.objects(email=email)
    if users_qs and users_qs.count():
        summary["users"] = users_qs.delete()

    # Delete the Firebase Auth user so the email is freed and login is revoked.
    if firebase_uid:
        try:
            firebase_admin_auth.delete_user(firebase_uid)
            summary["firebase"] = "deleted"
        except Exception as e:
            logger.info(f"Firebase user delete failed for {firebase_uid}: {e}")
            summary["firebase"] = "failed"

    # Finally remove the profile document itself.
    profile.delete()
    summary["profile"] = "deleted"
    return True, "Successful deletion", summary
