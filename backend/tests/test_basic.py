from api.models import db
import requests
from dotenv import load_dotenv
import os

load_dotenv()


# client passed from client - look into pytest for more info about fixtures
# test client api: http://flask.pocoo.org/docs/1.0/api/#test-client
def test_index(client):
    rs = client.get("/api/translation/")
    assert (
        rs.status_code == 200
    ), f"Basic Test Failed. Server not running properly. {rs.text}"
