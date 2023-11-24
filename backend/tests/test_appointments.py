import requests
import os
from dotenv import load_dotenv
from api.models import AppointmentRequest


# test the appointments for a mentor
def test_appointments():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")
    profile_id, role = get_user_data()
    jwt_token = get_access_token_from_refresh_token()
    os.environ["JWT_TOKEN"] = jwt_token

    url = f"{BASE_URL}/api/appointment/{role}/{profile_id}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = requests.get(url, headers=headers)

    appointments = response.json()["result"]["requests"]
    appointments_count = len(appointments)

    for appointment in appointments:
        assert appointment["mentor_id"]["oid"] == profile_id

    mentor_appointments = AppointmentRequest.objects.filter(
        mentor_id=profile_id
    ).count()
    assert appointments_count == mentor_appointments


# login to return the token


def get_access_token_from_refresh_token():
    load_dotenv()

    firebase_api_key = os.getenv("FIREBASE_API_KEY")
    test_mentor_refresh_token = get_refresh_token()

    url = f"https://securetoken.googleapis.com/v1/token?key={firebase_api_key}"

    data = {"grant_type": "refresh_token", "refresh_token": test_mentor_refresh_token}

    response = requests.post(url, data=data)
    return response.json()["access_token"]


def get_user_data():
    load_dotenv()

    test_data = {
        "email": os.getenv("TEST_MENTOR_EMAIL"),
        "password": os.getenv("TEST_MENTOR_PASSWORD"),
        "role": int(os.getenv("TEST_MENTOR_ROLE")),
    }

    BASE_URL = os.getenv("BASE_URL")

    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)

    profile_id = response.json()["result"]["profileId"]
    role = response.json()["result"]["role"]

    return profile_id, role


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
