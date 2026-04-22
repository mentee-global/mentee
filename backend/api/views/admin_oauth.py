"""Admin REST API for managing OAuth clients.

All routes require the caller to be an admin (Firebase `role == 0`).
Only registered when OAUTH_ENABLED is on — see api/__init__.py.
"""
import datetime
import secrets

import bcrypt
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request

from api.core import create_response, logger
from api.models import (
    MenteeProfile,
    MentorProfile,
    OAuthAccessToken,
    OAuthAuthorizationCode,
    OAuthClient,
    OAuthConsent,
    OAuthRefreshToken,
    PartnerProfile,
    Users,
)
from api.utils.constants import Account
from api.utils.require_auth import admin_only


admin_oauth = Blueprint("admin_oauth", __name__)


RESERVED_SCOPE_PREFIX = "mentee.api"

MAX_WHITELIST_ROLES = 10
MAX_WHITELIST_USERS = 500
MAX_USER_SEARCH_LIMIT = 50
DEFAULT_USER_SEARCH_LIMIT = 20

VALID_WHITELIST_ROLES = {str(r.value) for r in Account}


def _serialize_client(client: OAuthClient) -> dict:
    return {
        "client_id": client.client_id,
        "client_name": client.client_name,
        "client_logo_url": client.client_logo_url,
        "redirect_uris": list(client.redirect_uris or []),
        "allowed_scopes": list(client.allowed_scopes or []),
        "response_types": list(client.response_types or []),
        "grant_types": list(client.grant_types or []),
        "token_endpoint_auth_method": client.token_endpoint_auth_method,
        "is_first_party": bool(client.is_first_party),
        "is_active": bool(client.is_active),
        "whitelist_roles": list(client.whitelist_roles or []),
        "whitelist_user_ids": list(client.whitelist_user_ids or []),
        "bypass_admin": bool(client.bypass_admin),
        "created_at": client.created_at.isoformat() if client.created_at else None,
        "updated_at": client.updated_at.isoformat() if client.updated_at else None,
        "created_by": client.created_by,
    }


def _validate_scopes(scopes, allow_reserved: bool = False):
    if not isinstance(scopes, list):
        return "allowed_scopes must be a list"
    for s in scopes:
        if not isinstance(s, str) or not s.strip():
            return "allowed_scopes entries must be non-empty strings"
        if (not allow_reserved) and s.startswith(RESERVED_SCOPE_PREFIX):
            return (
                f"Scope '{s}' is reserved. Contact engineering if you need "
                f"reserved-scope access."
            )
    return None


def _validate_whitelist(roles, user_ids):
    """Validate whitelist_roles and whitelist_user_ids; mutate-return clean lists.

    Returns either (error_message, None, None) on failure
    or (None, deduped_roles, deduped_user_ids) on success.
    """
    if roles is None:
        roles = []
    if user_ids is None:
        user_ids = []
    if not isinstance(roles, list):
        return "whitelist_roles must be a list", None, None
    if not isinstance(user_ids, list):
        return "whitelist_user_ids must be a list", None, None

    clean_roles = []
    seen_roles = set()
    for r in roles:
        if not isinstance(r, (str, int)):
            return "whitelist_roles entries must be strings or ints", None, None
        s = str(r)
        if s not in VALID_WHITELIST_ROLES:
            return f"whitelist_roles contains invalid role '{s}'", None, None
        if s not in seen_roles:
            seen_roles.add(s)
            clean_roles.append(s)
    if len(clean_roles) > MAX_WHITELIST_ROLES:
        return (
            f"whitelist_roles may not exceed {MAX_WHITELIST_ROLES} entries",
            None,
            None,
        )

    clean_user_ids = []
    seen_users = set()
    for uid in user_ids:
        if not isinstance(uid, str) or not uid.strip():
            return "whitelist_user_ids entries must be non-empty strings", None, None
        s = uid.strip()
        try:
            ObjectId(s)
        except (InvalidId, TypeError):
            return f"whitelist_user_ids contains invalid id '{s}'", None, None
        if s not in seen_users:
            seen_users.add(s)
            clean_user_ids.append(s)
    if len(clean_user_ids) > MAX_WHITELIST_USERS:
        return (
            f"whitelist_user_ids may not exceed {MAX_WHITELIST_USERS} entries",
            None,
            None,
        )
    if clean_user_ids:
        existing = Users.objects(id__in=clean_user_ids).only("id").count()
        if existing != len(clean_user_ids):
            return "whitelist_user_ids contains ids that do not exist", None, None

    return None, clean_roles, clean_user_ids


