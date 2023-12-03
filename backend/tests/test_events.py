from api.models import Event
import requests
import os
from dotenv import load_dotenv
from .utils.login_utils import *


def test_mentor_events():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    jwt_token = os.environ["MENTOR_JWT_TOKEN"]

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


def test_mentee_events():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    jwt_token = os.environ["MENTEE_JWT_TOKEN"]

    mentee_role = int(os.getenv("TEST_MENTEE_ROLE"))

    url = f"{BASE_URL}/api/events/{mentee_role}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = requests.get(url, headers=headers)

    response_events = response.json()["result"]["events"]
    response_events_count = len(response_events)

    for response_event in response_events:
        assert mentee_role in response_event["role"]

    object_events = Event.objects.filter(role=mentee_role).count()

    assert object_events == response_events_count
