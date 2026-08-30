from datetime import datetime, timedelta
from types import SimpleNamespace

from bson import ObjectId
import pytest

from api.utils import event_review_notifications


def admin(email, selected=False):
    return SimpleNamespace(
        id=ObjectId(),
        firebase_uid=f"uid-{email}",
        name=email.split("@")[0].title(),
        email=email,
        receive_event_review_alerts=selected,
    )


def test_event_review_recipients_default_to_all_admins(monkeypatch):
    admins = [admin("first@example.org"), admin("second@example.org")]

    class FakeAdmin:
        @staticmethod
        def objects(**query):
            if query.get("receive_event_review_alerts"):
                return []
            return admins

    monkeypatch.setattr(event_review_notifications, "Admin", FakeAdmin)

    recipients = event_review_notifications.event_review_recipients()

    assert [recipient.email for recipient in recipients] == [
        "first@example.org",
        "second@example.org",
    ]


def test_event_review_recipients_use_only_selected_admins(monkeypatch):
    selected = admin("selected@example.org", selected=True)
    admins = [selected, admin("other@example.org")]

    class FakeAdmin:
        @staticmethod
        def objects(**query):
            if query.get("receive_event_review_alerts"):
                return [selected]
            return admins

    monkeypatch.setattr(event_review_notifications, "Admin", FakeAdmin)

    recipients = event_review_notifications.event_review_recipients()

    assert [recipient.email for recipient in recipients] == ["selected@example.org"]


def test_submission_queues_alert_work_without_exposing_notifications(monkeypatch):
    recipients = [admin("first@example.org"), admin("second@example.org")]
    notifications = []
    jobs = []

    class FakeQuery:
        def __init__(self, collection, query):
            self.collection = collection
            self.query = query

        def modify(self, **updates):
            self.collection.append({"query": self.query, "updates": updates})

    class FakeNotifications:
        @staticmethod
        def objects(**query):
            return FakeQuery(notifications, query)

    class FakeJobs:
        @staticmethod
        def objects(**query):
            return FakeQuery(jobs, query)

    monkeypatch.setattr(
        event_review_notifications,
        "event_review_recipients",
        lambda: recipients,
    )
    monkeypatch.setattr(
        event_review_notifications,
        "AdminEventNotification",
        FakeNotifications,
        raising=False,
    )
    monkeypatch.setattr(
        event_review_notifications,
        "EventReviewNotificationJob",
        FakeJobs,
        raising=False,
    )
    monkeypatch.setattr(
        event_review_notifications,
        "_creator_details",
        lambda item: {
            "name": "Maya Mentor",
            "email": "maya@example.org",
            "role": "Mentor",
        },
        raising=False,
    )
    proposal = SimpleNamespace(
        id=ObjectId(),
        title="Career workshop",
        submission_version=2,
    )

    count = event_review_notifications.queue_event_review_notifications(proposal)

    assert count == 2
    assert notifications == []
    assert len(jobs) == 1
    assert jobs[0]["query"] == {
        "event_id": proposal.id,
        "submission_version": 2,
    }
    assert [
        recipient["email"] for recipient in jobs[0]["updates"]["set__recipients"]
    ] == ["first@example.org", "second@example.org"]


def test_review_notification_worker_emails_each_selected_admin(monkeypatch):
    sent = []
    updates = []
    notifications = []
    proposal = SimpleNamespace(title="Career workshop", status="pending_review")
    job = SimpleNamespace(
        event_id=ObjectId(),
        recipients=[
            {
                "admin_id": str(ObjectId()),
                "uid": "uid-first@example.org",
                "email": "first@example.org",
                "name": "First",
            },
            {
                "admin_id": str(ObjectId()),
                "uid": "uid-second@example.org",
                "email": "second@example.org",
                "name": "Second",
            },
        ],
        submission_version=2,
        creator={
            "name": "Maya Mentor",
            "email": "maya@example.org",
            "role": "Mentor",
        },
        sent_recipients=["first@example.org"],
        target_url="https://app.menteeglobal.org/events?tab=review",
        update=lambda **values: updates.append(values),
    )

    class FakeJobQuery:
        def modify(self, **updates):
            return job

    class FakeJobs:
        @staticmethod
        def objects(*args, **kwargs):
            return FakeJobQuery()

    class FakeEventQuery:
        @staticmethod
        def first():
            return proposal

    class FakeEvents:
        @staticmethod
        def objects(**query):
            return FakeEventQuery()

    class FakeNotificationQuery:
        def __init__(self, query):
            self.query = query

        def modify(self, **values):
            notifications.append({"query": self.query, "values": values})

    class FakeNotifications:
        @staticmethod
        def objects(**query):
            return FakeNotificationQuery(query)

    monkeypatch.setattr(
        event_review_notifications, "EventReviewNotificationJob", FakeJobs
    )
    monkeypatch.setattr(event_review_notifications, "Event", FakeEvents, raising=False)
    monkeypatch.setattr(
        event_review_notifications,
        "AdminEventNotification",
        FakeNotifications,
    )
    monkeypatch.setattr(
        event_review_notifications,
        "send_email",
        lambda **kwargs: (sent.append(kwargs) or True, ""),
        raising=False,
    )

    processed = event_review_notifications.process_next_event_review_notification()

    assert processed is True
    assert [item["query"]["recipient_uid"] for item in notifications] == [
        "uid-first@example.org",
        "uid-second@example.org",
    ]
    assert [email["recipient"] for email in sent] == [
        "second@example.org",
    ]
    assert sent[0]["subject"] == "Event proposal needs review: Career workshop"
    assert sent[0]["data"]["subject"] == "Event proposal needs review: Career workshop"
    assert all(
        email["data"]["link"] == "https://app.menteeglobal.org/events?tab=review"
        for email in sent
    )
    assert updates[-1]["set__status"] == "completed"
    assert updates[-1]["set__sent_count"] == 2


