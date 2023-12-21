import requests
from dotenv import load_dotenv
import os

load_dotenv()


def test_apply_mentor(client):
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
    }

    json_data = {
        "email": "test@gmail.com",
        "name": "Test Name",
        "cell_number": "031234567889",
        "hear_about_us": "Friends",
        "offer_donation": "I'm unable to offer a donation.",
        "employer_name": "Company",
        "companyTime": "1-4 years",
        "role_description": "Title",
        "immigrant_status": True,
        "languages": "Urdu",
        "specialistTime": "One year with us",
        "referral": "Me",
        "knowledge_location": "Asia",
        "isColorPerson": True,
        "isMarginalized": True,
        "isFamilyNative": True,
        "isEconomically": True,
        "identify": "man",
        "pastLiveLocation": "Location",
        "date_submitted": "2023-12-06T07:17:09.105Z",
        "role": 1,
        "preferred_language": "en-US",
    }

    response = client.post("/api/application/new", headers=headers, json=json_data)

    assert "success" in response.get_json(), "Unable to apply for Mentor Role"


def test_apply_mentee(client):
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
    }

    json_data = {
        "email": "test@gmail.com",
        "name": "Test Name",
        "age": "I am 18-22 years old.",
        "organization": "Org",
        "immigrant_status": [
            "I am a refugee",
            "I am an immigrant (I am newly arrived or my parents are newly arrived in the country I am in)",
        ],
        "country": "Country",
        "identify": "man",
        "language": "Arabic",
        "topics": [
            "Architecture",
        ],
        "workstate": [
            "I work full-time.",
        ],
        "isSocial": "yes",
        "questions": "Do you people arrange events?",
        "date_submitted": "2023-12-06T07:30:06.469Z",
        "role": 2,
        "preferred_language": "en-US",
    }

    response = client.post("/api/application/new", headers=headers, json=json_data)

    assert "success" in response.get_json(), "Unable to apply for Mentee Role"


def test_build_profile(client):
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
    }

    json_data = {
        "name": "NAme",
        "professional_title": "tgfvc",
        "password": "password123",
        "confirmPassword": "password123",
        "biography": "gfvc",
        "location": "rgfdcx",
        "languages": [
            "Bengali",
        ],
        "specializations": [
            "Architecture",
        ],
        "video": None,
        "email": "rgfdc@gmail.com",
        "role": 1,
        "preferred_language": "en-US",
        "image": None,
        "changedImage": False,
        "edited": True,
        "account_type": 1,
    }

    response = client.post("/api/account", headers=headers, json=json_data)

    assert response.status_code == 200
    assert response.get_json()["success"] == True
