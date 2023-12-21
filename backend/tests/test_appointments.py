import requests
import os
from dotenv import load_dotenv
from api.models import AppointmentRequest
from .utils.login_utils import *

load_dotenv()


# test the appointments for a mentor
def test_mentor_appointments(client):
    login_response = login_mentor(client)
    first_token = login_response.get_json()["result"]["token"]
    role = login_response.get_json()["result"]["role"]

    profile_id = profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")

    refresh_token = get_refresh_token(first_token)
    jwt_token = get_access_token(refresh_token)

    os.environ["MENTOR_JWT_TOKEN"] = jwt_token

    url = f"/api/appointment/{role}/{profile_id}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = client.get(url, headers=headers)

    appointments = response.get_json()["result"]["requests"]
    appointments_count = len(appointments)

    for appointment in appointments:
        assert appointment["mentor_id"]["$oid"] == profile_id

    # removed because of mongo issues
    # mentor_appointments = AppointmentRequest.objects.filter(
    #     mentor_id=profile_id
    # ).count()
    # assert (
    #     appointments_count == mentor_appointments
    # ), "Mentor appointments retrieved from the API does not match the stored in the database."


def test_mentee_appointments(client):
    login_response = login_mentee(client)
    first_token = login_response.get_json()["result"]["token"]
    role = login_response.get_json()["result"]["role"]

    profile_id = profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")

    refresh_token = get_refresh_token(first_token)
    jwt_token = get_access_token(refresh_token)

    os.environ["MENTEE_JWT_TOKEN"] = jwt_token

    url = f"/api/appointment/{role}/{profile_id}"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Authorization": jwt_token,
    }
    response = client.get(url, headers=headers)

    appointments = response.get_json()["result"]["requests"]
    appointments_count = len(appointments)

    for appointment in appointments:
        assert appointment["mentee_id"]["$oid"] == profile_id

    # removed because of mongo issues
    # mentee_appointments = AppointmentRequest.objects.filter(
    #     mentee_id=profile_id
    # ).count()
    # assert (
    #     appointments_count == mentee_appointments
    # ), "Mentee appointments retrieved from the API does not match the stored in the database."
