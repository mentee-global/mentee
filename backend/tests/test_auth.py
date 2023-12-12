import requests
import os
from dotenv import load_dotenv
import jwt
from .utils.login_utils import *

load_dotenv()

# check the login route
def test_login_partner():
    # login the example user
    response = login_partner()

    assert response.status_code == 200

    assert "message" in response.json()
    assert (
        response.json()["message"] == "Logged in"
    ), "Unable to log in with the correct partner credentials"

    # logged in user must have a token
    assert "token" in response.json()["result"]

    jwt_token = response.json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "profileId" in decoded_token["claims"]
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_PARTNER_ROLE"))
    assert decoded_token["claims"]["profileId"] == os.environ.get("TEST_PARTNER_PROFILE_ID")


def test_login_mentor_wrong_password():

    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_PARTNER_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_PARTNER_ROLE")),
    }

    response_test(test_data)


def test_login_partner_wrong_email():

    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_PARTNER_PASSWORD"),
        "role": int(os.environ.get("TEST_PARTNER_ROLE")),
    }

    response_test(test_data)


# check the login route
def test_login_mentor():
    # login the example user
    response = login_mentor()

    assert response.status_code == 200

    assert "message" in response.json()
    assert (
        response.json()["message"] == "Logged in"
    ), "Unable to log in with the correct mentor credentials."

    # logged in user must have a token
    assert "token" in response.json()["result"]

    jwt_token = response.json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "profileId" in decoded_token["claims"]
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_MENTOR_ROLE"))
    assert decoded_token["claims"]["profileId"] == os.environ.get("TEST_MENTOR_PROFILE_ID")


def test_login_mentor_wrong_password():

    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_MENTOR_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_MENTOR_ROLE")),
    }

    response_test(test_data)


def test_login_mentor_wrong_email():

    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_MENTOR_PASSWORD"),
        "role": int(os.environ.get("TEST_MENTOR_ROLE")),
    }

    response_test(test_data)


# check the login route
def test_login_mentee():
    # login the example user
    response = login_mentee()

    assert response.status_code == 200

    assert "message" in response.json()
    assert (
        response.json()["message"] == "Logged in"
    ), "Unable to log in with the correct mentee credentials."

    # logged in user must have a token
    assert "token" in response.json()["result"]

    jwt_token = response.json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "profileId" in decoded_token["claims"]
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_MENTEE_ROLE"))
    assert decoded_token["claims"]["profileId"] == os.environ.get("TEST_MENTEE_PROFILE_ID")


def test_login_mentee_wrong_password():

    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_MENTEE_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_MENTEE_ROLE")),
    }

    response_test(test_data)


def test_login_mentee_wrong_email():

    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_MENTEE_PASSWORD"),
        "role": int(os.environ.get("TEST_MENTEE_ROLE")),
    }

    response_test(test_data)


# check the login route
def test_login_guest():
    # login the example user
    response = login_guest()

    assert response.status_code == 200

    assert "message" in response.json()
    assert (
        response.json()["message"] == "Logged in"
    ), "Unable to log in with the correct guest credentials."

    # logged in user must have a token
    assert "token" in response.json()["result"]

    jwt_token = response.json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "profileId" in decoded_token["claims"]
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.environ.get("TEST_GUEST_ROLE"))
    print(decoded_token)
    assert decoded_token["claims"]["profileId"] == os.environ.get("TEST_GUEST_PROFILE_ID")


def test_login_guest_wrong_password():

    # wrong data must not return 200
    test_data = {
        "email": os.environ.get("TEST_GUEST_EMAIL"),
        "password": "wrong_password",
        "role": int(os.environ.get("TEST_GUEST_ROLE")),
    }

    response_test(test_data)


def test_login_guest_wrong_email():

    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.environ.get("TEST_GUEST_PASSWORD"),
        "role": int(os.environ.get("TEST_GUEST_ROLE")),
    }

    response_test(test_data)


def response_test(test_data):
    BASE_URL = os.environ.get("BASE_URL")

    # attempt login with the provided data
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    assert response.status_code != 200
