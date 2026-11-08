import importlib.util
import json
import os
from pathlib import Path
from types import SimpleNamespace

import pytest
from flask import Flask
from pymongo.errors import ConnectionFailure

from api.utils import request_utils
from api.views import app_blueprint, main


entrypoint_path = (
    Path(__file__).resolve().parents[1] / "scripts" / "railway_entrypoint.py"
)
spec = importlib.util.spec_from_file_location("railway_entrypoint", entrypoint_path)
entrypoint = importlib.util.module_from_spec(spec)
spec.loader.exec_module(entrypoint)


@pytest.fixture
def preview_environment(monkeypatch):
    values = {
        "RAILWAY_PREVIEW": "true",
        "MONGO_URI": "mongodb://mongo.railway.internal:27017/?authSource=admin",
        "MONGO_DB": "mentee_preview",
        "GOOGLE_CREDENTIALS_JSON": json.dumps({"project_id": "mentee-preview"}),
        "REACT_APP_FIREBASE_CONFIG": json.dumps(
            {
                "projectId": "mentee-preview",
                "apiKey": "preview-test-key",
                "authDomain": "mentee-preview.firebaseapp.com",
                "storageBucket": "mentee-preview.appspot.com",
            }
        ),
        "GCS_BUCKET": "mentee-preview-images",
        "EMAIL_DELIVERY_ENABLED": "true",
        "SMS_DELIVERY_ENABLED": "true",
    }
    for key, value in values.items():
        monkeypatch.setenv(key, value)
    for key in ("FIREBASE_API_KEY", "FIREBASE_AUTH_DOMAIN", "FIREBASE_STORAGE_BUCKET"):
        monkeypatch.setenv(key, os.environ.get(key, ""))


@pytest.mark.parametrize(
    "key,value",
    [
        ("MONGO_URI", "mongodb+srv://cluster.example.mongodb.net"),
        ("MONGO_URI", "mongodb://mongo.railway.internal:27017/mentee"),
        ("MONGO_DB", "mentee"),
        ("GOOGLE_CREDENTIALS_JSON", "{}"),
        ("GCS_BUCKET", "app-mentee-global-images"),
        ("REACT_APP_FIREBASE_CONFIG", '{"projectId":"mentee-d0304"}'),
    ],
)
def test_preview_rejects_unsafe_configuration(
    preview_environment, monkeypatch, key, value
):
    monkeypatch.setenv(key, value)

    with pytest.raises(RuntimeError):
        entrypoint.prepare_environment()


@pytest.mark.parametrize("uri_database", ["", "/", "/mentee"])
def test_preview_accepts_verified_development_atlas(monkeypatch, uri_database):
    monkeypatch.setenv(
        "MONGO_URI", f"mongodb+srv://cluster0.bjvbg.mongodb.net{uri_database}"
    )
    monkeypatch.setenv("MONGO_DB", "mentee")

    entrypoint.validate_preview_database()


@pytest.mark.parametrize(
    "uri",
    [
        "mongodb+srv://cluster0.vr5uq.mongodb.net/mentee",
        "mongodb://cluster0-shard-00-00.vr5uq.mongodb.net:27017/mentee",
        "mongodb://cluster0.bjvbg.mongodb.net:27017,cluster0.vr5uq.mongodb.net:27017/mentee",
        "mongodb+srv://cluster0.bjvbg.mongodb.net.example.org/mentee",
        "mongodb://mongo.railway.internal.example.org:27017/mentee",
        "https://cluster0.bjvbg.mongodb.net/mentee",
    ],
)
def test_preview_rejects_production_and_unverified_database_hosts(monkeypatch, uri):
    monkeypatch.setenv("MONGO_URI", uri)
    monkeypatch.setenv("MONGO_DB", "mentee")

    with pytest.raises(RuntimeError):
        entrypoint.validate_preview_database()


@pytest.mark.parametrize(
    "uri,database",
    [
        ("mongodb+srv://cluster0.bjvbg.mongodb.net/other", "mentee"),
        ("mongodb+srv://cluster0.bjvbg.mongodb.net/mentee", "other"),
    ],
)
def test_development_atlas_requires_its_verified_database(monkeypatch, uri, database):
    monkeypatch.setenv("MONGO_URI", uri)
    monkeypatch.setenv("MONGO_DB", database)

    with pytest.raises(RuntimeError):
        entrypoint.validate_preview_database()


