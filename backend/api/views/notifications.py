from datetime import datetime
from api.core import create_response, logger
from flask import Blueprint
from backend.api.models.MenteeProfile import MenteeProfile, MentorProfile
from mongoengine.queryset.visitor import Q
from api.models import DirectMessage
from api.utils.request_utils import send_email
from api.utils.constants import WEEKLY_NOTIF_REMINDER

notifications = Blueprint("notifications", __name__)


@notifications.route("/notifications/<id>", methods=["GET"])
def get_unread_dm_count(id):
    try:
        notifications = DirectMessage.objects(
            Q(recipient_id=id) & Q(message_read=False)
        ).count()
    except Exception as e:
        msg = "No mentee with that id"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(data={"notifications": notifications})


@notifications.route("/weeklyemails", methods=["GET"])
def send_weekly_emails():

    try:
        mentee_users = MenteeProfile.objects()
        mentor_users = MentorProfile.objects()
    except Exception as e:
        msg = "error"
        logger.info(e)
        return create_response(status=422, message=msg)
    for user in mentee_users:
        try:
            notifications = DirectMessage.objects(
                Q(recipient_id=user._id) & Q(message_read=False)
            ).count()
        except Exception as e:
            msg = "No mentee with that id"
            logger.info(e)
            return create_response(status=422, message=msg)
        if notifications > 0:
            res, res_msg = send_email(
                recipient=user.email,
                template_id=WEEKLY_NOTIF_REMINDER,
                data={"number_unread": notifications},
            )
            if not res:
                msg = "Failed to send mentee email " + res_msg
                logger.info(msg)

    for user in mentor_users:
        try:
            notifications = DirectMessage.objects(
                Q(recipient_id=user._id) & Q(message_read=False)
            ).count()
        except Exception as e:
            msg = "No mentor with that id"
            logger.info(e)
            return create_response(status=422, message=msg)
        if notifications > 0:
            res, res_msg = send_email(
                recipient=user.email,
                template_id=WEEKLY_NOTIF_REMINDER,
                data={"number_unread": notifications},
            )
            if not res:
                msg = "Failed to send mentee email " + res_msg
                logger.info(msg)
