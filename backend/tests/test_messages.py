import os, requests
from dotenv import load_dotenv

load_dotenv()


def test_mentee_messages(client):
    mentee_jwt_token = os.environ.get("MENTEE_JWT_TOKEN")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": mentee_jwt_token,
    }

    BASE_URL = os.environ.get("BASE_URL")

    mentor_profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")
    mentee_profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")

    params = {
        "recipient_id": mentee_profile_id,
        "sender_id": mentor_profile_id,
    }

    response = client.get(
        f"{BASE_URL}/api/messages/direct/", query_string=params, headers=headers
    )

    assert response.status_code == 200
    assert "message" in response.get_json()
    assert response.get_json()["message"] == "Success"

    assert "Messages" in response.get_json()["result"]

    for message in response.get_json()["result"]["Messages"]:
        assert "body" in message
        assert "message_read" in message

        assert (
            message["recipient_id"]["$oid"] == mentee_profile_id
            or message["recipient_id"]["$oid"] == mentor_profile_id
        )
        assert (
            message["sender_id"]["$oid"] == mentor_profile_id
            or message["sender_id"]["$oid"] == mentee_profile_id
        )


def test_mentor_messages(client):
    mentor_jwt_token = os.environ.get("MENTOR_JWT_TOKEN")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": mentor_jwt_token,
    }

    mentor_profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")
    mentee_profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")

    params = {
        "recipient_id": mentor_profile_id,
        "sender_id": mentee_profile_id,
    }

    response = client.get(
        f"/api/messages/direct/", query_string=params, headers=headers
    )

    assert response.status_code == 200
    assert "message" in response.get_json()
    assert response.get_json()["message"] == "Success"

    assert "Messages" in response.get_json()["result"]

    for message in response.get_json()["result"]["Messages"]:
        assert "body" in message
        assert "message_read" in message

        assert (
            message["recipient_id"]["$oid"] == mentor_profile_id
            or message["recipient_id"]["$oid"] == mentee_profile_id
        )
        assert (
            message["sender_id"]["$oid"] == mentee_profile_id
            or message["sender_id"]["$oid"] == mentor_profile_id
        )


def test_message_send(client):
    mentor_jwt_token = os.environ.get("MENTOR_JWT_TOKEN")

    mentor_email = os.environ.get("TEST_MENTOR_EMAIL")
    mentor_profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")
    mentor_name = os.environ.get("TEST_MENTOR_NAME")
    recipient_name = os.environ.get("TEST_RECIPIENT_NAME")
    recipient_id = os.environ.get("TEST_RECIPIENT_ID")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Authorization": mentor_jwt_token,
    }

    json_data = {
        "message": "Hi",
        "user_name": mentor_name,
        "user_id": mentor_profile_id,
        "recipient_name": recipient_name,
        "recipient_id": recipient_id,
        "email": mentor_email,
        "link": "http://www.google.com",
        "time": "2023-12-20, 14:17:15+0500",
    }

    response = client.post("/api/messages/", headers=headers, json=json_data)


def test_messages(client):
    mentor_jwt_token = os.environ.get("MENTOR_JWT_TOKEN")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": mentor_jwt_token,
    }

    response = client.get(f"/api/messages/", headers=headers)

    assert response.status_code == 200


def test_delete_messages(client):
    mentor_jwt_token = os.environ.get("MENTOR_JWT_TOKEN")

    recipient_id = os.environ.get("TEST_RECIPIENT_ID")
    sender_id= os.environ.get("TEST_MENTOR_PROFILE_ID")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": mentor_jwt_token,
    }

    response = client.get(f"/api/messages/direct/?recipient_id={recipient_id}&sender_id={sender_id}", headers=headers)

    first_message_id = response.get_json()["result"]["Messages"][0]["_id"]["$oid"]

    response = client.delete(f"/api/messages/{first_message_id}", headers=headers)
    assert response.status_code == 200

    response = client.delete(f"/api/messages/5y7949ho0rwejiof", headers=headers)
    assert response.status_code != 200


def test_notifications(client):
    mentor_profile_id = os.environ.get("TEST_MENTEE_PROFILE_ID")

    mentor_jwt_token = os.environ.get("MENTOR_JWT_TOKEN")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": mentor_jwt_token,
    }

    response = client.get(f"/api/notifications/{mentor_profile_id}", headers=headers)
    assert response.status_code == 200

    response = client.get(f"/api/notifications/895uterj4u89rjo")
    assert response.status_code != 200


def test_new_notification(client):
    user_id = os.environ.get("TEST_RECIPIENT_ID")

    response = client.get(f"/api/notifications/unread_alert/{user_id}")
    assert response.status_code == 200

    response = client.get(f"/api/notifications/unread_alert/589tufjkerwoi")
    assert response.status_code != 200
