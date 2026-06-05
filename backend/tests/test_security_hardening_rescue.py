from flask import Flask

from api.utils.web_security import WebSecurityMiddleware


def test_web_security_middleware_adds_headers():
    app = Flask(__name__)

    @app.route("/")
    def index():
        return "ok"

    WebSecurityMiddleware(app)

    response = app.test_client().get("/")

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"


def test_web_security_middleware_hsts_only_in_production(monkeypatch):
    app = Flask(__name__)

    @app.route("/")
    def index():
        return "ok"

    WebSecurityMiddleware(app)

    monkeypatch.delenv("FLASK_ENV", raising=False)
    assert "Strict-Transport-Security" not in app.test_client().get("/").headers

    monkeypatch.setenv("FLASK_ENV", "production")
    assert "Strict-Transport-Security" in app.test_client().get("/").headers
