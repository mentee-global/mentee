from bson import ObjectId

from api.utils import direct_messages


class _FakeMessage:
    def __init__(self, sender_id):
        self.sender_id = sender_id


class _FakeDirectMessage:
    messages = []

    @classmethod
    def objects(cls, *args, **kwargs):
        return cls.messages


def test_visible_unread_direct_message_count_ignores_orphan_senders(monkeypatch):
    valid_sender_id = ObjectId()
    orphan_sender_id = ObjectId()
    _FakeDirectMessage.messages = [
        _FakeMessage(valid_sender_id),
        _FakeMessage(orphan_sender_id),
    ]

    def resolve(profile_id):
        if str(profile_id) == str(valid_sender_id):
            return object(), 2
        return None, None

    monkeypatch.setattr(direct_messages, "DirectMessage", _FakeDirectMessage)
    monkeypatch.setattr(direct_messages, "resolve_direct_message_user", resolve)

    visible_ids = direct_messages.visible_unread_direct_message_sender_ids(ObjectId())
    assert visible_ids
    assert visible_ids == [valid_sender_id]
    assert direct_messages.visible_unread_direct_message_count(ObjectId()) == 1


def test_visible_unread_direct_message_count_deduplicates_senders(monkeypatch):
    sender_id = ObjectId()
    _FakeDirectMessage.messages = [
        _FakeMessage(sender_id),
        _FakeMessage(sender_id),
    ]

    monkeypatch.setattr(direct_messages, "DirectMessage", _FakeDirectMessage)
    monkeypatch.setattr(
        direct_messages,
        "resolve_direct_message_user",
        lambda profile_id: (object(), 2),
    )

    assert direct_messages.visible_unread_direct_message_count(ObjectId()) == 1


def test_validate_direct_message_participants_requires_sender_ownership(monkeypatch):
    sender_id = str(ObjectId())
    recipient_id = str(ObjectId())
    other_profile_id = str(ObjectId())

    monkeypatch.setattr(
        direct_messages,
        "resolve_message_profile_id",
        lambda profile_id: (object(), 2),
    )

    allowed, reason = direct_messages.validate_direct_message_participants(
        sender_id, recipient_id, 2, other_profile_id
    )

    assert allowed is False
    assert reason == "Forbidden"


def test_validate_direct_message_participants_requires_existing_recipient(
    monkeypatch,
):
    sender_id = str(ObjectId())
    recipient_id = str(ObjectId())

    def resolve(profile_id):
        if profile_id == sender_id:
            return object(), 2
        return None, None

    monkeypatch.setattr(direct_messages, "resolve_message_profile_id", resolve)

    allowed, reason = direct_messages.validate_direct_message_participants(
        sender_id, recipient_id, 2, sender_id
    )

    assert allowed is False
    assert reason == "Invalid recipient"
