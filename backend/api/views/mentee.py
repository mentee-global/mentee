from api.core import create_response, logger
from api.models import MentorProfile, Users, MenteeProfile
from flask import Blueprint, request
from api.utils.require_auth import admin_only
from firebase_admin import auth as firebase_admin_auth
from api.utils.constants import Account

mentee = Blueprint("mentee", __name__)


@mentee.route("/addFavMentor", methods=["PUT"])
def add_fav_mentor():
    try:
        data = request.get_json()
        mentor_uid = data["mentor_uid"]
        mentee_uid = data["mentee_uid"]
    except:
        msg = "invalid parameters provided"
        logger.info(msg)
        return create_response(status=422, message=msg)
    print()
    try:
        mentee = MenteeProfile.objects.get(firebase_uid=mentee_uid)
        if mentor_uid in mentee.favorite_mentors_uids:
            mentee.favorite_mentors_uids.remove(mentor_uid)
            msg = (
                f"Deleted mentor: {mentor_uid} from mentee: {mentee.name} favorite list"
            )
        else:
            mentee.favorite_mentors_uids.append(mentor_uid)
            msg = f"Added mentor: {mentor_uid} to mentee: {mentee.name} favorite list"
        mentee.save()
    except:
        msg = "Failed to saved mentor as favorite"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(status=200, message=msg)
