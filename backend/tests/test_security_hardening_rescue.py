from flask import Blueprint, Flask

from api.utils import web_security
from api.utils.web_security import RateLimiter, WebSecurityMiddleware
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

    csp = response.headers["Content-Security-Policy"]
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "default-src 'self'" in csp
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    # Clickjacking defense (also what /oauth/* relies on).
    assert "frame-ancestors 'none'" in csp
    # 8x8 video iframe must be allowed by both the CSP and the permissions policy.
    assert "frame-src 'self' https://8x8.vc" in csp
    assert 'camera=(self "https://8x8.vc")' in response.headers["Permissions-Policy"]
    assert (
        'microphone=(self "https://8x8.vc")' in response.headers["Permissions-Policy"]
    )


def test_web_security_auth_rate_limit_passes_client_id_keyword(monkeypatch):
    app = Flask(__name__)
    app.secret_key = "test-secret"
    auth = Blueprint("auth", __name__)
    captured = {}

    @auth.route("/login", methods=["POST"])
    def login():
        return "ok"

    def fake_is_rate_limited(*, client_id, max_requests, window_seconds, endpoint):
        captured["client_id"] = client_id
        captured["max_requests"] = max_requests
        captured["window_seconds"] = window_seconds
        captured["endpoint"] = endpoint
        return False, None

    monkeypatch.setattr(
        web_security.rate_limiter, "is_rate_limited", fake_is_rate_limited
    )

    app.register_blueprint(auth)
    WebSecurityMiddleware(app)

    response = app.test_client().post("/login")

    assert response.status_code == 200
    assert captured == {
        "client_id": None,
        "max_requests": web_security.AUTH_RATE_LIMIT_MAX_REQUESTS,
        "window_seconds": web_security.AUTH_RATE_LIMIT_WINDOW_SECONDS,
        "endpoint": "auth.login",
    }


def test_security_check_excludes_refresh_and_logout(monkeypatch):
    """Token refresh and logout must never be throttled (active-session safety)."""
    app = Flask(__name__)
    app.secret_key = "test-secret"
    auth = Blueprint("auth", __name__)
    calls = []

    @auth.route("/refreshToken", methods=["POST"])
    def refresh_token():
        return "ok"

    @auth.route("/logout", methods=["POST"])
    def logout():
        return "ok"

    monkeypatch.setattr(
        web_security.rate_limiter,
        "is_rate_limited",
        lambda **kwargs: calls.append(kwargs) or (False, None),
    )

    app.register_blueprint(auth)
    WebSecurityMiddleware(app)
    client = app.test_client()

    assert client.post("/refreshToken").status_code == 200
    assert client.post("/logout").status_code == 200
    assert calls == []


def test_rate_limiter_blocks_after_threshold_and_segregates_by_endpoint():
    app = Flask(__name__)
    limiter = RateLimiter()

    with app.test_request_context("/", headers={"User-Agent": "agent"}):
        for _ in range(3):
            limited, _ = limiter.is_rate_limited(
                max_requests=3, window_seconds=60, endpoint="auth.login"
            )
            assert limited is False
        # 4th request to the same endpoint trips the limit.
        limited, message = limiter.is_rate_limited(
            max_requests=3, window_seconds=60, endpoint="auth.login"
        )
        assert limited is True
        assert message

        # A different endpoint has its own budget and is unaffected.
        other_limited, _ = limiter.is_rate_limited(
            max_requests=3, window_seconds=60, endpoint="auth.register"
        )
        assert other_limited is False


def test_rate_limiter_uses_leftmost_forwarded_for_ip():
    app = Flask(__name__)
    limiter = RateLimiter()

    with app.test_request_context(
        "/",
        headers={"User-Agent": "agent", "X-Forwarded-For": "1.2.3.4, 10.0.0.1"},
    ):
        client_id = limiter._get_client_id()

    with app.test_request_context(
        "/",
        headers={"User-Agent": "agent", "X-Forwarded-For": "1.2.3.4, 10.0.0.2"},
    ):
        # Same client, different downstream proxy hop -> same bucket.
        assert limiter._get_client_id() == client_id
