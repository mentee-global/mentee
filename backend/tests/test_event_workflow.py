from types import SimpleNamespace

import pytest
from bson import ObjectId

from api.utils.constants import Account
from api.utils import event_workflow


def actor(role, kind, profile_id="profile", hub_id=None, partner_id=None):
    return event_workflow.EventActor(
        role=role,
        uid=f"uid-{profile_id}",
        profile_id=profile_id,
        kind=kind,
        hub_id=hub_id,
        partner_id=partner_id,
    )


def event(scope_type="global", scope_id=None, status="draft", creator_uid="creator"):
    return SimpleNamespace(
        scope_type=scope_type,
        scope_id=scope_id,
        hub_id=None,
        status=status,
        created_by_uid=creator_uid,
        role=[Account.MENTOR.value],
    )


def test_mentor_and_mentee_cannot_publish():
    assert not event_workflow.can_publish_event(
        actor(Account.MENTOR.value, "mentor"), event()
    )
    assert not event_workflow.can_publish_event(
        actor(Account.MENTEE.value, "mentee"), event()
    )


def test_partner_can_only_publish_to_own_partner_scope():
    partner = actor(
        Account.PARTNER.value,
        "partner",
        profile_id="partner-a",
        partner_id="partner-a",
        hub_id="hub-a",
    )

    assert event_workflow.can_publish_event(partner, event("partner", "partner-a"))
    assert not event_workflow.can_publish_event(partner, event("partner", "partner-b"))
    assert not event_workflow.can_publish_event(partner, event("hub", "hub-a"))
    assert not event_workflow.can_publish_event(partner, event("global"))


def test_hub_owner_can_only_publish_to_own_hub_scope():
    hub = actor(Account.HUB.value, "hub", profile_id="hub-a", hub_id="hub-a")

    assert event_workflow.can_publish_event(hub, event("hub", "hub-a"))
    assert not event_workflow.can_publish_event(hub, event("hub", "hub-b"))
    assert not event_workflow.can_publish_event(hub, event("global"))


def test_staff_can_publish_any_scope():
    admin = actor(Account.ADMIN.value, "staff")

    assert event_workflow.can_publish_event(admin, event("global"))
    assert event_workflow.can_publish_event(admin, event("hub", "hub-a"))
    assert event_workflow.can_publish_event(admin, event("partner", "partner-a"))


def test_non_published_event_is_private_except_for_scope_owner():
    proposal = event("partner", "partner-a", creator_uid="mentor-uid")
    unrelated_mentor = actor(Account.MENTOR.value, "mentor", profile_id="mentor-b")
    creator = event_workflow.EventActor(
        role=Account.MENTOR.value,
        uid="mentor-uid",
        profile_id="mentor-a",
        kind="mentor",
    )
    owner = actor(
        Account.PARTNER.value,
        "partner",
        profile_id="partner-a",
        partner_id="partner-a",
    )

    assert not event_workflow.can_view_event(unrelated_mentor, proposal)
    assert event_workflow.can_view_event(creator, proposal)
    assert event_workflow.can_view_event(owner, proposal)


def test_proposal_creator_cannot_edit_after_publication():
    published = event(status="published", creator_uid="mentor-uid")
    creator = event_workflow.EventActor(
        role=Account.MENTOR.value,
        uid="mentor-uid",
        profile_id="mentor-a",
        kind="mentor",
    )

    assert not event_workflow.can_edit_event(creator, published)
    assert not event_workflow.can_cancel_event(creator, published)


def test_rejection_requires_feedback():
    pending = event(status="pending_review")
    pending.save = lambda: None

    with pytest.raises(event_workflow.EventWorkflowError) as error:
        event_workflow.review_event(
            actor(Account.ADMIN.value, "staff"), pending, "reject", ""
        )

    assert error.value.message == "Feedback is required when rejecting"


def test_rejection_records_feedback_in_review_history():
    pending = event(status="pending_review")
    pending.review_history = []
    pending.save = lambda: None

    event_workflow.review_event(
        actor(Account.ADMIN.value, "staff"),
        pending,
        "reject",
        "Clarify the intended audience.",
    )

    assert pending.status == "rejected"
    assert pending.review_feedback == "Clarify the intended audience."
    assert pending.review_history[-1]["decision"] == "reject"


