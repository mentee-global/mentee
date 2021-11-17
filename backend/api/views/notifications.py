from datetime import datetime
from api.core import create_response, logger
from flask import Blueprint
from mongoengine.queryset.visitor import Q
from api.models import DirectMessage


notifications = Blueprint("notifications", __name__)


@notifications.route("/notifications/<id>", methods=["GET"])
def get_11_most_recent_unread_dms(id):
    try:
        notifications = DirectMessage.objects(
            Q(recipient_id=id) & Q(message_read=False)).count()
    except Exception as e:
        msg = "No mentee with that id"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(data={"notifications": notifications})