def _validate_redirect_uris(uris):
    if not isinstance(uris, list) or not uris:
        return "redirect_uris must be a non-empty list"
    for u in uris:
        if not isinstance(u, str) or not u.strip():
            return "redirect_uris entries must be non-empty strings"
        if not (u.startswith("http://") or u.startswith("https://")):
            return f"redirect_uri '{u}' must be http:// or https://"
    return None


@admin_oauth.route("/oauth-clients", methods=["GET"])
@admin_only
def list_oauth_clients():
    clients = OAuthClient.objects().order_by("-created_at")
    return create_response(data={"clients": [_serialize_client(c) for c in clients]})


@admin_oauth.route("/oauth-clients", methods=["POST"])
@admin_only
def create_oauth_client_route():
    data = request.get_json(silent=True) or {}

    client_id = (data.get("client_id") or "").strip()
    client_name = (data.get("client_name") or "").strip()
    client_logo_url = (data.get("client_logo_url") or "").strip() or None
    redirect_uris = data.get("redirect_uris") or []
    allowed_scopes = data.get("allowed_scopes") or []
    is_first_party = bool(data.get("is_first_party", False))
    allow_reserved = bool(data.get("allow_reserved", False))
    whitelist_roles_in = data.get("whitelist_roles", []) or []
    whitelist_user_ids_in = data.get("whitelist_user_ids", []) or []
    bypass_admin = bool(data.get("bypass_admin", False))

    if not client_id or len(client_id) > 128:
        return create_response(
            status=400, message="client_id is required (<=128 chars)"
        )
    if not client_name or len(client_name) > 255:
        return create_response(
            status=400, message="client_name is required (<=255 chars)"
        )

    err = _validate_redirect_uris(redirect_uris)
    if err:
        return create_response(status=400, message=err)

    err = _validate_scopes(allowed_scopes, allow_reserved=allow_reserved)
    if err:
        return create_response(status=400, message=err)

    err, wl_roles, wl_user_ids = _validate_whitelist(
        whitelist_roles_in, whitelist_user_ids_in
    )
    if err:
        return create_response(status=400, message=err)

    if OAuthClient.objects(client_id=client_id).first():
        return create_response(
            status=409, message=f"client_id '{client_id}' already exists"
        )

    secret_plain = secrets.token_urlsafe(48)
    secret_hash = bcrypt.hashpw(secret_plain.encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )

    client = OAuthClient(
        client_id=client_id,
        client_secret_hash=secret_hash,
        client_name=client_name,
        client_logo_url=client_logo_url,
        redirect_uris=list(redirect_uris),
        allowed_scopes=list(allowed_scopes),
        response_types=["code"],
        grant_types=["authorization_code", "refresh_token"],
        token_endpoint_auth_method="client_secret_basic",
        is_first_party=is_first_party,
        is_active=True,
        whitelist_roles=wl_roles,
        whitelist_user_ids=wl_user_ids,
        bypass_admin=bypass_admin,
    )
    client.save()

    logger.info(f"Created OAuth client {client_id}")
    return create_response(
        data={
            "client": _serialize_client(client),
            # Plaintext secret is returned ONCE; the UI is responsible for
            # surfacing it in the secret-once modal and never persisting it.
            "client_secret": secret_plain,
        }
    )


@admin_oauth.route("/oauth-clients/<string:client_id>", methods=["GET"])
@admin_only
def get_oauth_client_route(client_id):
    client = OAuthClient.objects(client_id=client_id).first()
    if not client:
        return create_response(status=404, message="client not found")
    return create_response(data={"client": _serialize_client(client)})


