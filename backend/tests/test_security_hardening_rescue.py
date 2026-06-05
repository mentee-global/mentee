from flask import Blueprint, Flask

from api.utils import web_security
from api.utils.web_security import WebSecurityMiddleware
from api.views.auth import _coerce_firebase_expires_in


def test_coerce_firebase_expires_in_to_float():
    firebase_user = {"expiresIn": "3600"}

    _coerce_firebase_expires_in(firebase_user)

    assert firebase_user["expiresIn"] == 3600.0


def test_coerce_firebase_expires_in_falls_back_to_default():
    firebase_user = {"expiresIn": "not-a-number"}

    _coerce_firebase_expires_in(firebase_user)

    assert firebase_user["expiresIn"] == 3600


def test_web_security_middleware_adds_headers():
    app = Flask(__name__)
    app.secret_key = "test-secret"

    @app.route("/")
    def index():
        return "ok"

    WebSecurityMiddleware(app)

    response = app.test_client().get("/")

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"


def test_web_security_auth_rate_limit_passes_client_id_keyword(monkeypatch):
    app = Flask(__name__)
    app.secret_key = "test-secret"
    auth = Blueprint("auth", __name__)
    captured = {}

    @auth.route("/login")
    def login():
        return "ok"

    def fake_is_rate_limited(*, client_id, max_requests, window_seconds):
        captured["client_id"] = client_id
        captured["max_requests"] = max_requests
        captured["window_seconds"] = window_seconds
        return False, None

    monkeypatch.setattr(
        web_security.rate_limiter, "is_rate_limited", fake_is_rate_limited
    )

    app.register_blueprint(auth, url_prefix="/auth")
    WebSecurityMiddleware(app)

    response = app.test_client().get("/auth/login")

    assert response.status_code == 200
    assert captured == {
        "client_id": None,
        "max_requests": 10,
        "window_seconds": 600,
    }
