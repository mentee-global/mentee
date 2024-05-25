from __future__ import print_function

import os.path, json
from datetime import datetime, timedelta
from flask import Blueprint
from api.core import create_response
import sys, os
import base64

from api.utils.jaas_jwt_builder import JaaSJwtBuilder


meeting = Blueprint("meeting", __name__)

API_KEY = os.environ.get("EIGHT_X_EIGHT_API_KEY")
APP_ID = os.environ.get("EIGHT_X_EIGHT_APP_ID")
ENCODED_PRIVATE_KEY = os.environ.get('EIGHT_X_EIGHT_ENCODED_PRIVATE_KEY')

@meeting.route("/generateToken", methods=["GET"])
def generateToken():
    try:
        print(ENCODED_PRIVATE_KEY)
        PRIVATE_KEY = base64.b64decode(ENCODED_PRIVATE_KEY)
        print(PRIVATE_KEY)
        jaasJwt = JaaSJwtBuilder()
        token = jaasJwt.withDefaults() \
            .withApiKey(API_KEY) \
                .withUserName("User Name") \
                    .withUserEmail("email_address@email.com") \
                        .withModerator(False) \
                            .withAppID(APP_ID) \
                                .withUserAvatar("https://asda.com/avatar") \
                                    .signWith(PRIVATE_KEY)

        return create_response(data={"token": token.decode('utf-8'), "appID": APP_ID})

    except Exception as error:
        print(error)
        return create_response(status=422, message=f'Failed to generate token for meeting')