import configparser
import logging
from typing import Tuple, List

from werkzeug.local import LocalProxy
from flask import current_app, jsonify
from flask.wrappers import Response

logger = LocalProxy(lambda: current_app.logger)
core_logger = logging.getLogger("core")


class Mixin:
    def to_dict(self) -> dict:
        d_out = dict((key, val) for key, val in self.__dict__.items())
        d_out.pop("_sa_instance_state", None)
        d_out["_id"] = d_out.pop("id", None)
        return d_out


def create_response(
    data: dict = None, status: int = 200, message: str = ""
) -> Tuple[Response, int]:
    if type(data) is not dict and data is not None:
        raise TypeError("Data should be a dictionary 😞")

    response = {"success": 200 <= status < 300, "message": message, "result": data}
    return jsonify(response), status


def serialize_list(items: List) -> List:
    if not items or items is None:
        return []
    return [x.to_dict() for x in items]


def all_exception_handler(error: Exception) -> Tuple[Response, int]:
    return create_response(message=str(error), status=500)


def get_pg_url(file: str = "creds.ini") -> str:
    try:
        config = configparser.ConfigParser()
        config.read(file)

        mongo_section = config["pg_creds"]
        return mongo_section["pg_url"]
    except KeyError:
        print(
            f"Failed to retrieve postgres url. Check if {file} exists in the top directory and whether it follows the correct format. INGORE this message if you are not using {file} to store your credentials."
        )
        return None
