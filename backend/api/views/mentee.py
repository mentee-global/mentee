from api.core import create_response, logger
from api.models import MentorProfile, Users, MenteeProfile
from flask import Blueprint
from api.utils.require_auth import admin_only
from firebase_admin import auth as firebase_admin_auth
from api.utils.constants import Account

mentee = Blueprint("mentee", __name__)

@mentee.route("/mentee/addFavMentor/", methods=["PUT"])
