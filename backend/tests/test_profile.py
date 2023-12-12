import requests
import os
from dotenv import load_dotenv
from .utils.profile_utils import *

load_dotenv()


# test the loaded profile of the user
def test_mentor_account_info():
    BASE_URL = os.environ.get("BASE_URL")

    profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.environ.get('TEST_MENTOR_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.environ.get("TEST_MENTOR_EMAIL")
    assert "name" in response.json()["result"]["account"]
    assert "phone_number" in response.json()["result"]["account"]
    assert response.json()["result"]["account"]["phone_number"] == os.environ.get(
        "TEST_MENTOR_PHONE_NUMBER"
    )
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_mentee_account_info():
    BASE_URL = os.environ.get("BASE_URL")

    profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.environ.get('TEST_MENTEE_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.environ.get("TEST_MENTEE_EMAIL")
    assert "name" in response.json()["result"]["account"]
    assert "phone_number" in response.json()["result"]["account"]
    assert response.json()["result"]["account"]["phone_number"] == os.environ.get(
        "TEST_MENTEE_PHONE_NUMBER"
    )
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_partner_account_info():
    BASE_URL = os.environ.get("BASE_URL")

    profile_id = os.environ.get("TEST_PARTNER_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.environ.get('TEST_PARTNER_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.environ.get("TEST_PARTNER_EMAIL")
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_guest_account_info():
    BASE_URL = os.environ.get("BASE_URL")

    profile_id = os.environ.get("TEST_GUEST_PROFILE_ID")

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.environ.get('TEST_GUEST_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.json()["result"]["account"]
    assert response_email == os.environ.get("TEST_GUEST_EMAIL")
    assert "name" in response.json()["result"]["account"]
    assert "firebase_uid" in response.json()["result"]["account"]
    assert profile_id == response.json()["result"]["account"]["_id"]["$oid"]


def test_mentor_profile_update_contact():
    jwt_token = os.environ["MENTOR_JWT_TOKEN"]
    profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")
    account_type = os.environ.get("TEST_MENTOR_ROLE")

    update_profile_contact(jwt_token, profile_id, account_type)

    reset_profile_contact(jwt_token, profile_id, account_type)

    update_profile_info(jwt_token, profile_id, account_type)


def test_mentee_profile_update_contact():
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]
    profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")
    account_type = os.environ.get("TEST_MENTEE_ROLE")

    update_profile_contact(jwt_token, profile_id, account_type)

    reset_profile_contact(jwt_token, profile_id, account_type)

    update_profile_info(jwt_token, profile_id, account_type)


def update_profile_contact(jwt_token, profile_id, account_type):
    BASE_URL = os.environ.get("BASE_URL")

    test_phone = "1234567890"
    test_email = "test@gmail.com"

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
        "Content-Type": "application/json",
    }

    params = {
        "account_type": account_type,
    }

    json_data = {
        "email": test_email,
        "phone": test_phone,
        "email_notifications": True,
        "text_notifications": True,
        "phone_number": test_phone,
    }

    response = requests.put(
        f"{BASE_URL}/api/account/{profile_id}",
        params=params,
        headers=headers,
        json=json_data,
    )

    assert response.status_code == 200

    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={account_type}"
    )

    assert response.status_code == 200

    assert response.json()["result"]["account"]["phone_number"] == test_phone
    assert response.json()["result"]["account"]["email"] == test_email


def update_profile_info(jwt_token, profile_id, account_type):
    BASE_URL = os.environ.get("BASE_URL")

    account_data = {
        "name": "Roberto Murer Mentor",
        "professional_title": "IT sdfs",
        "biography": "aaaaa",
        "website": "http://www.google.com",
        "languages": [
            "Arabic",
        ],
        "linkedin": "",
        "specializations": [
            "Engineering",
        ],
        "edited": True,
    }

    test_name = "Test Name"
    test_professional_title = "Test Professional Title"
    test_biography = "Test Biography"
    test_website = "http://www.youtube.com"
    test_languages = ["English", "Spanish"]
    test_linkedin = "https://www.linkedin.com/in/robert-murer-1b1b1b1b1"
    test_specializations = ["Mathematics"]

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Authorization": jwt_token,
    }

    params = {
        "account_type": account_type,
    }

    json_data = account_data
    json_data["name"] = test_name
    json_data["biography"] = test_biography
    json_data["languages"] = test_languages

    if account_type == "1":
        json_data["professional_title"] = test_professional_title
        json_data["website"] = test_website
        json_data["linkedin"] = test_linkedin
        json_data["specializations"] = test_specializations

    response = requests.put(
        f"{BASE_URL}/api/account/{profile_id}",
        params=params,
        headers=headers,
        json=json_data,
    )

    assert response.status_code == 200

    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={account_type}"
    )

    assert response.status_code == 200

    assert response.json()["result"]["account"]["name"] == test_name
    assert response.json()["result"]["account"]["biography"] == test_biography
    assert response.json()["result"]["account"]["languages"] == test_languages

    if account_type == "1":
        assert (
            response.json()["result"]["account"]["professional_title"]
            == test_professional_title
        )
        assert (
            response.json()["result"]["account"]["specializations"]
            == test_specializations
        )
        assert response.json()["result"]["account"]["linkedin"] == test_linkedin
        assert response.json()["result"]["account"]["website"] == test_website

    if str(account_type) == "1":
        reset_mentor_info(account_data)
    elif str(account_type) == "2":
        reset_mentee_info(account_data)
