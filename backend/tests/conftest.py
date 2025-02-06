# conftest.py is used by pytest to share fixtures
# https://docs.pytest.org/en/latest/fixture.html#conftest-py-sharing-fixture-functions
import os
import tempfile
import time
from unittest import mock
import pytest
from flask_migrate import Migrate

from api import create_app


@pytest.fixture(scope="session")
def client():
    app = create_app()
    app.app_context().push()

    time.sleep(2)
    from api.models import db

    client = app.test_client()
    yield client
