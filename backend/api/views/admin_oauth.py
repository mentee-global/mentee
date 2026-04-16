"""Admin REST API for managing OAuth clients.

All routes require the caller to be an admin (Firebase `role == 0`).
Only registered when OAUTH_ENABLED is on — see api/__init__.py.
"""
import datetime
import secrets

import bcrypt
from flask import Blueprint, request

from api.core import create_response, logger
from api.models import OAuthAccessToken, OAuthClient, OAuthRefreshToken
from api.utils.require_auth import admin_only


admin_oauth = Blueprint("admin_oauth", __name__)


RESERVED_SCOPE_PREFIX = "mentee.api"


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
