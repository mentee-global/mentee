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

    assert "success" in response.get_json(), f"Failed to create new training. {response.text}"


def test_edit_training(client):
    jwt_token = os.environ.get("ADMIN_JWT_TOKEN")

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": jwt_token,
        "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryTjw6gipon7AM6gNi",
    }

    data = '------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="front_url"\r\n\r\nhttps://mentee-dev.herokuapp.com/\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="name"\r\n\r\nTestNameNew\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="typee"\r\n\r\nVIDEO\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="url"\r\n\r\nhttps://www.youtube.com/watch?v=dQw4w9WgXcW\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="description"\r\n\r\nTestingNew\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="role"\r\n\r\n1\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="document"\r\n\r\nundefined\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="isNewDocument"\r\n\r\nfalse\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi\r\nContent-Disposition: form-data; name="isVideo"\r\n\r\ntrue\r\n------WebKitFormBoundaryTjw6gipon7AM6gNi--\r\n'

    response_all = client.get("/api/training/1")
    assert response_all.status_code == 200

    for training in response_all.get_json()["result"]["trainings"]:
        if training["name"] == "TestName":
            new_training_id = training["_id"]["$oid"]

            response = client.put(
                f"/api/training/{new_training_id}", headers=headers, data=data
            )
            assert response.status_code == 200, f"Failed to edit training. {response.text}"


def test_training(client):
    jwt_token = os.environ.get("ADMIN_JWT_TOKEN")

    headers = {"Authorization": jwt_token}

    response_all = client.get("/api/training/1")
    assert response_all.status_code == 200, f"Failed to get trainings. {response.text}"

    training_id = response_all.get_json()["result"]["trainings"][0]["_id"]["$oid"]
    response = client.get(f"/api/training/train/{training_id}")

    assert response.status_code == 200, f"Failed to get single training data. {response.text}"

    for training in response_all.get_json()["result"]["trainings"]:
        if training["name"] == "TestNameNew":
            new_training_id = training["_id"]["$oid"]

            client.get(f"/api/training/trainVideo/{new_training_id}")

            response = client.delete(
                f"/api/training/{new_training_id}", headers=headers
            )
            assert response.status_code == 200, f"Failed to delete training. {response.text}"


def test_training_translate(client):
    jwt_token = os.environ.get("ADMIN_JWT_TOKEN")

    headers = {"Authorization": jwt_token}

    response_all = client.get("/api/training/1")
    assert response_all.status_code == 200, f"Failed to get all trainings. {response.text}"

    for training in response_all.get_json()["result"]["trainings"]:
        if training["name"] == "Mentor Training Manual":
            new_training_id = training["_id"]["$oid"]

            response = client.put(
                f"/api/training/translate/{new_training_id}", headers=headers
            )
            assert response.status_code == 200, f"Failed to translate training. {response.text}"


def test_edit_training_new(client):
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Authorization": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjAzMmNjMWNiMjg5ZGQ0NjI2YTQzNWQ3Mjk4OWFlNDMyMTJkZWZlNzgiLCJ0eXAiOiJKV1QifQ.eyJyb2xlIjowLCJwcm9maWxlSWQiOiI2MDc2NWU5Mjg5ODk5YWVlZTUxYThiMjciLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbWVudGVlLWQwMzA0IiwiYXVkIjoibWVudGVlLWQwMzA0IiwiYXV0aF90aW1lIjoxNzAzMTUwODY2LCJ1c2VyX2lkIjoieHNXNDF6OUhjNlk5cjZUZTBKQWNYaGxZbmVBMiIsInN1YiI6InhzVzQxejlIYzZZOXI2VGUwSkFjWGhsWW5lQTIiLCJpYXQiOjE3MDMxNTA4NjgsImV4cCI6MTcwMzE1NDQ2OCwiZW1haWwiOiJrbGhlc3RlcjNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsia2xoZXN0ZXIzQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6ImN1c3RvbSJ9fQ.RjkyT7V1AXgW449RUObaZn55etf-AVzVxd4_2Re9dLU5C64bH1NtDGf2hdEgfj40M9yB-ex9moA01410cODTSpU3f4oUkraW7QaBLv0X-fAV3N4qd91qFU9_bHIgB5bdp6LslZ6DbJwymYOpWbbblvypurX7pOVyYdOPC9dZZ5XVW7mXkVrAdhczP4wE6hafj7p5p9YqXflHG3vbLU_j3ZbR3NW39ub-Q2AGUqr3i3NMkFamcK2wvpz8MtZtPO5YuQy47jt_Wvg3w7AcDqp8GVsEz0E1XP_FRMW_0aD7ywxMRqODoXV6k85L-nLGMAwY2YULWFjp5rdJJouEPCFUZw",
        "Content-Type": "multipart/form-data; boundary=---------------------------10488160263684538269634372256",
    }

    data = '-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="name"\r\n\r\nTestNameNew\r\n-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="typee"\r\n\r\nVIDEO\r\n-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="url"\r\n\r\nhttps://www.youtube.com/watch?v=dQw4w9WgXcW\r\n-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="description"\r\n\r\nTestingNew\r\n-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="role"\r\n\r\n1\r\n-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="document"\r\n\r\nundefined\r\n-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="isNewDocument"\r\n\r\nfalse\r\n-----------------------------10488160263684538269634372256\r\nContent-Disposition: form-data; name="isVideo"\r\n\r\ntrue\r\n-----------------------------10488160263684538269634372256--\r\n'

    response = client.put(
        "/api/training/6584030f253f9db5ef3af0c3", headers=headers, data=data
    )
