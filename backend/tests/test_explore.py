import requests
from api.models import MenteeProfile, MentorProfile, Admin, Users
from pprint import pprint
import os
from dotenv import load_dotenv


def test_find_mentee():

    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    # list all the mentees from the api
    response = requests.get(f"{BASE_URL}/api/accounts/2")
    data = response.json()

    assert response.status_code == 200

    assert "result" in data
    result = data["result"]
    assert "accounts" in result

    accounts = result["accounts"]

    # get the public mentee instances in the database
    mentee_users = MenteeProfile.objects.filter(is_private=False).count()

    assert len(accounts) > 0
    assert len(accounts) == mentee_users


def test_find_mentor():

    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    # list all the mentors from the api
    response = requests.get(f"{BASE_URL}/api/accounts/1")
    data = response.json()

    assert response.status_code == 200

    assert "result" in data
    result = data["result"]
    assert "accounts" in result

    accounts = result["accounts"]

    # get the mentor instances in the database
    mentee_users = MentorProfile.objects.count()

    assert len(accounts) > 0
    assert len(accounts) == mentee_users
