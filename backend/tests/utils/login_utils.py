import os
import requests
from dotenv import load_dotenv


# get access token from refresh token
def get_access_token(refresh_token):
    load_dotenv()

    firebase_api_key = os.getenv("FIREBASE_API_KEY")

    url = f"https://securetoken.googleapis.com/v1/token?key={firebase_api_key}"

    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}

    response = requests.post(url, data=data)
    return response.json()["access_token"]


# login with the correct data
def login_mentor():
    load_dotenv()

    test_data = {
        "email": os.getenv("TEST_MENTOR_EMAIL"),
        "password": os.getenv("TEST_MENTOR_PASSWORD"),
        "role": int(os.getenv("TEST_MENTOR_ROLE")),
    }

    BASE_URL = os.getenv("BASE_URL")

    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    return response


def login_mentee():
    load_dotenv()

    test_data = {
        "email": os.getenv("TEST_MENTEE_EMAIL"),
        "password": os.getenv("TEST_MENTEE_PASSWORD"),
        "role": int(os.getenv("TEST_MENTEE_ROLE")),
    }

    BASE_URL = os.getenv("BASE_URL")

    # login with the correct data
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    return response


def login_guest():
    load_dotenv()

    test_data = {
        "email": os.getenv("TEST_GUEST_EMAIL"),
        "password": os.getenv("TEST_GUEST_PASSWORD"),
        "role": int(os.getenv("TEST_GUEST_ROLE")),
    }

    BASE_URL = os.getenv("BASE_URL")

    # login with the correct data
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    return response


def login_partner():
    load_dotenv()

    test_data = {
        "email": os.getenv("TEST_PARTNER_EMAIL"),
        "password": os.getenv("TEST_PARTNER_PASSWORD"),
        "role": int(os.getenv("TEST_PARTNER_ROLE")),
    }

    BASE_URL = os.getenv("BASE_URL")

    # login with the correct data
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    return response


# use the first token and get the refresh token
def get_refresh_token(first_token):
    firebase_api_key = os.getenv("FIREBASE_API_KEY")

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