def test_preview_cannot_fall_back_to_legacy_production_connection(monkeypatch):
    monkeypatch.delenv("MONGO_URI", raising=False)
    monkeypatch.setenv("MONGO_HOST", "mongodb+srv://cluster0.vr5uq.mongodb.net/mentee")
    monkeypatch.setenv("MONGO_DB", "mentee")

    with pytest.raises(RuntimeError):
        entrypoint.validate_preview_database()


@pytest.mark.parametrize(
    "uri,database",
    [
        ("mongodb+srv://cluster0.vr5uq.mongodb.net/mentee", "mentee"),
        ("mongodb://mongodb.railway.internal:27017/mentee", "mentee"),
        ("mongodb://mongodb-x6fv.railway.internal:27017/mentee_preview", "mentee"),
        ("mongodb://mongodb-x6fv.railway.internal:27017/mentee", "mentee_preview"),
        ("mongodb://mongodb-prod.railway.internal:27017/mentee", "mentee"),
    ],
)
def test_railway_production_rejects_other_databases(monkeypatch, uri, database):
    monkeypatch.setenv("MONGO_URI", uri)
    monkeypatch.setenv("MONGO_DB", database)

    with pytest.raises(RuntimeError):
        entrypoint.validate_production_database()


def test_railway_production_accepts_private_database(monkeypatch):
    monkeypatch.setenv(
        "MONGO_URI", "mongodb://mongodb-x6fv.railway.internal:27017/mentee"
    )
    monkeypatch.setenv("MONGO_DB", "mentee")

    entrypoint.validate_production_database()


@pytest.mark.parametrize(
    "bucket,credential_project,firebase_project",
    [
        ("mentee-dev-files", "mentee-d0304", "mentee-d0304"),
        ("mentee-prod-files-wciuvo4", "other-project", "mentee-d0304"),
        ("mentee-prod-files-wciuvo4", "mentee-d0304", "other-project"),
    ],
)
def test_railway_production_rejects_wrong_storage_or_firebase(
    monkeypatch, bucket, credential_project, firebase_project
):
    monkeypatch.setenv("RAILWAY_ENVIRONMENT_NAME", "production")
    monkeypatch.setenv("RAILWAY_PREVIEW", "false")
    monkeypatch.setenv(
        "MONGO_URI", "mongodb://mongodb-x6fv.railway.internal:27017/mentee"
    )
    monkeypatch.setenv("MONGO_DB", "mentee")
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", bucket)
    monkeypatch.setenv("RAILWAY_PUBLIC_DOMAIN", "web-prod.example.test")
    monkeypatch.setenv(
        "GOOGLE_CREDENTIALS_JSON", json.dumps({"project_id": credential_project})
    )
    monkeypatch.setenv(
        "REACT_APP_FIREBASE_CONFIG", json.dumps({"projectId": firebase_project})
    )

    with pytest.raises(RuntimeError):
        entrypoint.prepare_environment()


