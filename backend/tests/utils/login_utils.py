import os
import requests
from dotenv import load_dotenv
import json

dir_path = os.path.dirname(os.path.realpath(__file__))

consts_path = os.path.join(dir_path, 'consts.json')

load_dotenv()
with open(consts_path, 'r') as f:
    constants = json.load(f)


# get access token from refresh token
def get_access_token(refresh_token):
    firebase_api_key = os.environ.get("FIREBASE_API_KEY")

    url = f"https://securetoken.googleapis.com/v1/token?key={firebase_api_key}"

    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}

    response = requests.post(url, data=data)
    return response.json()["access_token"]


def login_admin(client):
    test_data = {
        "email": os.environ.get("TEST_ADMIN_EMAIL"),
        "password": os.environ.get("TEST_ADMIN_PASSWORD"),
        "role": constants["TEST_ADMIN_ROLE"],
    }

    response = client.post(f"/auth/login", json=test_data)

    return response


def login_mentor(client):
    test_data = {
        "email": os.environ.get("TEST_MENTOR_EMAIL"),
        "password": os.environ.get("TEST_MENTOR_PASSWORD"),
        "role": constants["TEST_MENTOR_ROLE"],
    }

    response = client.post(f"/auth/login", json=test_data)

    return response


def login_mentee(client):
    test_data = {
        "email": os.environ.get("TEST_MENTEE_EMAIL"),
        "password": os.environ.get("TEST_MENTEE_PASSWORD"),
        "role": constants["TEST_MENTEE_ROLE"],
    }

    response = client.post(f"/auth/login", json=test_data)

    return response


def login_guest(client):
    test_data = {
        "email": os.environ.get("TEST_GUEST_EMAIL"),
        "password": os.environ.get("TEST_GUEST_PASSWORD"),
        "role": constants["TEST_GUEST_ROLE"],
    }

    response = client.post(f"/auth/login", json=test_data)

    return response


def login_partner(client):
    test_data = {
        "email": os.environ.get("TEST_PARTNER_EMAIL"),
        "password": os.environ.get("TEST_PARTNER_PASSWORD"),
        "role": constants["TEST_PARTNER_ROLE"],
    }

    response = client.post(f"/auth/login", json=test_data)

    return response


# use the first token and get the refresh token
def get_refresh_token(first_token):
    firebase_api_key = os.environ.get("FIREBASE_API_KEY")

    headers = {
        "Content-Type": "application/json",
    }
    params = {
        "key": firebase_api_key,
    }

    json_data = {
        "token": first_token,
        "returnSecureToken": True,
    }

    response = requests.post(
        "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken",
        params=params,
        headers=headers,
        json=json_data,
    )

    return response.json()["refreshToken"]
