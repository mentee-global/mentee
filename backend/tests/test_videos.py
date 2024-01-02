import requests
from dotenv import load_dotenv
import os
import json

dir_path = os.path.dirname(os.path.realpath(__file__))

consts_path = os.path.join(dir_path, 'utils/consts.json')

load_dotenv()
with open(consts_path, 'r') as f:
    constants = json.load(f)


def test_create_video(client):
    profile_id = constants["TEST_MENTOR_PROFILE_ID"]

    jwt_token = os.environ["MENTOR_JWT_TOKEN"]

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

    assert response.status_code == 200, f"Failed to create video. {response.text}"
    videos = get_videos(profile_id, client)

    assert any(
        video["title"] == "Test Video" for video in videos
    ), f"Test video not created. {response.text}"

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

    assert response.status_code == 200, f"Failed to delete video. {response.text}"
