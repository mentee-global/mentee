import requests
import os
from dotenv import load_dotenv
from .utils.profile_utils import *

load_dotenv()


# test the loaded profile of the user
def test_mentor_account_info(client):
    profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")

    # get profile data
    response = client.get(
        f"/api/account/{profile_id}?account_type={os.environ.get('TEST_MENTOR_ROLE')}"
    )
    response_email = response.get_json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.get_json()["result"]["account"]
    assert response_email == os.environ.get("TEST_MENTOR_EMAIL")
    assert "name" in response.get_json()["result"]["account"]
    assert "phone_number" in response.get_json()["result"]["account"]
    assert response.get_json()["result"]["account"]["phone_number"] == os.environ.get(
        "TEST_MENTOR_PHONE_NUMBER"
    )
    assert "firebase_uid" in response.get_json()["result"]["account"]
    assert profile_id == response.get_json()["result"]["account"]["_id"]["$oid"]


def test__wrong_info(client):
    profile_id = "hgdfvc64yt5ter"

    response = client.get(f"/api/account/{profile_id}?account_type=1")
    assert response.status_code == 422

    response = client.get(f"/api/account/{profile_id}?account_type=2")
    assert response.status_code == 422


# test the loaded profile of the user
def test_mentee_account_info(client):
    profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")

    # get profile data
    response = client.get(
        f"/api/account/{profile_id}?account_type={os.environ.get('TEST_MENTEE_ROLE')}"
    )
    response_email = response.get_json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.get_json()["result"]["account"]
    assert response_email == os.environ.get("TEST_MENTEE_EMAIL")
    assert "name" in response.get_json()["result"]["account"]
    assert "phone_number" in response.get_json()["result"]["account"]
    assert response.get_json()["result"]["account"]["phone_number"] == os.environ.get(
        "TEST_MENTEE_PHONE_NUMBER"
    )
    assert "firebase_uid" in response.get_json()["result"]["account"]
    assert profile_id == response.get_json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_partner_account_info(client):
    profile_id = os.environ.get("TEST_PARTNER_PROFILE_ID")

    # get profile data
    response = client.get(
        f"/api/account/{profile_id}?account_type={os.environ.get('TEST_PARTNER_ROLE')}"
    )
    response_email = response.get_json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.get_json()["result"]["account"]
    assert response_email == os.environ.get("TEST_PARTNER_EMAIL")
    assert "firebase_uid" in response.get_json()["result"]["account"]
    assert profile_id == response.get_json()["result"]["account"]["_id"]["$oid"]


# test the loaded profile of the user
def test_guest_account_info(client):
    profile_id = os.environ.get("TEST_GUEST_PROFILE_ID")

    # get profile data
    response = client.get(
        f"/api/account/{profile_id}?account_type={os.environ.get('TEST_GUEST_ROLE')}"
    )
    response_email = response.get_json()["result"]["account"]["email"]

    assert response.status_code == 200
    assert "email" in response.get_json()["result"]["account"]
    assert response_email == os.environ.get("TEST_GUEST_EMAIL")
    assert "name" in response.get_json()["result"]["account"]
    assert "firebase_uid" in response.get_json()["result"]["account"]
    assert profile_id == response.get_json()["result"]["account"]["_id"]["$oid"]


def test_mentor_profile_update_contact(client):
    jwt_token = os.environ["MENTOR_JWT_TOKEN"]
    profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")
    account_type = os.environ.get("TEST_MENTOR_ROLE")

    update_profile_contact(jwt_token, profile_id, account_type, client)

    reset_profile_contact(jwt_token, profile_id, account_type, client)

    update_profile_info(jwt_token, profile_id, account_type, client)


def test_mentee_profile_update_contact(client):
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]
    profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")
    account_type = os.environ.get("TEST_MENTEE_ROLE")

    update_profile_contact(jwt_token, profile_id, account_type, client)

    reset_profile_contact(jwt_token, profile_id, account_type, client)

    update_profile_info(jwt_token, profile_id, account_type, client)


def update_profile_contact(jwt_token, profile_id, account_type, client):
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

    response = client.put(
        f"/api/account/{profile_id}",
        query_string=params,
        headers=headers,
        json=json_data,
    )

    assert response.status_code == 200

    response = client.get(f"/api/account/{profile_id}?account_type={account_type}")

    assert response.status_code == 200

    assert response.get_json()["result"]["account"]["phone_number"] == test_phone
    assert response.get_json()["result"]["account"]["email"] == test_email


def update_profile_info(jwt_token, profile_id, account_type, client):
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

    response = client.put(
        f"/api/account/{profile_id}",
        query_string=params,
        headers=headers,
        json=json_data,
    )

    assert response.status_code == 200

    response = client.get(f"/api/account/{profile_id}?account_type={account_type}")

    assert response.status_code == 200

    assert response.get_json()["result"]["account"]["name"] == test_name
    assert response.get_json()["result"]["account"]["biography"] == test_biography
    assert response.get_json()["result"]["account"]["languages"] == test_languages

    if account_type == "1":
        assert (
            response.get_json()["result"]["account"]["professional_title"]
            == test_professional_title
        )
        assert (
            response.get_json()["result"]["account"]["specializations"]
            == test_specializations
        )
        assert response.get_json()["result"]["account"]["linkedin"] == test_linkedin
        assert response.get_json()["result"]["account"]["website"] == test_website

    if str(account_type) == "1":
        reset_mentor_info(account_data, client)
    elif str(account_type) == "2":
        reset_mentee_info(account_data, client)


def test_change_image(client):
    jwt_token = os.environ.get("MENTOR_JWT_TOKEN")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
    }

    data = '-----------------------------321406871418482840741855260225\r\nContent-Disposition: form-data; name="image"; filename="kapp.jpeg"\r\nContent-Type: image/jpeg\r\n\r\n-----------------------------321406871418482840741855260225\r\nContent-Disposition: form-data; name="account_type"\r\n\r\n1\r\n-----------------------------321406871418482840741855260225--\r\n'

    response = client.put(
        "/api/account/6582973a28c16374dfd4b9de/image",
        headers=headers,
        data=data,
    )

    assert response.status_code == 200
