from flask import Blueprint, request
from api.models import (
    MentorProfile,
    MenteeProfile,
    PartnerProfile,
)
from api.core import create_response, logger
from api.utils.constants import Account

translation = Blueprint("translation", __name__)  # initialize blueprint


@translation.route("/", methods=["GET"])
def setup_language():
    all_users_types = [MentorProfile, MenteeProfile, PartnerProfile]
    for user_type in all_users_types:
        users = user_type.objects()
        for user in users:
            if user.preferred_language == None:
                user.preferred_language = "en-US"
                user.save()

    return create_response(message="Language setup complete")
