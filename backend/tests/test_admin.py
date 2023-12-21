from dotenv import load_dotenv
import os
import secrets
import string
from .utils.login_utils import *
from api.views.admin import *

load_dotenv()


def test_admin_info(client):
    admin_id = os.environ.get("TEST_ADMIN_PROFILE_ID")
    admin_email = os.environ.get("TEST_ADMIN_EMAIL")
    admin_name = os.environ.get("TEST_ADMIN_NAME")

    response = client.get(f"/api/admin/{admin_id}")

    assert "name" in response.get_json()["result"]["admin"]
    assert "firebase_uid" in response.get_json()["result"]["admin"]
    assert "email" in response.get_json()["result"]["admin"]
    assert "_id" in response.get_json()["result"]["admin"]

    assert admin_id == response.get_json()["result"]["admin"]["_id"]["$oid"]
    assert admin_email == response.get_json()["result"]["admin"]["email"]
    assert admin_name == response.get_json()["result"]["admin"]["name"]


def test_admin_wrong_info(client):
    admin_id = "abcdefgh"

    response = client.get(f"/api/admin/{admin_id}")

    assert response.status_code == 422


def test_admin_auth(client):
    login_response = login_admin(client)
    first_token = login_response.get_json()["result"]["token"]

    refresh_token = get_refresh_token(first_token)
    jwt_token = get_access_token(refresh_token)

    os.environ["ADMIN_JWT_TOKEN"] = jwt_token


def test_upload_emails(client):
    jwt_token = os.environ["ADMIN_JWT_TOKEN"]
    alphabet = string.ascii_letters + string.digits
    new_user_username = "".join(secrets.choice(alphabet) for _ in range(10))

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
        "Content-Type": "multipart/form-data; boundary=---------------------------6346701797740788311626083455",
    }

    data = f'-----------------------------6346701797740788311626083455\r\nContent-Disposition: form-data; name="messageText"\r\n\r\ntest{new_user_username}@gmail.com\r\n-----------------------------6346701797740788311626083455\r\nContent-Disposition: form-data; name="role"\r\n\r\n1\r\n-----------------------------6346701797740788311626083455\r\nContent-Disposition: form-data; name="password"\r\n\r\nnull\r\n-----------------------------6346701797740788311626083455\r\nContent-Disposition: form-data; name="name"\r\n\r\nnull\r\n-----------------------------6346701797740788311626083455--\r\n'

    response = client.post("/api/upload/accountsEmails", headers=headers, data=data)

    assert "success" in response.get_json()
    assert True == response.get_json()["success"]


def test_duplicate_guest(client):
    jwt_token = os.environ["ADMIN_JWT_TOKEN"]

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
        "Content-Type": "multipart/form-data; boundary=---------------------------2046008840495448074105481842",
    }

    data = '-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="messageText"\r\n\r\nguest1@gmail.com\r\n-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="role"\r\n\r\n4\r\n-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="password"\r\n\r\npassword123\r\n-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="name"\r\n\r\nTest Guest\r\n-----------------------------2046008840495448074105481842--\r\n'

    response = client.post("/api/upload/accountsEmails", headers=headers, data=data)

    assert response.status_code == 500


def test_new_guest(client):
    jwt_token = os.environ["ADMIN_JWT_TOKEN"]
    alphabet = string.ascii_letters + string.digits
    new_guest_username = "".join(secrets.choice(alphabet) for _ in range(10))

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
        "Content-Type": "multipart/form-data; boundary=---------------------------2046008840495448074105481842",
    }

    data = f'-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="messageText"\r\n\r\nguest{new_guest_username}@gmail.com\r\n-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="role"\r\n\r\n4\r\n-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="password"\r\n\r\npassword123\r\n-----------------------------2046008840495448074105481842\r\nContent-Disposition: form-data; name="name"\r\n\r\nTest Guest\r\n-----------------------------2046008840495448074105481842--\r\n'

    response = client.post("/api/upload/accountsEmails", headers=headers, data=data)

    assert response.status_code == 200

    os.environ["NEW_GUEST_USERNAME"] = new_guest_username


def test_delete_guest(client):
    jwt_token = os.environ.get("ADMIN_JWT_TOKEN")
    new_guest_id = get_new_guest(client)
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
    }

    response = client.delete(f"/api/account/4/{new_guest_id}", headers=headers)

    assert response.status_code == 200


def get_new_guest(client):
    new_guest_username = os.environ.get("NEW_GUEST_USERNAME")
    response = client.get("/api/accounts/4")

    for account in response.get_json()["result"]["accounts"]:
        if account["email"] == f"guest{new_guest_username}@gmail.com":
            return account["_id"]["$oid"]


def test_delete_guest_wrong_id(client):
    jwt_token = os.environ.get("ADMIN_JWT_TOKEN")
    new_guest_id = "6340e9b65d085cb4189jcow4"
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
    }

    response = client.delete(f"/api/account/4/{new_guest_id}", headers=headers)

    assert response.status_code == 422
