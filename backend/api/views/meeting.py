from __future__ import print_function

import os.path, json
from datetime import datetime, timedelta
from flask import Blueprint
from api.core import create_response
import sys, os
import base64

from api.utils.jaas_jwt_builder import JaaSJwtBuilder
from api.utils.secure_env import SecureEnvironmentManager


meeting = Blueprint("meeting", __name__)


def get_eight_x_eight_config():
    """Get 8x8 configuration securely"""
    return {
        "api_key": SecureEnvironmentManager.get_optional_env("EIGHT_X_EIGHT_API_KEY"),
        "app_id": SecureEnvironmentManager.get_optional_env("EIGHT_X_EIGHT_APP_ID"),
        "private_key": SecureEnvironmentManager.get_optional_env(
            "EIGHT_X_EIGHT_ENCODED_PRIVATE_KEY"
        ),
    }


@meeting.route("/generateToken", methods=["GET"])
def generateToken():
    try:
        config = get_eight_x_eight_config()

        if not all([config["api_key"], config["app_id"], config["private_key"]]):
            return create_response(
                status=500, message="8x8 configuration not available"
            )

        private_key = base64.b64decode(config["private_key"])

        jaasJwt = JaaSJwtBuilder()
        token = (
            jaasJwt.withDefaults()
            .withApiKey(config["api_key"])
            .withUserName("User Name")
            .withUserEmail("email_address@email.com")
            .withModerator(False)
            .withAppID(config["app_id"])
            .withUserAvatar("https://asda.com/avatar")
            .signWith(private_key)
        )

        return create_response(
            data={"token": token.decode("utf-8"), "appID": config["app_id"]}
        )

    except Exception as error:
        print(error)
        return create_response(
            status=422, message=f"Failed to generate token for meeting"
        )
