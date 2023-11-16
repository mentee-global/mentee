import requests
import json
import os
from dotenv import load_dotenv
import jwt


# check the login route
def test_login_mentor():

    # login the example user
    response = login_mentor()

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

    assert decoded_token["claims"]["role"] == int(os.getenv("TEST_MENTOR_ROLE"))


def test_login_mentor_wrong_password():
    load_dotenv()

    # wrong data must not return 200
    test_data = {
        "email": os.getenv("TEST_MENTOR_EMAIL"),
        "password": "wrong_password",
        "role": int(os.getenv("TEST_MENTOR_ROLE")),
    }

    response_test(test_data)


def test_login_mentor_wrong_email():
    load_dotenv()

    # wrong data must not return 200
    test_data = {
        "email": "wrong_email",
        "password": os.getenv("TEST_MENTOR_PASSWORD"),
        "role": int(os.getenv("TEST_MENTOR_ROLE")),
    }

    response_test(test_data)


def login_mentor():
    load_dotenv()

    test_data = {
        "email": os.getenv("TEST_MENTOR_EMAIL"),
        "password": os.getenv("TEST_MENTOR_PASSWORD"),
        "role": int(os.getenv("TEST_MENTOR_ROLE")),
    }

    BASE_URL = os.getenv("BASE_URL")

    # login with the correct data
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    return response


def response_test(test_data):
    BASE_URL = os.getenv("BASE_URL")

    # attempt login with the provided data
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    assert response.status_code != 200
