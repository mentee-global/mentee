import requests
from api.models import MenteeProfile, MentorProfile, PartnerProfile
import os
from dotenv import load_dotenv

load_dotenv()


def test_find_mentee(client):
    # list all the mentees from the api
    response = client.get(f"/api/accounts/2")
    data = response.get_json()

    assert response.status_code == 200

    assert "result" in data
    result = data["result"]
    assert "accounts" in result

    accounts = result["accounts"]

    # get the public mentee instances in the database
    mentee_users = MenteeProfile.objects.filter(is_private=False).count()

    assert len(accounts) > 0
    assert (
        len(accounts) == mentee_users
    ), "Mentee accounts retrieved from the api does not match the Mentee accounts in the database."


def test_find_mentor(client):
    # list all the mentors from the api
    response = client.get(f"/api/accounts/1")
    data = response.get_json()

    assert response.status_code == 200

    assert "result" in data
    result = data["result"]
    assert "accounts" in result

    accounts = result["accounts"]

    # get the mentor instances in the database
    mentor_users = MentorProfile.objects.count()
    assert len(accounts) > 0
    assert (
        len(accounts) == mentor_users
    ), "Mentor accounts retrieved from the api does not match the Mentor accounts in the database."


def test_find_partner(client):
    # list all the partners from the api
    response = client.get(f"/api/accounts/3")
    data = response.get_json()

    assert response.status_code == 200

    assert "result" in data
    result = data["result"]
    assert "accounts" in result

    accounts = result["accounts"]

    # get the parter instances in the database
    partner_users = PartnerProfile.objects.count()
    assert len(accounts) > 0
    assert (
        len(accounts) == partner_users
    ), "Partner accounts retrieved from the api does not match the Mentor accounts in the database."
