"""Unit tests for the account-deletion cascade policy.

Models are stubbed so the policy can be exercised without a database: each fake
records the queries the cascade issues, letting us assert exactly what is
deleted vs retained.
"""

from api.utils import account_deletion
from api.utils import direct_messages
from api.utils.constants import Account


class _FakeQuerySet:
    def __init__(self, count=0, log=None, name=""):
        self._count = count
        self._log = log if log is not None else []
        self._name = name

    def count(self):
        return self._count

    def update(self, **kwargs):
        self._log.append((self._name, "update", kwargs))
        return self._count

    def delete(self):
        self._log.append((self._name, "delete"))
        return self._count


class _FakeModel:
    """A model whose .objects(**filter) returns a querystub. `present` controls
    how many rows match (so delete/update/count report a realistic number)."""

    def __init__(self, name, present=0, log=None):
        self._name = name
        self.__name__ = name
        self._present = present
        self._log = log

    def objects(self, **kwargs):
        self._log.append((self._name, "query", kwargs))
        return _FakeQuerySet(count=self._present, log=self._log, name=self._name)


class _FakeProfile:
    def __init__(self, id="profile1", firebase_uid="uid1", email="a@b.com"):
        self.id = id
        self.firebase_uid = firebase_uid
        self.email = email
        self.deleted = False

    def delete(self):
        self.deleted = True


class _FakeFirebase:
    def __init__(self):
        self.deleted = []

    def delete_user(self, uid):
        self.deleted.append(uid)


def _wire(monkeypatch, log, *, present=1, hub_deps=False):
    fb = _FakeFirebase()
    monkeypatch.setattr(account_deletion, "firebase_admin_auth", fb)
    monkeypatch.setattr(
        account_deletion, "DirectMessage", _FakeModel("DirectMessage", present, log)
    )
    monkeypatch.setattr(account_deletion, "Users", _FakeModel("Users", present, log))
    monkeypatch.setattr(
        account_deletion, "VerifiedEmail", _FakeModel("VerifiedEmail", present, log)
    )
    for m in (
        "OAuthAccessToken",
        "OAuthRefreshToken",
        "OAuthAuthorizationCode",
        "OAuthConsent",
    ):
        monkeypatch.setattr(account_deletion, m, _FakeModel(m, present, log))
    monkeypatch.setattr(
        account_deletion,
        "_OAUTH_MODELS",
        (
            account_deletion.OAuthAccessToken,
            account_deletion.OAuthRefreshToken,
            account_deletion.OAuthAuthorizationCode,
            account_deletion.OAuthConsent,
        ),
    )
    dep = 1 if hub_deps else 0
    for m in (
        "Announcement",
        "Event",
        "Training",
        "CommunityLibrary",
        "SignedDocs",
        "PartnerProfile",
    ):
        monkeypatch.setattr(account_deletion, m, _FakeModel(m, dep, log))
    return fb


def test_mentee_deletion_cascades_identity_and_retains_messages(monkeypatch):
    log = []
    fb = _wire(monkeypatch, log)
    profile = _FakeProfile()

    ok, msg, summary = account_deletion.delete_account_cascade(
        Account.MENTEE.value, profile
    )

    assert ok is True
    assert profile.deleted is True  # profile removed
    assert fb.deleted == ["uid1"]  # firebase user removed
    # messages were marked read, not deleted
    assert ("DirectMessage", "update", {"message_read": True}) in log
    assert ("DirectMessage", "delete") not in log
    # identity/access removed
    assert ("Users", "delete") in log
    assert ("VerifiedEmail", "delete") in log
    assert ("OAuthAccessToken", "delete") in log
    # applications/appointments are never queried by the cascade (retained)
    queried = {entry[0] for entry in log}
    assert "MenteeApplication" not in queried
    assert "AppointmentRequest" not in queried


def test_hub_with_dependents_is_refused(monkeypatch):
    log = []
    _wire(monkeypatch, log, hub_deps=True)
    profile = _FakeProfile(id="hub1")

    ok, msg, summary = account_deletion.delete_account_cascade(
        Account.HUB.value, profile
    )

    assert ok is False
    assert "owns content" in msg
    assert profile.deleted is False  # nothing deleted when refused


def test_hub_without_dependents_is_deleted(monkeypatch):
    log = []
    _wire(monkeypatch, log, hub_deps=False)
    profile = _FakeProfile(id="hub1")

    ok, msg, summary = account_deletion.delete_account_cascade(
        Account.HUB.value, profile
    )

    assert ok is True
    assert profile.deleted is True


def test_display_user_placeholder_for_deleted_account(monkeypatch):
    monkeypatch.setattr(
        direct_messages, "resolve_direct_message_user", lambda pid: (None, None)
    )
    user = direct_messages.direct_message_display_user_or_placeholder("missing")
    assert user["deleted"] is True
    assert user["name"] == direct_messages.DELETED_ACCOUNT_NAME


def test_display_user_real_account_not_marked_deleted(monkeypatch):
    monkeypatch.setattr(
        direct_messages, "resolve_direct_message_user", lambda pid: (object(), 2)
    )
    monkeypatch.setattr(
        direct_messages,
        "direct_message_display_user",
        lambda profile, user_type: {"name": "Real", "user_type": user_type},
    )
    user = direct_messages.direct_message_display_user_or_placeholder("ok")
    assert user["deleted"] is False
    assert user["name"] == "Real"
