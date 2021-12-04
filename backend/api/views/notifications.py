from datetime import datetime
from api.core import create_response, logger
from flask import Blueprint
from api.models.MenteeProfile import MenteeProfile, MentorProfile
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


@notifications.route("/notifications/<id>", methods=["PUT"])
def update_unread_count(recipient, sender):
    try:
        messages = DirectMessage.objects(
            Q(recipient_id=recipient) & Q(
                message_read=False) & Q(sender_id=sender)
        )
    except Exception as e:
        msg = "failed"
        logger.info(e)
        return create_response(status=422, message=msg)
    messages.update({'$set': {'read': True}})
    messages.save()
    return create_response(status=200, message="Success")


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
            notifications_count = DirectMessage.objects(
                Q(recipient_id=user.id) & Q(message_read=False)
            ).count()
        except Exception as e:
            msg = "No mentee with that id"
            logger.info(e)
            return create_response(status=422, message=msg)
        if notifications_count > 0:
            res, res_msg = send_email(
                recipient=user.email,
                data={"number_unread": str(notifications_count)},
                template_id=WEEKLY_NOTIF_REMINDER,
            )
            if not res:
                msg = "Failed to send mentee email " + res_msg
                logger.info(msg)

    for user in mentor_users:

        try:
            notifications_count = DirectMessage.objects(
                Q(recipient_id=user.id) & Q(message_read=False)
            ).count()
        except Exception as e:
            msg = "No mentor with that id"
            logger.info(e)
            return create_response(status=422, message=msg)
        if notifications_count > 0:
            res, res_msg = send_email(
                recipient=user.email,
                template_id=WEEKLY_NOTIF_REMINDER,
                data={"number_unread": str(notifications_count)},
            )
            if not res:
                msg = "Failed to send mentee email " + res_msg
                logger.info(msg)
    return create_response(message="Successfully sent weekly notification emails")