@admin_oauth.route("/oauth-clients/<string:client_id>", methods=["PATCH"])
@admin_only
def update_oauth_client_route(client_id):
    client = OAuthClient.objects(client_id=client_id).first()
    if not client:
        return create_response(status=404, message="client not found")

    data = request.get_json(silent=True) or {}
    allow_reserved = bool(data.get("allow_reserved", False))

    if "client_name" in data:
        name = (data.get("client_name") or "").strip()
        if not name or len(name) > 255:
            return create_response(
                status=400, message="client_name must be 1-255 chars"
            )
        client.client_name = name

    if "client_logo_url" in data:
        logo = data.get("client_logo_url")
        client.client_logo_url = (logo or "").strip() or None

    if "redirect_uris" in data:
        err = _validate_redirect_uris(data.get("redirect_uris"))
        if err:
            return create_response(status=400, message=err)
        client.redirect_uris = list(data["redirect_uris"])

    if "allowed_scopes" in data:
        err = _validate_scopes(
            data.get("allowed_scopes"), allow_reserved=allow_reserved
        )
        if err:
            return create_response(status=400, message=err)
        client.allowed_scopes = list(data["allowed_scopes"])

    if "is_active" in data:
        client.is_active = bool(data["is_active"])

    if "whitelist_roles" in data or "whitelist_user_ids" in data:
        roles_in = (
            data["whitelist_roles"]
            if "whitelist_roles" in data
            else list(client.whitelist_roles or [])
        )
        users_in = (
            data["whitelist_user_ids"]
            if "whitelist_user_ids" in data
            else list(client.whitelist_user_ids or [])
        )
        err, wl_roles, wl_user_ids = _validate_whitelist(roles_in, users_in)
        if err:
            return create_response(status=400, message=err)
        client.whitelist_roles = wl_roles
        client.whitelist_user_ids = wl_user_ids

    if "bypass_admin" in data:
        client.bypass_admin = bool(data["bypass_admin"])

    client.updated_at = datetime.datetime.utcnow()
    client.save()

    return create_response(data={"client": _serialize_client(client)})