@pytest.mark.parametrize("project_id", ["mentee-preview", "mentee-d0304"])
def test_preview_disables_delivery_and_materializes_private_credentials(
    preview_environment, monkeypatch, project_id
):
    monkeypatch.setenv(
        "GOOGLE_CREDENTIALS_JSON", json.dumps({"project_id": project_id})
    )
    firebase_config = json.loads(os.environ["REACT_APP_FIREBASE_CONFIG"])
    firebase_config.update(
        projectId=project_id,
        authDomain=f"{project_id}.firebaseapp.com",
        storageBucket=f"{project_id}.appspot.com",
    )
    monkeypatch.setenv("REACT_APP_FIREBASE_CONFIG", json.dumps(firebase_config))
    monkeypatch.setenv("MONGO_URI", "mongodb+srv://cluster0.bjvbg.mongodb.net/mentee")
    monkeypatch.setenv("MONGO_DB", "mentee")
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    entrypoint.prepare_environment()
    credentials_path = Path(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
    try:
        assert os.environ["EMAIL_DELIVERY_ENABLED"] == "false"
        assert os.environ["SMS_DELIVERY_ENABLED"] == "false"
        assert os.environ["FIREBASE_API_KEY"] == "preview-test-key"
        assert os.environ["FIREBASE_AUTH_DOMAIN"] == f"{project_id}.firebaseapp.com"
        assert os.environ["FIREBASE_STORAGE_BUCKET"] == f"{project_id}.appspot.com"
        assert os.environ["GCS_BUCKET"] == "mentee-preview-images"
        assert credentials_path.stat().st_mode & 0o777 == 0o600
        assert json.loads(credentials_path.read_text()) == {"project_id": project_id}
    finally:
        credentials_path.unlink()


def test_shared_firebase_still_rejects_production_bucket(
    preview_environment, monkeypatch
):
    monkeypatch.setenv("GOOGLE_CREDENTIALS_JSON", '{"project_id":"mentee-d0304"}')
    firebase_config = json.loads(os.environ["REACT_APP_FIREBASE_CONFIG"])
    firebase_config["projectId"] = "mentee-d0304"
    monkeypatch.setenv("REACT_APP_FIREBASE_CONFIG", json.dumps(firebase_config))
    monkeypatch.setenv("GCS_BUCKET", "app-mentee-global-images")

    with pytest.raises(RuntimeError, match="separate object storage"):
        entrypoint.prepare_environment()


def test_preview_accepts_railway_storage_with_production_gcs_bucket(
    preview_environment, monkeypatch
):
    monkeypatch.setenv("GCS_BUCKET", "app-mentee-global-images")
    monkeypatch.setenv("AWS_S3_BUCKET_NAME", "mentee-dev-files")
    monkeypatch.setenv("AWS_ENDPOINT_URL", "https://storage.example.test")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-access")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.setenv("RAILWAY_PUBLIC_DOMAIN", "preview.example.test")

    entrypoint.prepare_environment()
    credentials_path = Path(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
    credentials_path.unlink()

    assert os.environ["EMAIL_DELIVERY_ENABLED"] == "false"
    assert os.environ["SMS_DELIVERY_ENABLED"] == "false"


def test_disabled_email_never_constructs_sendgrid_client(monkeypatch):
    monkeypatch.setenv("EMAIL_DELIVERY_ENABLED", "false")

    def unexpected_client(*args, **kwargs):
        pytest.fail("Disabled delivery must not construct a SendGrid client")

    monkeypatch.setattr(request_utils, "SendGridAPIClient", unexpected_client)

    assert request_utils.send_email("test@example.org") == (
        False,
        "Email delivery disabled",
    )
    assert request_utils.send_email_html(
        "test@example.org", inline_image_path="/missing/image.png"
    ) == (False, "Email delivery disabled")


def test_disabled_sms_never_calls_twilio(monkeypatch):
    monkeypatch.setenv("SMS_DELIVERY_ENABLED", "false")

    def unexpected_send(**kwargs):
        pytest.fail("Disabled delivery must not call Twilio")

    monkeypatch.setattr(
        request_utils,
        "twilio_client",
        SimpleNamespace(messages=SimpleNamespace(create=unexpected_send)),
    )

    assert request_utils.send_sms("Test", "+15555550123") == (
        False,
        "SMS delivery disabled",
    )


@pytest.mark.parametrize("database_available", [True, False])
def test_health_reports_database_readiness(monkeypatch, database_available):
    def ping(command):
        assert command == "ping"
        if not database_available:
            raise ConnectionFailure("Private connection details")

    monkeypatch.setattr(
        app_blueprint,
        "get_connection",
        lambda: SimpleNamespace(admin=SimpleNamespace(command=ping)),
    )
    app = Flask(__name__)
    app.register_blueprint(app_blueprint.app_blueprint)

    response = app.test_client().get("/health")

    assert response.status_code == (200 if database_available else 503)
    assert response.json == {"status": "ok" if database_available else "unavailable"}


def test_preview_storage_serves_images_and_downloads_bug_attachments(monkeypatch):
    monkeypatch.setattr(
        main,
        "read_railway_file",
        lambda filename: (b"file content", "text/html"),
    )
    app = Flask(__name__)
    app.register_blueprint(main.main, url_prefix="/api")
    client = app.test_client()

    image = client.get("/api/storage/images/test.jpg")
    attachment = client.get("/api/storage/bug-reports/test.html")
    rejected = client.get("/api/storage/other/test.html")

    assert image.status_code == 200
    assert image.headers["X-Content-Type-Options"] == "nosniff"
    assert image.headers.get("Content-Disposition", "").startswith("inline")
    assert attachment.status_code == 200
    assert attachment.headers["Content-Disposition"].startswith("attachment")
    assert attachment.headers["X-Content-Type-Options"] == "nosniff"
    assert rejected.status_code == 404