def test_failed_approval_publication_remains_in_review_queue(monkeypatch):
    saves = []
    pending = event(status="pending_review", creator_uid="mentor-uid")
    pending.id = ObjectId()
    pending.review_history = []
    pending.reviewed_by_uid = None
    pending.reviewed_at = None
    pending.review_feedback = None
    pending.updated_at = None
    pending.publication_version = 0
    pending.published_at = None
    pending.published_by_uid = None
    pending.notification_requested = False
    pending.notification_status = "not_requested"
    pending.notification_recipient_count = 0
    pending.save = lambda: saves.append(pending.status)
    admin_actor = actor(Account.ADMIN.value, "staff")

    class FailingQuery:
        def modify(self, **updates):
            raise RuntimeError("queue unavailable")

    class FailingJobs:
        @staticmethod
        def objects(**query):
            return FailingQuery()

    monkeypatch.setattr(event_workflow, "EventNotificationJob", FailingJobs)
    monkeypatch.setattr(
        event_workflow,
        "event_recipients",
        lambda current: [{"email": "person@example.org"}],
    )

    reviewed = event_workflow.review_event(admin_actor, pending, "approve")
    with pytest.raises(event_workflow.EventWorkflowError):
        event_workflow.publish_event(admin_actor, reviewed, notify=True)

    assert pending.status == "pending_review"
    assert saves == []


def test_submission_queues_admin_review_notifications(monkeypatch):
    proposal = event(status="draft", creator_uid="mentor-uid")
    proposal.submission_version = 0
    proposal.submitted_at = None
    proposal.review_feedback = None
    proposal.updated_at = None
    proposal.save = lambda: None
    creator = event_workflow.EventActor(
        role=Account.MENTOR.value,
        uid="mentor-uid",
        profile_id="mentor-a",
        kind="mentor",
    )
    queued = []
    monkeypatch.setattr(
        event_workflow,
        "queue_event_review_notifications",
        queued.append,
        raising=False,
    )

    event_workflow.submit_event(creator, proposal)

    assert proposal.status == "pending_review"
    assert proposal.submission_version == 1
    assert queued == [proposal]


def test_notification_failure_leaves_submission_retryable(monkeypatch):
    proposal = event(status="draft", creator_uid="mentor-uid")
    proposal.submission_version = 0
    proposal.submitted_at = None
    proposal.review_feedback = None
    proposal.updated_at = None
    proposal.save = lambda: None
    creator = event_workflow.EventActor(
        role=Account.MENTOR.value,
        uid="mentor-uid",
        profile_id="mentor-a",
        kind="mentor",
    )
    monkeypatch.setattr(
        event_workflow,
        "queue_event_review_notifications",
        lambda current: (_ for _ in ()).throw(RuntimeError("queue unavailable")),
    )

    with pytest.raises(event_workflow.EventWorkflowError) as error:
        event_workflow.submit_event(creator, proposal)

    assert error.value.status == 503
    assert proposal.status == "draft"
    assert proposal.submission_version == 0


def test_only_mentor_and_mentee_events_can_be_submitted(monkeypatch):
    proposal = event(status="draft", creator_uid="partner-uid")
    partner = event_workflow.EventActor(
        role=Account.PARTNER.value,
        uid="partner-uid",
        profile_id="partner-a",
        partner_id="partner-a",
        kind="partner",
    )

    with pytest.raises(event_workflow.EventWorkflowError) as error:
        event_workflow.submit_event(partner, proposal)

    assert error.value.status == 403


def test_partner_and_hub_cannot_request_out_of_community_scopes():
    partner = actor(
        Account.PARTNER.value,
        "partner",
        profile_id="partner-a",
        partner_id="partner-a",
        hub_id="hub-a",
    )
    hub = actor(
        Account.HUB.value,
        "hub",
        profile_id="hub-a",
        hub_id="hub-a",
    )

    with pytest.raises(event_workflow.EventWorkflowError):
        event_workflow._requested_scope(partner, {"scope_type": "global"})
    with pytest.raises(event_workflow.EventWorkflowError):
        event_workflow._requested_scope(
            hub,
            {"scope_type": "hub", "scope_id": "507f1f77bcf86cd799439011"},
        )


def test_support_cannot_publish_or_review_events():
    support = actor(Account.SUPPORT.value, "staff")

    assert not event_workflow.can_publish_event(support, event())


def test_recipient_preview_respects_preferences_paused_profiles_and_dedupes(
    monkeypatch,
):
    profiles = [
        (
            Account.MENTOR.value,
            SimpleNamespace(
                email="same@example.org",
                email_notifications=True,
                paused_flag=False,
                preferred_language="en-US",
                timezone="UTC+00:00",
            ),
        ),
        (
            Account.MENTOR.value,
            SimpleNamespace(
                email="same@example.org",
                email_notifications=True,
                paused_flag=False,
                preferred_language="en-US",
                timezone=None,
            ),
        ),
        (
            Account.MENTOR.value,
            SimpleNamespace(
                email="paused@example.org",
                email_notifications=True,
                paused_flag=True,
                preferred_language="en-US",
                timezone=None,
            ),
        ),
        (
            Account.MENTEE.value,
            SimpleNamespace(
                email="disabled@example.org",
                email_notifications=False,
                preferred_language="en-US",
                timezone=None,
            ),
        ),
    ]
    monkeypatch.setattr(event_workflow, "_recipient_profiles", lambda item: profiles)

    recipients = event_workflow.event_recipients(event())

    assert [recipient["email"] for recipient in recipients] == ["same@example.org"]


