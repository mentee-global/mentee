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
        mentor_id = request.args.get("mentor_id")
        mentee_id = request.args.get("mentee_id")
    except:
        msg = "invalid parameters provided"
        logger.info(msg)
        return create_response(status=422, message=msg)
    try:
        mentee = MenteeProfile.objects.get(id=mentee_id)
        fav_mentor = MentorProfile.objects.get(id=mentor_id)
        if fav_mentor in mentee.favorite_mentors:
            mentee.favorite_mentors.remove(fav_mentor)
            msg = f"Deleted mentor: {fav_mentor.name} from mentee: {mentee.name} favorite list"
        else:
            mentee.favorite_mentors.append(fav_mentor)
            msg = f"Added mentor: {fav_mentor.name} to mentee: {mentee.name} favorite list"
        mentee.save()
    except:
        msg = "Failed to saved mentor as favorite"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(status=200, message=msg)
