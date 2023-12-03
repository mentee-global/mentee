import requests
import os
from dotenv import load_dotenv
from pprint import pprint


# test the loaded profile of the user
def test_mentor_account_info():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    profile_id = os.getenv("TEST_MENTOR_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.getenv('TEST_MENTOR_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.getenv("TEST_MENTOR_EMAIL")
    assert "name" in response.json()["result"]["account"]
    assert "phone_number" in response.json()["result"]["account"]
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_mentee_account_info():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    profile_id = os.getenv("TEST_MENTEE_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.getenv('TEST_MENTEE_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.getenv("TEST_MENTEE_EMAIL")
    assert "name" in response.json()["result"]["account"]
    assert "phone_number" in response.json()["result"]["account"]
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_partner_account_info():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    profile_id = os.getenv("TEST_PARTNER_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.getenv('TEST_PARTNER_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.getenv("TEST_PARTNER_EMAIL")
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_guest_account_info():
    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    profile_id = os.getenv("TEST_GUEST_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.getenv('TEST_GUEST_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.getenv("TEST_GUEST_EMAIL")
    assert "name" in response.json()["result"]["account"]
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]
