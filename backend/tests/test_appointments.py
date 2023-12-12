import requests
import os
from dotenv import load_dotenv
from api.models import AppointmentRequest
from .utils.login_utils import *

load_dotenv()


# test the appointments for a mentor
def test_mentor_appointments():
    BASE_URL = os.environ.get("BASE_URL")

    login_response = login_mentor()
    first_token = login_response.json()["result"]["token"]
    profile_id = login_response.json()["result"]["profileId"]
    role = login_response.json()["result"]["role"]

    refresh_token = get_refresh_token(first_token)
    jwt_token = get_access_token(refresh_token)

    os.environ["MENTOR_JWT_TOKEN"] = jwt_token

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
        assert appointment["mentor_id"]["$oid"] == profile_id

    # removed because of mongo issues
    # mentor_appointments = AppointmentRequest.objects.filter(
    #     mentor_id=profile_id
    # ).count()
    # assert (
    #     appointments_count == mentor_appointments
    # ), "Mentor appointments retrieved from the API does not match the stored in the database."


def test_mentee_appointments():
    BASE_URL = os.environ.get("BASE_URL")

    login_response = login_mentee()
    first_token = login_response.json()["result"]["token"]
    profile_id = login_response.json()["result"]["profileId"]
    role = login_response.json()["result"]["role"]

    refresh_token = get_refresh_token(first_token)
    jwt_token = get_access_token(refresh_token)

    os.environ["MENTEE_JWT_TOKEN"] = jwt_token

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
        assert appointment["mentee_id"]["$oid"] == profile_id

    # removed because of mongo issues
    # mentee_appointments = AppointmentRequest.objects.filter(
    #     mentee_id=profile_id
    # ).count()
    # assert (
    #     appointments_count == mentee_appointments
    # ), "Mentee appointments retrieved from the API does not match the stored in the database."
