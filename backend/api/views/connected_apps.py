"""User self-service: list and revoke OAuth clients the user has authorized.

Auth via Firebase (Authorization: Bearer). Only registered when
OAUTH_ENABLED is on.
"""
import datetime

from flask import Blueprint, request
from firebase_admin import auth as firebase_admin_auth
from mongoengine import Q

from api.core import create_response, logger
from api.models import (
    OAuthAccessToken,
    OAuthClient,
    OAuthConsent,
    OAuthRefreshToken,
    Users,
)
from api.utils.require_auth import all_users


connected_apps = Blueprint("connected_apps", __name__)


def _current_user_id():
    """Resolve the Mongo Users._id for the caller's Firebase token."""
    token = request.headers.get("Authorization")
    if not token:
        return None
    try:
        claims = firebase_admin_auth.verify_id_token(token)
    except Exception as e:
        logger.info(f"connected_apps: bad firebase token: {e}")
        return None
    firebase_uid = claims.get("uid")
    if not firebase_uid:
        return None
    user = Users.objects(firebase_uid=firebase_uid).first()
    return str(user.id) if user else None


@connected_apps.route("/connected-apps", methods=["GET"])
@all_users
def list_connected_apps():
    user_id = _current_user_id()
    if not user_id:
        return create_response(status=401, message="Unauthorized")

    consents = OAuthConsent.objects(user_id=user_id, revoked_at=None)
    results = []
    for consent in consents:
        client = OAuthClient.objects(client_id=consent.client_id).first()
        if not client:
            # Client was deleted (should not happen) — skip silently.
            continue

        # last_used_at = max across this user+client's refresh tokens
        last_used = None
        for rt in OAuthRefreshToken.objects(
            user_id=user_id, client_id=consent.client_id
        ).only("last_used_at"):
            if rt.last_used_at and (last_used is None or rt.last_used_at > last_used):
                last_used = rt.last_used_at

        results.append(
            {
                "client_id": client.client_id,
                "client_name": client.client_name,
                "client_logo_url": client.client_logo_url,
                "is_first_party": bool(client.is_first_party),
                "granted_scopes": list(consent.granted_scopes or []),
                "granted_at": consent.granted_at.isoformat()
                if consent.granted_at
                else None,
                "last_used_at": last_used.isoformat() if last_used else None,
            }
        )

    results.sort(
        key=lambda r: r.get("last_used_at") or r.get("granted_at") or "",
        reverse=True,
    )
    return create_response(data={"connected_apps": results})


@connected_apps.route("/connected-apps/<string:client_id>", methods=["DELETE"])
@all_users
def revoke_connected_app(client_id):
    user_id = _current_user_id()
    if not user_id:
        return create_response(status=401, message="Unauthorized")

    consent = OAuthConsent.objects(
        user_id=user_id, client_id=client_id, revoked_at=None
    ).first()
    if not consent:
        return create_response(status=404, message="connection not found")

    now = datetime.datetime.utcnow()
    consent.revoked_at = now
    consent.save()

    OAuthAccessToken.objects(
        user_id=user_id, client_id=client_id, revoked=False
    ).update(revoked=True)
    OAuthRefreshToken.objects(
        user_id=user_id, client_id=client_id, revoked=False
    ).update(revoked=True)

    logger.info(f"User {user_id} revoked connected app {client_id}")
    return create_response(data={"revoked": True}, status=200)


@connected_apps.route("/oauth-access/has-any", methods=["GET"])
@all_users
def has_any_oauth_access():
    """Answers: should this user see the Connected Apps nav tab?

    True when:
      1. They have any active OAuthConsent (so they can revoke), OR
      2. There's any active open client (empty whitelist), OR
      3. Any active client whitelists their role or user id.
    """
    user_id = _current_user_id()
    if not user_id:
        return create_response(status=401, message="Unauthorized")

    # 1. Existing consents keep the nav visible regardless of whitelist.
    if OAuthConsent.objects(user_id=user_id, revoked_at=None).first():
        return create_response(data={"has_any": True})

    # 2. Any fully-open active client.
    if OAuthClient.objects(
        is_active=True, whitelist_roles=[], whitelist_user_ids=[]
    ).first():
        return create_response(data={"has_any": True})

    # 3. Role- or user-specific whitelisting.
    user = Users.objects(id=user_id).first()
    if not user:
        return create_response(data={"has_any": False})
    role_str = str(user.role) if user.role is not None else ""
    q = Q(is_active=True) & (
        Q(whitelist_roles=role_str) | Q(whitelist_user_ids=str(user.id))
    )
    if OAuthClient.objects(q).first():
        return create_response(data={"has_any": True})

    return create_response(data={"has_any": False})
