from api.models import Event
import requests
import os
from requests_toolbelt.multipart.encoder import MultipartEncoder
from dotenv import load_dotenv
from .utils.login_utils import *
from PIL import Image
import io
import json

dir_path = os.path.dirname(os.path.realpath(__file__))

consts_path = os.path.join(dir_path, "utils/consts.json")

load_dotenv()
with open(consts_path, "r") as f:
    constants = json.load(f)


def test_mentor_events(client):
    jwt_token = os.environ["MENTOR_JWT_TOKEN"]

    mentor_role = constants["TEST_MENTOR_ROLE"]

    url = f"/api/events/{mentor_role}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = client.get(url, headers=headers)

    response_events = response.get_json()["result"]["events"]
    response_events_count = len(response_events)

    for response_event in response_events:
        assert mentor_role in response_event["role"]

    object_events = Event.objects.filter(role=mentor_role).count()

    assert (
        object_events == response_events_count
    ), "Mentor events retrieved from the api do not match the events retrieved from the database."


def test_mentee_events(client):
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]

    mentee_role = constants["TEST_MENTEE_ROLE"]

    url = f"/api/events/{mentee_role}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = client.get(url, headers=headers)

    response_events = response.get_json()["result"]["events"]
    response_events_count = len(response_events)

    for response_event in response_events:
        assert mentee_role in response_event["role"]

    object_events = Event.objects.filter(role=mentee_role).count()

    assert (
        object_events == response_events_count
    ), "Mentee events retrieved from the api do not match the events retrieved from the database."


def test_create_event_mentor(client):
    profile_id = constants["TEST_MENTOR_PROFILE_ID"]
    jwt_token = os.environ["MENTOR_JWT_TOKEN"]

    create_event(profile_id, jwt_token, 0, client)
    object_events = Event.objects.filter(role=1)

    event_exists = any(event.title == "Test Title" for event in object_events)
    assert event_exists, "Mentor failed to create event"


def test_create_event_mentee(client):
    profile_id = constants["TEST_MENTEE_PROFILE_ID"]
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]

    create_event(profile_id, jwt_token, 0, client)
    object_events = Event.objects.filter(role=2)

    event_exists = any(event.title == "Test Title" for event in object_events)
    assert event_exists, "Mentee failed to create event"


def test_edit_event(client):
    profile_id = constants["TEST_MENTEE_PROFILE_ID"]
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]

    user_events = get_events(profile_id, jwt_token, client)
    event_id = user_events[0]

    create_event(profile_id, jwt_token, event_id, client)


def test_event_image(client):
    admin_jwt_token = os.environ.get("ADMIN_JWT_TOKEN")
    profile_id = constants["TEST_MENTEE_PROFILE_ID"]
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]

    user_events = get_events(profile_id, jwt_token, client)
    event_id = user_events[0]

    img = Image.new("RGB", (60, 30), color=(73, 109, 137))
    img.save("mock_image.jpg")

    with open("mock_image.jpg", "rb") as img_file:
        img_data = img_file.read()

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": admin_jwt_token,
    }

    data = MultipartEncoder(
        fields={"image": ("mock_image.jpg", img_data, "image/jpeg")}
    )
    headers["Content-Type"] = data.content_type

    response = client.put(
        f"/api/event_register/{event_id}/image",
        headers=headers,
        data=data,
    )
    assert (
        response.status_code == 200
    ), f"Failed to upload image for event. {response.text}"

    try:
        os.remove("mock_image.jpg")
    except:
        pass


def create_event(profile_id, jwt_token, event_id, client):
    event_title = "Test Title"
    event_description = "Test"
    event_url = "https://www.google.com"

    json_data = {
        "event_id": event_id,
        "user_id": profile_id,
        "title": event_title,
        "role": [
            2,
            1,
        ],
        "start_datetime": "2023-12-05T21:00:00.000Z",
        "start_datetime_str": "2023-12-06 02:00",
        "end_datetime": "2023-12-07T01:00:00.000Z",
        "end_datetime_str": "2023-12-07 06:00",
        "description": event_description,
        "url": event_url,
    }

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Authorization": jwt_token,
    }

    response = client.post(f"/api/event_register", headers=headers, json=json_data)

    assert response.status_code == 200, f"Error creating event. {response.text}"


def test_mentor_delete_events(client):
    profile_id = constants["TEST_MENTOR_PROFILE_ID"]
    jwt_token = os.environ["MENTOR_JWT_TOKEN"]

    user_events = get_events(profile_id, jwt_token, client)

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
    }

    for event in user_events:
        response = client.delete(f"/api/events/delete/{event}", headers=headers)
        assert (
            response.status_code == 200
        ), f"Unable to delete the created events. {response.text}"


def test_mentee_delete_events(client):
    profile_id = constants["TEST_MENTEE_PROFILE_ID"]
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]

    user_events = get_events(profile_id, jwt_token, client)

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
    }

    for event in user_events:
        response = client.delete(f"/api/events/delete/{event}", headers=headers)
        assert (
            response.status_code == 200
        ), f"Unable to delete the created events. {response.text}"


def get_events(profile_id, jwt_token, client):
    url = f"/api/events/1"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = client.get(url, headers=headers)

    events = response.get_json()["result"]["events"]
    user_events = []

    for event in events:
        if event["user_id"]["$oid"] == profile_id:
            user_events.append(event["_id"]["$oid"])

    return user_events