def test_review_worker_cancels_alert_after_proposal_is_resolved(monkeypatch):
    updates = []
    resolved_proposal = SimpleNamespace(status="rejected")
    job = SimpleNamespace(
        event_id=ObjectId(),
        created_at=datetime.utcnow() - timedelta(minutes=10),
        update=lambda **values: updates.append(values),
    )

    class FakeEventQuery:
        @staticmethod
        def first():
            return resolved_proposal

    class FakeEvents:
        @staticmethod
        def objects(**query):
            return FakeEventQuery()

    monkeypatch.setattr(event_review_notifications, "Event", FakeEvents)

    processed = event_review_notifications._deliver_event_review_notification(job)

    assert processed is True
    assert updates[-1]["set__status"] == "cancelled"


def test_review_worker_waits_while_rejected_proposal_is_resubmitted(monkeypatch):
    updates = []
    rejected_proposal = SimpleNamespace(status="rejected")
    job = SimpleNamespace(
        event_id=ObjectId(),
        created_at=datetime.utcnow(),
        update=lambda **values: updates.append(values),
    )

    class FakeEventQuery:
        @staticmethod
        def first():
            return rejected_proposal

    class FakeEvents:
        @staticmethod
        def objects(**query):
            return FakeEventQuery()

    monkeypatch.setattr(event_review_notifications, "Event", FakeEvents)

    processed = event_review_notifications._deliver_event_review_notification(job)

    assert processed is False
    assert updates[-1]["set__status"] == "staged"


def test_event_review_recipients_require_at_least_one_admin():
    with pytest.raises(
        event_review_notifications.EventReviewNotificationError
    ) as error:
        event_review_notifications.set_event_review_recipient_ids([])

    assert error.value.message == "Select at least one administrator"


def test_opening_admin_notifications_marks_all_unread_items(monkeypatch):
    updates = []

    class FakeNotificationQuery:
        def update(self, **values):
            updates.append(values)
            return 2

    class FakeNotifications:
        @staticmethod
        def objects(**query):
            assert query == {"recipient_uid": "admin-uid", "read_at": None}
            return FakeNotificationQuery()

    monkeypatch.setattr(
        event_review_notifications,
        "AdminEventNotification",
        FakeNotifications,
    )

    updated_count = event_review_notifications.mark_all_admin_event_notifications_read(
        "admin-uid"
    )

    assert updated_count == 2
    assert len(updates) == 1
    assert "set__read_at" in updates[0]


def test_event_review_recipient_settings_select_only_requested_admins(monkeypatch):
    first = admin("first@example.org")
    second = admin("second@example.org")
    updates = []

    class FakeQuery(list):
        def only(self, *fields):
            return self

        def update(self, **values):
            updates.append(values)

    class FakeAdmin:
        @staticmethod
        def objects(**query):
            if "id__in" in query:
                return FakeQuery([first])
            if "id__nin" in query:
                return FakeQuery([second])
            return FakeQuery([first, second])

    monkeypatch.setattr(event_review_notifications, "Admin", FakeAdmin)

    event_review_notifications.set_event_review_recipient_ids([str(first.id)])

    assert updates == [
        {"set__receive_event_review_alerts": True},
        {"set__receive_event_review_alerts": False},
    ]
