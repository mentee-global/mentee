import os
import requests
from dotenv import load_dotenv

load_dotenv()

def reset_profile_contact(jwt_token, profile_id, account_type):
    BASE_URL = os.environ.get("BASE_URL")

    params = {
        "account_type": account_type,
    }

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
        "Content-Type": "application/json",
    }

    if str(account_type) == "1":
        original_phone = os.environ.get("TEST_MENTOR_PHONE_NUMBER")
        original_email = os.environ.get("TEST_MENTOR_EMAIL")
    elif str(account_type) == "2":
        original_phone = os.environ.get("TEST_MENTEE_PHONE_NUMBER")
        original_email = os.environ.get("TEST_MENTEE_EMAIL")

    json_data = {
        "email": original_email,
        "phone": original_phone,
        "email_notifications": True,
        "text_notifications": True,
        "phone_number": original_phone,
    }

    response = requests.put(
        f"{BASE_URL}/api/account/{profile_id}",
        params=params,
        headers=headers,
        json=json_data,
    )

    assert response.status_code == 200


def reset_mentor_info(original_json_data):
    jwt_token = os.environ["MENTOR_JWT_TOKEN"]
    profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")
    account_type = os.environ.get("TEST_MENTOR_ROLE")
    mentor_name = "Roberto Murer Mentor1"

    reset_info(original_json_data, jwt_token, profile_id, account_type, mentor_name)


def reset_mentee_info(original_json_data):
    jwt_token = os.environ["MENTEE_JWT_TOKEN"]
    profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")
    account_type = os.environ.get("TEST_MENTEE_ROLE")
    mentee_name = "Robert Mente"

    reset_info(original_json_data, jwt_token, profile_id, account_type, mentee_name)


def reset_info(original_json_data, jwt_token, profile_id, account_type, name):
    BASE_URL = os.environ.get("BASE_URL")

    original_name = name
    original_professional_title = "IT sdfs"
    original_biography = "aaaaa"
    original_website = "http://www.google.com"
    original_languages = [
        "Hello",
        "English",
        "Cantonese",
        "Hebrew",
        "Pashto",
        "Swahili",
        "Urdu",
        "AAARabic",
        "Arabic",
    ]
    original_linkedin = ""
    original_specializations = [
        "Engineering",
    ]

    original_json_data["name"] = original_name
    original_json_data["professional_title"] = original_professional_title
    original_json_data["biography"] = original_biography
    original_json_data["website"] = original_website
    original_json_data["languages"] = original_languages
    original_json_data["linkedin"] = original_linkedin
    original_json_data["specializations"] = original_specializations

    params = {
        "account_type": account_type,
    }

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Authorization": jwt_token,
    }

    response = requests.put(
        f"{BASE_URL}/api/account/{profile_id}",
        params=params,
        headers=headers,
        json=original_json_data,
    )

    assert response.status_code == 200
