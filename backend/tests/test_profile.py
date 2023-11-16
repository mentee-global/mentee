import requests
import os
from dotenv import load_dotenv
from pprint import pprint

# test the loaded profile of the user
def test_account_info():

    load_dotenv()

    BASE_URL = os.getenv("BASE_URL")

    profile_id = get_user_data()

    # get profile data
    response = requests.get(
        f"{BASE_URL}/api/account/{profile_id}?account_type={os.getenv('TEST_MENTOR_ROLE')}"
    )
    response_email = response.json()["result"]["account"]["email"]
    response_role = response.json()["result"]["account"]["role"]

    assert response_email == os.getenv("TEST_MENTOR_EMAIL")
    assert response_role == os.getenv("TEST_MENTOR_ROLE")


def get_user_data():

    load_dotenv()

    test_data = {
        "email": os.getenv("TEST_MENTOR_EMAIL"),
        "password": os.getenv("TEST_MENTOR_PASSWORD"),
        "role": int(os.getenv("TEST_MENTOR_ROLE")),
    }

    BASE_URL = os.getenv("BASE_URL")

    # login the example user
    response = requests.post(f"{BASE_URL}/auth/login", json=test_data)
    profile_id = response.json()["result"]["profileId"]

    return profile_id