def test_audience_preview_counts_eligible_recipients_by_role(monkeypatch):
    monkeypatch.setattr(
        event_workflow,
        "event_recipients",
        lambda item: [
            {"email": "mentor@example.org", "role": Account.MENTOR.value},
            {"email": "mentee@example.org", "role": Account.MENTEE.value},
            {"email": "second-mentee@example.org", "role": Account.MENTEE.value},
        ],
    )

    preview = event_workflow.audience_preview(
        actor(Account.MENTOR.value, "mentor"),
        {"audience_roles": [Account.MENTOR.value, Account.MENTEE.value]},
    )

    assert preview == {
        "recipient_count": 3,
        "recipient_counts_by_role": {
            str(Account.MENTOR.value): 1,
            str(Account.MENTEE.value): 2,
        },
        "audience_roles": [Account.MENTOR.value, Account.MENTEE.value],
        "scope_type": "global",
        "scope_id": None,
    }


def test_publication_queues_notifications_only_once(monkeypatch):
    queued = []

    class FakeQuery:
        def modify(self, **updates):
            queued.append(updates)

    class FakeJobs:
        @staticmethod
        def objects(**query):
            return FakeQuery()

    item = event("partner", "partner-a")
    item.id = ObjectId()
    item.publication_version = 0
    item.published_at = None
    item.published_by_uid = None
    item.notification_requested = False
    item.notification_status = "not_requested"
    item.notification_recipient_count = 0
    item.updated_at = None
    item.save = lambda: None
    owner = actor(
        Account.PARTNER.value,
        "partner",
        profile_id="partner-a",
        partner_id="partner-a",
    )
    monkeypatch.setattr(event_workflow, "EventNotificationJob", FakeJobs)
    monkeypatch.setattr(
        event_workflow,
        "event_recipients",
        lambda current: [{"email": "person@example.org"}],
    )

    event_workflow.publish_event(owner, item, notify=True)

    assert item.status == "published"
    assert item.notification_status == "queued"
    assert item.notification_recipient_count == 1
    assert len(queued) == 1
    with pytest.raises(event_workflow.EventWorkflowError):
        event_workflow.publish_event(owner, item, notify=True)
    assert len(queued) == 1


def test_notification_job_failure_leaves_publication_retryable(monkeypatch):
    class FailingQuery:
        def modify(self, **updates):
            raise RuntimeError("queue unavailable")

    class FailingJobs:
        @staticmethod
        def objects(**query):
            return FailingQuery()

    item = event("partner", "partner-a")
    item.id = ObjectId()
    item.publication_version = 0
    item.published_at = None
    item.published_by_uid = None
    item.notification_requested = False
    item.notification_status = "not_requested"
    item.notification_recipient_count = 0
    item.updated_at = None
    item.save = lambda: None
    owner = actor(
        Account.PARTNER.value,
        "partner",
        profile_id="partner-a",
        partner_id="partner-a",
    )
    monkeypatch.setattr(event_workflow, "EventNotificationJob", FailingJobs)
    monkeypatch.setattr(
        event_workflow,
        "event_recipients",
        lambda current: [{"email": "person@example.org"}],
    )

    with pytest.raises(event_workflow.EventWorkflowError) as error:
        event_workflow.publish_event(owner, item, notify=True)

    assert error.value.status == 503
    assert item.status == "draft"
    assert item.publication_version == 0


def test_serialization_only_queries_relevant_creator_profile_models(monkeypatch):
    calls = []
    creator_id = ObjectId()

    def fake_model(name):
        class FakeModel:
            @staticmethod
            def objects(**query):
                calls.append((name, query))
                return []

        return FakeModel

    for name in (
        "Admin",
        "MentorProfile",
        "MenteeProfile",
        "PartnerProfile",
        "Hub",
        "Support",
    ):
        monkeypatch.setattr(event_workflow, name, fake_model(name))
    monkeypatch.setattr(
        event_workflow,
        "serialize_event",
        lambda item, **kwargs: kwargs.get("creator"),
    )
    item = SimpleNamespace(
        user_id=creator_id,
        creator_role=Account.MENTOR.value,
    )

    event_workflow.serialize_events([item])

    assert calls == [
        ("MentorProfile", {"id__in": [creator_id]}),
    ]
