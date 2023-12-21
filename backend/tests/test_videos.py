import requests
from dotenv import load_dotenv
import os

load_dotenv()


def test_create_video(client):
    profile_id = os.environ.get("MENTOR_PROFILE_ID")

    jwt_token = os.environ["MENTOR_JWT_TOKEN"]
    profile_id = os.environ.get("TEST_MENTOR_PROFILE_ID")

    headers = {
        "Authorization": jwt_token,
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
    }

    params = {
        "account_type": "1",
    }

    json_data = {
        "videos": [
            {
                "date_uploaded": "2023-12-06T09:48:26+05:00",
                "tag": "Introduction",
                "title": "Introduction",
                "url": "https://www.youtube.com/watch?v=t5BHAgmOdnE",
                "key": 0,
            },
            {
                "date_uploaded": "2023-12-06T09:48:26+05:00",
                "tag": "Legal Issues, Business",
                "title": "Test Video",
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "key": 1,
            },
        ],
    }

    response = client.put(
        f"/api/account/{profile_id}",
        query_string=params,
        headers=headers,
        json=json_data,
    )

    assert response.status_code == 200
    videos = get_videos(profile_id, client)

    assert any(
        video["title"] == "Test Video" for video in videos
    ), "Test video not created"

    delete_video(profile_id, headers, params, client)


def get_videos(profile_id, client):
    response = client.get(
        f"/api/account/{profile_id}?account_type={os.environ.get('TEST_MENTOR_ROLE')}"
    )

    return response.get_json()["result"]["account"]["videos"]


def delete_video(profile_id, headers, params, client):
    json_data = {
        "videos": [
            {
                "date_uploaded": "2023-12-06T09:48:26+05:00",
                "tag": "Introduction",
                "title": "Introduction",
                "url": "https://www.youtube.com/watch?v=t5BHAgmOdnE",
                "key": 0,
            },
        ],
    }

    response = client.put(
        f"/api/account/{profile_id}",
        query_string=params,
        headers=headers,
        json=json_data,
    )

    assert response.status_code == 200
