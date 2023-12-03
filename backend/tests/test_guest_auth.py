import requests
import json
import os
from dotenv import load_dotenv
import jwt
from .utils.login_utils import *


# check the login route
def test_login_guest():
    # login the example user
    response = login_guest()

    assert response.status_code == 200

    assert "message" in response.json()
    assert response.json()["message"] == "Logged in"

    # logged in user must have a token
    assert "token" in response.json()["result"]

    jwt_token = response.json()["result"]["token"]
    decoded_token = jwt.decode(jwt_token, options={"verify_signature": False})

    # the decoded token payload must have the following keys and must match the test data
    assert "profileId" in decoded_token["claims"]
    assert "role" in decoded_token["claims"]

    assert decoded_token["claims"]["role"] == int(os.getenv("TEST_GUEST_ROLE"))
    print(decoded_token)
    assert decoded_token["claims"]["profileId"] == os.getenv("TEST_GUEST_PROFILE_ID")


def test_login_guest_wrong_password():
    load_dotenv()

    # wrong data must not return 200
    test_data = {
        "email": os.getenv("TEST_GUEST_EMAIL"),
        "password": "wrong_password",
        "role": int(os.getenv("TEST_GUEST_ROLE")),
    }

    response_test(test_data)


def test_login_guest_wrong_email():
    load_dotenv()

    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.getenv("TEST_GUEST_PASSWORD"),
        "role": int(os.getenv("TEST_GUEST_ROLE")),
    }

    response_test(test_data)


def response_test(test_data):
    BASE_URL = os.getenv("BASE_URL")

    # attempt login with the provided data
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    assert response.status_code != 200
