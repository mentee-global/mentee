from datetime import datetime
from api.core import create_response, logger
from flask import Blueprint
from api.models.DirectMessage import DirectMessage
from mongoengine.queryset.visitor import Q
from bson import ObjectId
from api.models import DirectMessage


notifications = Blueprint("notifications", __name__)


@notifications.route("/notifications/<id>", methods=["GET"])
def get_11_most_recent_unread_dms(id):
    try:
        notifications = DirectMessage.objects.get(
            Q(recipient_id=id) & Q(message_read=True)).limit(11)
    except:
        msg = "No mentee with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"notifications": notifications})


@notifications.route("/messagesGo", methods=["POST"])
def create_message():
    try:
        for x in range(11):
            message = DirectMessage(
                body="test",
                message_read=False,
                sender_id=ObjectId("507f191e810c19729de860ea"),
                recipient_id=ObjectId("507f291e810c19729de860ea"),
                created_at=datetime.utcnow,
            )
            message.save()
    except Exception as e:
        msg = "Invalid parameter provided or Failed to save message"
        logger.info(e)
        logger.info(datetime.utcnow)
        return create_response(status=422, message=msg)
    return create_response(
        status=201,
        message=f"Successfully saved messages",
    )
