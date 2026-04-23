"""Integration tests for MenteeRefreshTokenGrant.

Exercises the refresh-token grant end-to-end through the Flask test client
against the same Mongo/Authlib wiring the app uses in production. Each test
seeds its own Users / OAuthClient / OAuthRefreshToken rows and tears them
down, so the suite can run against a shared dev database without leaking
state between runs.

Requires OAUTH_ENABLED=true in the environment (so the `/oauth/*` blueprint
and grants are registered); skips otherwise.
"""

import base64
import datetime
import os
import secrets
import uuid

import bcrypt
import pytest

from api.models import (
    OAuthAccessToken,
    OAuthClient,
    OAuthRefreshToken,
    Users,
)
from api.utils.oauth_server import sha256_hex


pytestmark = pytest.mark.skipif(
    os.environ.get("OAUTH_ENABLED", "false").lower() != "true",
    reason="refresh-token grant is only wired when OAUTH_ENABLED=true",
)


@pytest.fixture
def oauth_env(client):
    """Create a client + user + initial refresh/access pair and yield handles."""
    client_id = f"test-refresh-{uuid.uuid4().hex[:8]}"
    secret_plain = secrets.token_urlsafe(24)
    secret_hash = bcrypt.hashpw(secret_plain.encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )

    oauth_client = OAuthClient(
        client_id=client_id,
        client_secret_hash=secret_hash,
        client_name="refresh-grant-tests",
        redirect_uris=["http://localhost:8001/cb"],
        allowed_scopes=["openid", "email", "profile", "mentee.role"],
        response_types=["code"],
        grant_types=["authorization_code", "refresh_token"],
        token_endpoint_auth_method="client_secret_basic",
        is_first_party=True,
        is_active=True,
    )
    oauth_client.save()

    user = Users(
        firebase_uid=f"test-fb-{uuid.uuid4().hex[:8]}",
        email=f"refresh-{uuid.uuid4().hex[:8]}@example.test",
        role="2",
        verified=True,
        token_version=0,
    )
    user.save()

    refresh_plain = secrets.token_urlsafe(48)
    access_plain = secrets.token_urlsafe(32)
    now = datetime.datetime.utcnow()
    refresh = OAuthRefreshToken(
        token_hash=sha256_hex(refresh_plain),
        client_id=client_id,
        user_id=str(user.id),
        scope="openid email profile mentee.role",
        rotated_from=f"code:seed-{uuid.uuid4().hex[:8]}",
        token_version=0,
        created_at=now,
        expires_at=now + datetime.timedelta(days=30),
    )
    refresh.save()
    original_access = OAuthAccessToken(
        token_hash=sha256_hex(access_plain),
        client_id=client_id,
        user_id=str(user.id),
        scope="openid email profile mentee.role",
        parent_refresh_token_id=refresh.rotated_from,
        created_at=now,
        expires_at=now + datetime.timedelta(seconds=3600),
    )
    original_access.save()

    yield {
        "client": client,
        "oauth_client": oauth_client,
        "client_id": client_id,
        "client_secret": secret_plain,
        "user": user,
        "refresh_plain": refresh_plain,
        "refresh": refresh,
        "access_plain": access_plain,
        "original_access": original_access,
    }

    OAuthAccessToken.objects(client_id=client_id).delete()
    OAuthRefreshToken.objects(client_id=client_id).delete()
    OAuthClient.objects(client_id=client_id).delete()
    Users.objects(id=user.id).delete()


def _basic_auth(client_id: str, secret: str) -> str:
    raw = f"{client_id}:{secret}".encode("utf-8")
    return "Basic " + base64.b64encode(raw).decode("ascii")


def _post_refresh(client, refresh_token, client_id, client_secret):
    return client.post(
        "/oauth/token",
        data={"grant_type": "refresh_token", "refresh_token": refresh_token},
        headers={
            "Authorization": _basic_auth(client_id, client_secret),
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )


def test_refresh_issues_new_pair_and_revokes_old(oauth_env):
    response = _post_refresh(
        oauth_env["client"],
        oauth_env["refresh_plain"],
        oauth_env["client_id"],
        oauth_env["client_secret"],
    )

    assert response.status_code == 200, response.get_data(as_text=True)
    body = response.get_json()
    assert body["token_type"].lower() == "bearer"
    assert body["access_token"] and body["access_token"] != oauth_env["access_plain"]
    assert body["refresh_token"] and body["refresh_token"] != oauth_env["refresh_plain"]
    assert body["expires_in"] == 3600
    assert "openid" in body["scope"].split()

    old = OAuthRefreshToken.objects(id=oauth_env["refresh"].id).first()
    assert old is not None and old.revoked is True

    new_refresh = OAuthRefreshToken.objects(
        token_hash=sha256_hex(body["refresh_token"])
    ).first()
    assert new_refresh is not None
    assert new_refresh.revoked is False
    assert new_refresh.rotated_from == str(oauth_env["refresh"].id)
    assert new_refresh.token_version == 0

    new_access = OAuthAccessToken.objects(
        token_hash=sha256_hex(body["access_token"])
    ).first()
    assert new_access is not None
    assert new_access.revoked is False
    assert new_access.parent_refresh_token_id == str(new_refresh.id)


def test_refresh_replay_burns_family(oauth_env):
    first = _post_refresh(
        oauth_env["client"],
        oauth_env["refresh_plain"],
        oauth_env["client_id"],
        oauth_env["client_secret"],
    )
    assert first.status_code == 200
    body = first.get_json()
    new_refresh_plain = body["refresh_token"]

    replay = _post_refresh(
        oauth_env["client"],
        oauth_env["refresh_plain"],
        oauth_env["client_id"],
        oauth_env["client_secret"],
    )
    assert replay.status_code == 400
    assert replay.get_json()["error"] == "invalid_grant"

    descendant = OAuthRefreshToken.objects(
        token_hash=sha256_hex(new_refresh_plain)
    ).first()
    assert descendant is not None and descendant.revoked is True

    next_use = _post_refresh(
        oauth_env["client"],
        new_refresh_plain,
        oauth_env["client_id"],
        oauth_env["client_secret"],
    )
    assert next_use.status_code == 400
    assert next_use.get_json()["error"] == "invalid_grant"


def test_refresh_rejects_after_token_version_bump(oauth_env):
    user = oauth_env["user"]
    user.token_version = 1
    user.save()

    response = _post_refresh(
        oauth_env["client"],
        oauth_env["refresh_plain"],
        oauth_env["client_id"],
        oauth_env["client_secret"],
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "invalid_grant"

    stored = OAuthRefreshToken.objects(id=oauth_env["refresh"].id).first()
    assert stored.revoked is False


def test_refresh_rejects_after_whitelist_tightened(oauth_env):
    oc = oauth_env["oauth_client"]
    oc.whitelist_user_ids = [f"other-{uuid.uuid4().hex}"]
    oc.save()

    response = _post_refresh(
        oauth_env["client"],
        oauth_env["refresh_plain"],
        oauth_env["client_id"],
        oauth_env["client_secret"],
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "invalid_grant"

    stored = OAuthRefreshToken.objects(id=oauth_env["refresh"].id).first()
    assert stored.revoked is False
