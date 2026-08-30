from datetime import datetime, timedelta
from types import SimpleNamespace

from bson import ObjectId

from api.utils import event_notifications


def test_audience_worker_resumes_after_already_sent_recipients(monkeypatch):
    sent = []
    job_updates = []
    event_updates = []
    published_event = SimpleNamespace(
        title="Career workshop",
        status="published",
        role=[1],
        start_datetime=None,
        end_datetime=None,
        update=lambda **values: event_updates.append(values),
    )
    job = SimpleNamespace(
        event_id=ObjectId(),
        recipients=[
            {"email": "first@example.org", "role": 1},
            {"email": "second@example.org", "role": 1},
        ],
        sent_recipients=["first@example.org"],
        target_url="https://app.menteeglobal.org/event/example",
        update=lambda **values: job_updates.append(values),
    )

    class FakeEventQuery:
        @staticmethod
        def first():
            return published_event

    class FakeEvents:
        @staticmethod
        def objects(**query):
            return FakeEventQuery()

    monkeypatch.setattr(event_notifications, "Event", FakeEvents)
    monkeypatch.setattr(
        event_notifications,
        "send_email",
        lambda **kwargs: (sent.append(kwargs) or True, ""),
    )

    processed = event_notifications._deliver_job(job)

    assert processed is True
    assert [email["recipient"] for email in sent] == ["second@example.org"]
    assert job_updates[-1]["set__sent_count"] == 2
    assert event_updates[-1]["set__notification_status"] == "completed"


def test_audience_worker_cancels_stale_job_for_cancelled_event(monkeypatch):
    job_updates = []
    event_updates = []
    cancelled_event = SimpleNamespace(
        status="cancelled",
        update=lambda **values: event_updates.append(values),
    )
    job = SimpleNamespace(
        event_id=ObjectId(),
        created_at=datetime.utcnow() - timedelta(minutes=10),
        update=lambda **values: job_updates.append(values),
    )

    class FakeEventQuery:
        @staticmethod
        def first():
            return cancelled_event

    class FakeEvents:
        @staticmethod
        def objects(**query):
            return FakeEventQuery()

    monkeypatch.setattr(event_notifications, "Event", FakeEvents)

    processed = event_notifications._deliver_job(job)

    assert processed is True
    assert job_updates[-1]["set__status"] == "cancelled"
    assert event_updates[-1]["set__notification_status"] == "cancelled"


def test_audience_worker_waits_while_approval_is_being_published(monkeypatch):
    job_updates = []
    pending_event = SimpleNamespace(status="pending_review")
    job = SimpleNamespace(
        event_id=ObjectId(),
        created_at=datetime.utcnow(),
        update=lambda **values: job_updates.append(values),
    )

    class FakeEventQuery:
        @staticmethod
        def first():
            return pending_event

    class FakeEvents:
        @staticmethod
        def objects(**query):
            return FakeEventQuery()

    monkeypatch.setattr(event_notifications, "Event", FakeEvents)

    processed = event_notifications._deliver_job(job)

    assert processed is False
    assert job_updates[-1]["set__status"] == "staged"
