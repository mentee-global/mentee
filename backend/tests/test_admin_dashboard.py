from flask import Flask
from types import SimpleNamespace

from api.models import MenteeApplication, MenteeProfile, MentorProfile
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
            SimpleNamespace(
                email="build@example.com", application_state="BuildProfile"
            ),
            SimpleNamespace(
                email="completed@example.com", application_state="COMPLETED"
            ),
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


def test_period_delta_returns_percent_change_or_none():
    assert admin_dashboard._period_delta(15, 10) == 50.0
    assert admin_dashboard._period_delta(5, 10) == -50.0
    assert admin_dashboard._period_delta(5, 0) is None


def test_top_supply_demand_gaps_compares_current_profiles(monkeypatch):
    def fake_aggregate(model, pipeline):
        if model == MenteeProfile:
            return [
                {"_id": "Scholarships", "demand": 9},
                {"_id": "Career", "demand": 3},
            ]
        if model == MentorProfile:
            assert pipeline[0]["$match"]["$and"][0]["$or"][0] == {
                "taking_appointments": True
            }
            return [
                {"_id": "Scholarships", "supply": 2},
                {"_id": "Career", "supply": 5},
            ]
        raise AssertionError("Unexpected model")

    monkeypatch.setattr(admin_dashboard, "_aggregate", fake_aggregate)

    assert admin_dashboard._top_supply_demand_gaps() == [
        {"topic": "Scholarships", "demand": 9, "supply": 2, "gap": 7},
        {"topic": "Career", "demand": 3, "supply": 5, "gap": -2},
    ]


def test_summary_overview_does_not_block_on_executive_metrics(monkeypatch):
    app = Flask(__name__)

    monkeypatch.setattr(admin_dashboard, "_summary_users", lambda: {"total": 1})
    monkeypatch.setattr(admin_dashboard, "_summary_appointments", lambda now: {})
    monkeypatch.setattr(admin_dashboard, "_summary_messaging", lambda now: {})
    monkeypatch.setattr(admin_dashboard, "_summary_ops", lambda now: {})

    def fail_executive(now):
        raise AssertionError("overview should not compute executive metrics")

    monkeypatch.setattr(admin_dashboard, "_summary_executive", fail_executive)

    with app.test_request_context("/api/admin/dashboard/summary?section=overview"):
        response, status = admin_dashboard.summary.__wrapped__()

    payload = response.get_json()["result"]["summary"]
    assert status == 200
    assert payload["section"] == "overview"
    assert "users" in payload
    assert "appointments" in payload
    assert "messaging" in payload
    assert "ops" in payload
    assert "executive" not in payload


def test_summary_without_section_defaults_to_fast_overview(monkeypatch):
    app = Flask(__name__)

    monkeypatch.setattr(admin_dashboard, "_summary_users", lambda: {"total": 1})
    monkeypatch.setattr(admin_dashboard, "_summary_appointments", lambda now: {})
    monkeypatch.setattr(admin_dashboard, "_summary_messaging", lambda now: {})
    monkeypatch.setattr(admin_dashboard, "_summary_ops", lambda now: {})

    def fail_executive(now):
        raise AssertionError("default summary should not compute all metrics")

    monkeypatch.setattr(admin_dashboard, "_summary_executive", fail_executive)

    with app.test_request_context("/api/admin/dashboard/summary"):
        response, status = admin_dashboard.summary.__wrapped__()

    payload = response.get_json()["result"]["summary"]
    assert status == 200
    assert payload["section"] == "overview"
    assert "executive" not in payload


def test_summary_executive_can_load_independently(monkeypatch):
    app = Flask(__name__)

    monkeypatch.setattr(
        admin_dashboard,
        "_summary_executive",
        lambda now: {"active_mentees_30d": 3},
    )

    with app.test_request_context("/api/admin/dashboard/summary?section=executive"):
        response, status = admin_dashboard.summary.__wrapped__()

    payload = response.get_json()["result"]["summary"]
    assert status == 200
    assert payload["section"] == "executive"
    assert payload["executive"] == {"active_mentees_30d": 3}
    assert "users" not in payload


def test_applications_overview_returns_batched_payload(monkeypatch):
    app = Flask(__name__)

    monkeypatch.setattr(
        admin_dashboard, "_summary_funnel", lambda model: {"APPROVED": 1}
    )
    monkeypatch.setattr(
        admin_dashboard,
        "_summary_conversion",
        lambda app_model, profile_model: {"profile_conversion_rate": 50.0},
    )
    monkeypatch.setattr(
        admin_dashboard,
        "_applications_by_month_data",
        lambda role, months: [{"month": role, "approved": months}],
    )
    monkeypatch.setattr(
        admin_dashboard,
        "_top_n",
        lambda model, field, limit, **kwargs: [{"value": field, "count": limit}],
    )
    monkeypatch.setattr(
        admin_dashboard,
        "_identity_breakdown",
        lambda model, field: ([{"value": "woman", "count": 2}], 2),
    )
    monkeypatch.setattr(admin_dashboard, "_mentor_flags_data", lambda: {"total": 3})
    monkeypatch.setattr(
        admin_dashboard,
        "_top_partners_data",
        lambda role, limit: [{"partner_id": role, "applications": limit}],
    )

    with app.test_request_context("/api/admin/dashboard/applications/overview"):
        response, status = admin_dashboard.applications_overview.__wrapped__()

    payload = response.get_json()["result"]
    assert status == 200
    assert payload["summary"]["funnel"]["mentee"] == {"APPROVED": 1}
    assert payload["summary"]["conversion"]["mentor"] == {
        "profile_conversion_rate": 50.0
    }
    assert payload["mentee_by_month"][0]["month"] == "mentee"
    assert payload["mentor_by_month"][0]["month"] == "mentor"
    assert payload["mentee_identify"]["meta"]["population"] == "applications"
    assert payload["mentor_flags"] == {"total": 3}
    assert payload["top_partners_mentor"][0]["partner_id"] == "mentor"


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
    assert (
        payload["message"] == "Profile identity breakdown is only available for mentees"
    )
