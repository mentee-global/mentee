from datetime import datetime

from flask.globals import request
from api.core import create_response, logger
from flask import Blueprint
from api.models.MenteeProfile import MenteeProfile, MentorProfile
from mongoengine.queryset.visitor import Q
from api.models import DirectMessage, PartnerProfile
from api.utils.request_utils import send_email, send_sms
from api.utils.constants import WEEKLY_NOTIF_REMINDER, UNREAD_MESSAGE_TEMPLATE

notifications = Blueprint("notifications", __name__)


@notifications.route("/<id>", methods=["GET"])
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

@notifications.route("/unread_alert/<id>", methods=["GET"])
def send_unread_alert(id):
    try:
        notifications_count = DirectMessage.objects(
            Q(recipient_id=id) & Q(message_read=False)
        ).count()
        email = None
        phone_number = None
        if notifications_count > 0:
            user_record = MenteeProfile.objects(Q(id=id)).first()
            if user_record is not None:
                email = user_record.email
                if 'phone_number' in user_record:
                    phone_number = user_record.phone_number
            else:
                user_record = MentorProfile.objects(Q(id=id)).first()
                if user_record is not None:
                    email = user_record.email
                    if 'phone_number' in user_record:
                        phone_number = user_record.phone_number
                else:
                    user_record = PartnerProfile.objects(Q(id=id)).first()
                    if user_record is not None:
                        email = user_record.email
                        if 'phone_number' in user_record:
                            phone_number = user_record.phone_number
            if user_record is not None:
                if email is not None and user_record.email_notifications:
                    res, res_msg = send_email(
                        recipient=email,
                        data={"number_unread": str(notifications_count)},
                        template_id=UNREAD_MESSAGE_TEMPLATE,
                    )
                    if not res:
                        msg = "Failed to send unread message alert email " + res_msg
                        logger.info(msg)
                
                if phone_number is not None and user_record.text_notifications:
                    res, res_msg = send_sms(
                        text="You have received a new message on your Mentee Portal!\nYou have " + str(notifications_count) + " messages on your Mentee! messages inbox",
                        recipient=phone_number,
                    )
                    if not res:
                        msg = "Failed to send unread message alert email " + res_msg
                        logger.info(msg)

    except Exception as e:
        msg = "No mentee with that id"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(status=200, message="Success")

@notifications.route("/update", methods=["PUT"])
def update_unread_count():
    data = request.get_json()
    if not data:
        return create_response(status=422, message="Missing data from PUT request")

    recipient = data.get("recipient", None)
    sender = data.get("sender", None)
    if not recipient or not sender:
        return create_response(status=422, message="Missing IDs for recipient/sender")

    try:
        messages = DirectMessage.objects(
            Q(recipient_id=recipient) & Q(message_read=False) & Q(sender_id=sender)
        )
    except Exception as e:
        msg = "Mongoengine: failed to fetch message objects"
        logger.info(e)
        return create_response(status=422, message=msg)
    messages.update(set__message_read=True)
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
