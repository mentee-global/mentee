from __future__ import print_function

import os.path, json
from datetime import datetime, timedelta
from flask import Blueprint
from api.core import create_response
import sys, os

from api.utils.jaas_jwt_builder import JaaSJwtBuilder


meeting = Blueprint("meeting", __name__)

API_KEY = os.environ.get("EIGHT_X_EIGHT_API_KEY")
APP_ID = os.environ.get("EIGHT_X_EIGHT_APP_ID")

@meeting.route("/generateToken", methods=["GET"])
def generateToken():
    try:
        scriptDir = os.path.dirname('/')
        fp = os.path.join(scriptDir, 'rsa-private.pem')

        with open(fp, 'r') as reader:
            PRIVATE_KEY =  reader.read()
            jaasJwt = JaaSJwtBuilder()
            token = jaasJwt.withDefaults() \
                .withApiKey(API_KEY) \
                    .withUserName("Zeeshan") \
                        .withUserEmail("m.zeeshanasghar101@gmail.com") \
                            .withModerator(True) \
                                .withAppID(APP_ID) \
                                    .withUserAvatar("https://asda.com/avatar") \
                                        .signWith(PRIVATE_KEY)

        print("HERE")
        return create_response(data={"token": token.decode('utf-8'), "appID": APP_ID})

    except Exception as error:
        print(error)
        return create_response(status=422, message=f'Failed to generate token for meeting')