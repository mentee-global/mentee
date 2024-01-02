import requests
import os
from dotenv import load_dotenv
import jwt
from .utils.login_utils import *

load_dotenv()


# check the login route
def test_login_partner(client):
    # login the example user
    response = login_partner(client)

    assert response.status_code == 200

    assert "message" in response.get_json()
    assert (
        response.get_json()["message"] == "Logged in"
    ), "Unable to log in with the correct partner credentials"

    # logged in user must have a token
    assert "token" in response.get_json()["result"], f"Failed to get token from response. {response.text}"

    jwt_token = response.get_json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_PARTNER_ROLE")), f"Incorrect role in token claims {decoded_token}"


def test_login_mentor_wrong_password(client):
    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_PARTNER_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_PARTNER_ROLE")),
    }

    response_test(test_data, client)


def test_login_partner_wrong_email(client):
    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_PARTNER_PASSWORD"),
        "role": int(os.environ.get("TEST_PARTNER_ROLE")),
    }

    response_test(test_data, client)


# check the login route
def test_login_mentor(client):
    # login the example user
    response = login_mentor(client)

    assert response.status_code == 200

    assert "message" in response.get_json()
    assert (
        response.get_json()["message"] == "Logged in"
    ), "Unable to log in with the correct mentor credentials."

    # logged in user must have a token
    assert "token" in response.get_json()["result"], f"Failed to get token from response. {response.text}"

    jwt_token = response.get_json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_MENTOR_ROLE")), f"Incorrect role in token claims {decoded_token}"


def test_login_mentor_wrong_password(client):
    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_MENTOR_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_MENTOR_ROLE")),
    }

    response_test(test_data, client)


def test_login_mentor_wrong_email(client):
    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_MENTOR_PASSWORD"),
        "role": int(os.environ.get("TEST_MENTOR_ROLE")),
    }

    response_test(test_data, client)


# check the login route
def test_login_mentee(client):
    # login the example user
    response = login_mentee(client)

    assert response.status_code == 200

    assert "message" in response.get_json()
    assert (
        response.get_json()["message"] == "Logged in"
    ), "Unable to log in with the correct mentee credentials."

    # logged in user must have a token
    assert "token" in response.get_json()["result"], f"Failed to get token from response. {response.text}"

    jwt_token = response.get_json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_MENTEE_ROLE")), f"Incorrect role in token claims {decoded_token}"


def test_login_mentee_wrong_password(client):
    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_MENTEE_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_MENTEE_ROLE")),
    }

    response_test(test_data, client)


def test_login_mentee_wrong_email(client):
    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_MENTEE_PASSWORD"),
        "role": int(os.environ.get("TEST_MENTEE_ROLE")),
    }

    response_test(test_data, client)


# check the login route
def test_login_guest(client):
    # login the example user
    response = login_guest(client)

    assert response.status_code == 200

    assert "message" in response.get_json()
    assert (
        response.get_json()["message"] == "Logged in"
    ), "Unable to log in with the correct guest credentials."

    # logged in user must have a token
    assert "token" in response.get_json()["result"], f"Failed to get token from response. {response.text}"

    jwt_token = response.get_json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_GUEST_ROLE")), f"Incorrect role in token claims {decoded_token}"


def test_login_guest_wrong_password(client):
    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_GUEST_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_GUEST_ROLE")),
    }

    response_test(test_data, client)


def test_login_guest_wrong_email(client):
    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_GUEST_PASSWORD"),
        "role": int(os.environ.get("TEST_GUEST_ROLE")),
    }

    response_test(test_data, client)


def response_test(test_data, client):
    # attempt login with the provided data
    response = client.post(f"/auth/login", json=test_data)

    assert response.status_code != 200


def test_verify_email(client):
    mentor_email = os.environ.get("TEST_MENTOR_EMAIL")

    response = client.get("/verifyEmail", query_string={"email": mentor_email})

    assert "success" in response.get_json(), f"Test mentor email not verified. {response.text}"

    response = client.get("/verifyEmail", query_string={"email": "test@example.com"})
    assert response.status_code != 200, f"Invalid email should not be verified. {response.text}"
