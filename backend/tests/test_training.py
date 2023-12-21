import os


def test_create_training(client):
    jwt_token = os.environ["ADMIN_JWT_TOKEN"]

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
        "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryTjw6gipon7AM6gNi",
    }

    data = '------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="front_url"\r\n\r\nhttps://mentee-dev.herokuapp.com/\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="name"\r\n\r\nTestName\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="typee"\r\n\r\nVIDEO\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="url"\r\n\r\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="description"\r\n\r\nTesting\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="role"\r\n\r\n1\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="document"\r\n\r\nundefined\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="isNewDocument"\r\n\r\nfalse\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="isVideo"\r\n\r\ntrue\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi--\r\n'

    response = client.post("/api/training/1", headers=headers, data=data)

    assert response.status_code == 200


def test_training(client):
    response_all = client.get("/api/training/1")
    assert response_all.status_code == 200

    training_id = response.get_json()["result"]["trainings"]["_id"]["$oid"]
    response = client.get(f"/api/training/train/{training_id}")

    assert response.status_code == 200

    for training in response_all.get_json()["result"]["trainings"]:
        if training["name"] == "TestName":
            new_training_id = training["_id"]["$oid"]

            client.get(f"/api/training/trainVideo/{new_training_id}")

            response = client.get(f"/api/training/translate/{new_training_id}")
            assert response.status_code == 200

            response = client.delete(f"/api/training/{new_training_id}")
            assert response.status_code == 200
