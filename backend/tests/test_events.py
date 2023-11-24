from api.models import Event
import requests
import os
from dotenv import load_dotenv


def test_events():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    jwt_token = get_access_token_from_refresh_token()
    mentor_role = int(os.getenv("TEST_MENTOR_ROLE"))

    url = f"{BASE_URL}/api/events/{mentor_role}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = requests.get(url, headers=headers)

    response_events = response.json()["result"]["events"]
    response_events_count = len(response_events)

    for response_event in response_events:
        assert mentor_role in response_event["role"]

    object_events = Event.objects.filter(role=mentor_role).count()

    assert object_events == response_events_count


def get_access_token_from_refresh_token():
    load_dotenv()

    firebase_api_key = os.getenv("FIREBASE_API_KEY")
    test_mentor_refresh_token = get_refresh_token()

    url = f"https://securetoken.googleapis.com/v1/token?key={firebase_api_key}"

    data = {"grant_type": "refresh_token", "refresh_token": test_mentor_refresh_token}

    response = requests.post(url, data=data)
    return response.json()["access_token"]


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

    return response.json()["result"]["token"]


def get_refresh_token():
    first_token = login_mentor()

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
