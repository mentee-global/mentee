import requests, pytest
from api.models import MenteeProfile
import os
from dotenv import load_dotenv
from api.views.main import is_mentee_account_private

load_dotenv()


# the private mentee profiles should not be in the database
def test_mentee_privacy():
    # create a list of public mentee ids and store ids of all the mentees returned from the api response
    public_mentee_ids = []

    BASE_URL = os.environ.get("BASE_URL")

    # list all the mentees from the api
    response = requests.get(f"{BASE_URL}/api/accounts/2")
    data = response.json()

    assert response.status_code == 200

    assert "result" in data
    result = data["result"]
    assert "accounts" in result

    accounts = result["accounts"]

    # find the instances from the database which should be public
    private_mentee_users = MenteeProfile.objects.filter(is_private=True)
    all_mentee_users = MenteeProfile.objects

    private_mentee_count = private_mentee_users.count()
    all_mentee_count = all_mentee_users.count()

    search_mentee_users = all_mentee_count - private_mentee_count

    assert len(accounts) > 0

    # check if the number of public mentees returned from the api is equal to the number of public mentees in the database
    assert len(accounts) == search_mentee_users

    for account in accounts:
        assert account["is_private"] == False
        public_mentee_ids.append(account["_id"]["$oid"])

    # make sure that the private mentees are not in the list of public mentees
    for private_mentee in private_mentee_users:
        assert (
            str(private_mentee.id) not in public_mentee_ids
        ), "Private mentee account found in the api response"