@admin_oauth.route("/oauth-clients/<string:client_id>/rotate-secret", methods=["POST"])
@admin_only
def rotate_oauth_client_secret(client_id):
    client = OAuthClient.objects(client_id=client_id).first()
    if not client:
        return create_response(status=404, message="client not found")

    secret_plain = secrets.token_urlsafe(48)
    client.client_secret_hash = bcrypt.hashpw(
        secret_plain.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    client.updated_at = datetime.datetime.utcnow()
    client.save()

    logger.info(f"Rotated secret for OAuth client {client_id}")
    return create_response(
        data={
            "client": _serialize_client(client),
            "client_secret": secret_plain,
        }
    )


@admin_oauth.route(
    "/oauth-clients/<string:client_id>/revoke-all-tokens", methods=["POST"]
)
@admin_only
def revoke_all_oauth_client_tokens(client_id):
    client = OAuthClient.objects(client_id=client_id).first()
    if not client:
        return create_response(status=404, message="client not found")

    access_updated = OAuthAccessToken.objects(
        client_id=client_id, revoked=False
    ).update(revoked=True)
    refresh_updated = OAuthRefreshToken.objects(
        client_id=client_id, revoked=False
    ).update(revoked=True)

    logger.info(
        f"Revoked all tokens for client {client_id} "
        f"(access={access_updated} refresh={refresh_updated})"
    )
    return create_response(
        data={
            "access_tokens_revoked": int(access_updated or 0),
            "refresh_tokens_revoked": int(refresh_updated or 0),
        }
    )


@admin_oauth.route("/oauth-clients/<string:client_id>", methods=["DELETE"])
@admin_only
def delete_oauth_client_route(client_id):
    """Hard-delete a client plus all its grant/consent/token records.

    Guardrails:
    - Client must be `is_active=false` first. Forces admins to deactivate
      (and notice the blast radius in real traffic) before destroying.
    - Admin must echo the `client_id` in the request body as
      `{"confirm_client_id": "<id>"}` to confirm intent.
    - All dependent documents are removed in a best-effort cascade; counts
      are returned for audit.
    """
    client = OAuthClient.objects(client_id=client_id).first()
    if not client:
        return create_response(status=404, message="client not found")

    if client.is_active:
        return create_response(
            status=409,
            message=(
                "Client must be deactivated before deletion. "
                "Set is_active=false first."
            ),
        )

    data = request.get_json(silent=True) or {}
    confirm = (data.get("confirm_client_id") or "").strip()
    if confirm != client_id:
        return create_response(
            status=400,
            message=(
                "confirm_client_id must match the client_id being deleted. "
                "This is a destructive action."
            ),
        )

    access_deleted = OAuthAccessToken.objects(client_id=client_id).delete()
    refresh_deleted = OAuthRefreshToken.objects(client_id=client_id).delete()
    codes_deleted = OAuthAuthorizationCode.objects(client_id=client_id).delete()
    consents_deleted = OAuthConsent.objects(client_id=client_id).delete()
    client.delete()

    logger.info(
        f"Deleted OAuth client {client_id} "
        f"(access={access_deleted} refresh={refresh_deleted} "
        f"codes={codes_deleted} consents={consents_deleted})"
    )
    return create_response(
        data={
            "deleted": True,
            "client_id": client_id,
            "access_tokens_deleted": int(access_deleted or 0),
            "refresh_tokens_deleted": int(refresh_deleted or 0),
            "authorization_codes_deleted": int(codes_deleted or 0),
            "consents_deleted": int(consents_deleted or 0),
        }
    )


def _profile_display_name(firebase_uid, role):
    """Resolve a profile's display name by role; return None if no profile."""
    profile = None
    try:
        role_int = int(role) if role is not None else None
    except (TypeError, ValueError):
        role_int = None
    if role_int == Account.MENTOR.value:
        profile = MentorProfile.objects(firebase_uid=firebase_uid).first()
    elif role_int == Account.MENTEE.value:
        profile = MenteeProfile.objects(firebase_uid=firebase_uid).first()
    elif role_int == Account.PARTNER.value:
        profile = PartnerProfile.objects(firebase_uid=firebase_uid).first()
    if not profile:
        return None
    return getattr(profile, "name", None) or getattr(profile, "person_name", None)


def _user_result(user):
    return {
        "id": str(user.id),
        "email": user.email,
        "role": str(user.role) if user.role is not None else None,
        "name": _profile_display_name(user.firebase_uid, user.role),
    }


@admin_oauth.route("/users/search", methods=["GET"])
@admin_only
def admin_user_search():
    """Search users by email or profile name (icontains) for whitelist UI."""
    q = (request.args.get("q") or "").strip()
    try:
        limit = int(request.args.get("limit", DEFAULT_USER_SEARCH_LIMIT))
    except (TypeError, ValueError):
        limit = DEFAULT_USER_SEARCH_LIMIT
    limit = max(1, min(limit, MAX_USER_SEARCH_LIMIT))

    if not q:
        return create_response(data={"results": []})

    results = []
    seen_ids = set()

    # Phase 1: email substring match on Users.
    email_hits = (
        Users.objects(email__icontains=q)
        .only("id", "email", "role", "firebase_uid")
        .limit(limit)
    )
    for u in email_hits:
        uid = str(u.id)
        if uid in seen_ids:
            continue
        seen_ids.add(uid)
        results.append(_user_result(u))
        if len(results) >= limit:
            break

    # Phase 2: profile-name substring match (mentor/mentee/partner), resolving
    # back to Users via firebase_uid. Only runs if we still have room.
    if len(results) < limit:
        remaining = limit - len(results)
        firebase_uids = set()
        profile_queries = [
            (MentorProfile, "name__icontains"),
            (MenteeProfile, "name__icontains"),
            (PartnerProfile, "person_name__icontains"),
        ]
        for ProfileModel, field in profile_queries:
            for p in (
                ProfileModel.objects(**{field: q})
                .only("firebase_uid")
                .limit(remaining * 2)
            ):
                if getattr(p, "firebase_uid", None):
                    firebase_uids.add(p.firebase_uid)
            if len(firebase_uids) >= remaining * 2:
                break
        if firebase_uids:
            name_hits = (
                Users.objects(firebase_uid__in=list(firebase_uids))
                .only("id", "email", "role", "firebase_uid")
                .limit(remaining * 2)
            )
            for u in name_hits:
                uid = str(u.id)
                if uid in seen_ids:
                    continue
                seen_ids.add(uid)
                results.append(_user_result(u))
                if len(results) >= limit:
                    break

    return create_response(data={"results": results})


@admin_oauth.route("/users", methods=["GET"])
@admin_only
def admin_user_lookup():
    """Bulk-resolve users by id (for hydrating selected labels in the form)."""
    ids_raw = (request.args.get("ids") or "").strip()
    if not ids_raw:
        return create_response(data={"results": []})
    ids = [i.strip() for i in ids_raw.split(",") if i.strip()]
    ids = ids[:MAX_WHITELIST_USERS]
    valid_ids = []
    for i in ids:
        try:
            ObjectId(i)
            valid_ids.append(i)
        except (InvalidId, TypeError):
            continue
    if not valid_ids:
        return create_response(data={"results": []})
    users = Users.objects(id__in=valid_ids).only("id", "email", "role", "firebase_uid")
    return create_response(data={"results": [_user_result(u) for u in users]})
