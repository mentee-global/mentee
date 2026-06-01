from flask import Flask
from types import SimpleNamespace

from api.models import MenteeApplication, MenteeProfile
from api.views import admin_dashboard


class FakeProfileObjects:
    def distinct(self, field):
        assert field == "email"
        return ["has-profile@example.com", "completed@example.com"]


class FakeApplicationObjects:
    def only(self, *fields):
        assert fields == ("email", "application_state")
        return [
            SimpleNamespace(
                email="has-profile@example.com", application_state="APPROVED"
            ),
            SimpleNamespace(email="missing@example.com", application_state="APPROVED"),
            SimpleNamespace(email="build@example.com", application_state="BuildProfile"),
            SimpleNamespace(email="completed@example.com", application_state="COMPLETED"),
            SimpleNamespace(email="pending@example.com", application_state="PENDING"),
        ]


class FakeApplicationModel:
    objects = FakeApplicationObjects()


class FakeProfileModel:
    objects = FakeProfileObjects()


def test_identity_breakdown_filters_empty_values_and_returns_total(monkeypatch):
    captured = {}

    def fake_aggregate(model, pipeline):
        captured["model"] = model
        captured["pipeline"] = pipeline
        return [{"value": "woman", "count": 2}, {"value": "man", "count": 1}]

    monkeypatch.setattr(admin_dashboard, "_aggregate", fake_aggregate)

    items, total = admin_dashboard._identity_breakdown(MenteeApplication, "identify")

    assert items == [{"value": "woman", "count": 2}, {"value": "man", "count": 1}]
    assert total == 3
    assert captured["model"] == MenteeApplication
    assert captured["pipeline"][0] == {
        "$match": {"identify": {"$exists": True, "$nin": [None, "", " "]}}
    }


def test_summary_conversion_matches_approved_applications_to_profiles():
    result = admin_dashboard._summary_conversion(FakeApplicationModel, FakeProfileModel)

    assert result == {
        "total_applications": 5,
        "approved_or_later": 4,
        "profile_created_from_approved": 2,
        "profile_conversion_rate": 50.0,
        "approved_without_profile": 2,
        "build_profile_without_profile": 1,
        "completed_without_profile": 0,
    }


def test_demographics_identify_returns_application_meta(monkeypatch):
    app = Flask(__name__)

    def fake_identity_breakdown(model, field):
        assert model == MenteeApplication
        assert field == "identify"
        return [{"value": "woman", "count": 4}], 4

    monkeypatch.setattr(admin_dashboard, "_identity_breakdown", fake_identity_breakdown)

    with app.test_request_context(
        "/api/admin/dashboard/demographics/identify?source=mentee"
    ):
        response, status = admin_dashboard.demographics_identify.__wrapped__()

    payload = response.get_json()["result"]
    assert status == 200
    assert payload["items"] == [{"value": "woman", "count": 4}]
    assert payload["meta"] == {
        "source": "mentee",
        "population": "applications",
        "field": "identify",
        "scope": "all statuses",
        "total": 4,
    }


def test_demographics_identify_returns_profile_meta(monkeypatch):
    app = Flask(__name__)

    def fake_identity_breakdown(model, field):
        assert model == MenteeProfile
        assert field == "gender"
        return [{"value": "lgbtq+", "count": 2}], 2

    monkeypatch.setattr(admin_dashboard, "_identity_breakdown", fake_identity_breakdown)

    with app.test_request_context(
        "/api/admin/dashboard/demographics/identify?source=mentee&population=profiles"
    ):
        response, status = admin_dashboard.demographics_identify.__wrapped__()

    payload = response.get_json()["result"]
    assert status == 200
    assert payload["items"] == [{"value": "lgbtq+", "count": 2}]
    assert payload["meta"] == {
        "source": "mentee",
        "population": "profiles",
        "field": "gender",
        "scope": "current profiles",
        "total": 2,
    }


def test_demographics_identify_rejects_mentor_profiles():
    app = Flask(__name__)

    with app.test_request_context(
        "/api/admin/dashboard/demographics/identify?source=mentor&population=profiles"
    ):
        response, status = admin_dashboard.demographics_identify.__wrapped__()

    payload = response.get_json()
    assert status == 400
    assert payload["message"] == "Profile identity breakdown is only available for mentees"
