from flask import Flask, g

from api.utils import require_auth
from api.utils.constants import Account
from api.utils.require_auth import AUTHORIZED, UNAUTHORIZED, ALL_USERS


def _app():
    app = Flask(__name__)
    app.config["TESTING"] = True
    return app


def _claims(role=Account.MENTOR.value):
    return {
        "uid": "firebase-user-1",
        "role": role,
        "iat": 1_000.0,
        "exp": 2_000.0,
    }


def test_verify_user_strips_bearer_prefix_and_checks_revocation(monkeypatch):
    captured = {}

    def verify_id_token(token, check_revoked=False):
        captured["token"] = token
        captured["check_revoked"] = check_revoked
        return _claims()

    monkeypatch.setattr(require_auth.time, "time", lambda: 1_100.0)
    monkeypatch.setattr(
        require_auth.firebase_admin_auth, "verify_id_token", verify_id_token
    )

    app = _app()
    with app.test_request_context(headers={"Authorization": "Bearer mock-token"}):
        assert require_auth.verify_user(Account.MENTOR) == (AUTHORIZED, None)
        assert g.auth_claims["uid"] == "firebase-user-1"

    assert captured == {"token": "mock-token", "check_revoked": True}


def test_verify_user_rejects_empty_bearer_token():
    app = _app()
    with app.test_request_context(headers={"Authorization": "Bearer   "}):
        authorized, response = require_auth.verify_user(Account.MENTOR)

    assert authorized == UNAUTHORIZED
    assert response[1] == 401


def test_verify_user_rejects_future_iat(monkeypatch):
    claims = _claims()
    claims["iat"] = 1_200.1

    monkeypatch.setattr(require_auth.time, "time", lambda: 1_100.0)
    monkeypatch.setattr(
        require_auth.firebase_admin_auth,
        "verify_id_token",
        lambda token, check_revoked=False: claims,
    )

    app = _app()
    with app.test_request_context(headers={"Authorization": "mock-token"}):
        authorized, response = require_auth.verify_user(Account.MENTOR)

    assert authorized == UNAUTHORIZED
    assert response[1] == 401


def test_verify_user_all_users_still_sets_claims(monkeypatch):
    monkeypatch.setattr(require_auth.time, "time", lambda: 1_100.0)
    monkeypatch.setattr(
        require_auth.firebase_admin_auth,
        "verify_id_token",
        lambda token, check_revoked=False: _claims(Account.SUPPORT.value),
    )

    app = _app()
    with app.test_request_context(headers={"Authorization": "mock-token"}):
        assert require_auth.verify_user(ALL_USERS) == (AUTHORIZED, None)
        assert g.auth_claims["role"] == Account.SUPPORT.value


def test_get_optional_claims_uses_revocation_check(monkeypatch):
    captured = {}

    def verify_id_token(token, check_revoked=False):
        captured["check_revoked"] = check_revoked
        return _claims()

    monkeypatch.setattr(require_auth.time, "time", lambda: 1_100.0)
    monkeypatch.setattr(
        require_auth.firebase_admin_auth, "verify_id_token", verify_id_token
    )

    app = _app()
    with app.test_request_context(headers={"Authorization": "Bearer optional-token"}):
        assert require_auth.get_optional_claims()["uid"] == "firebase-user-1"

    assert captured["check_revoked"] is True
