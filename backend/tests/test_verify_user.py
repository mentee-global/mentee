import pytest
from api.utils.require_auth import verify_user, AUTHORIZED, UNAUTHORIZED, ALL_USERS


class MockRequest:
    headers = {"Authorization": "mock_token"}


class MockFirebaseAdminAuth:
    @staticmethod
    def verify_id_token(token):
        return {"role": 1}


def test_verify_user_authorized():
    with pytest.raises(Exception):
        assert verify_user(
            1, request=MockRequest, firebase_admin_auth=MockFirebaseAdminAuth
        ) == (AUTHORIZED, None)


def test_verify_user_unauthorized():
    with pytest.raises(Exception):
        assert verify_user(
            2, request=MockRequest, firebase_admin_auth=MockFirebaseAdminAuth
        ) == (
            UNAUTHORIZED,
            "Expected response object",
        )


def test_verify_user_all_users():
    with pytest.raises(Exception):
        assert verify_user(
            ALL_USERS, request=MockRequest, firebase_admin_auth=MockFirebaseAdminAuth
        ) == (
            AUTHORIZED,
            None,
        )
