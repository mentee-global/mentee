from api.core import create_response, logger
from backend.api.models.DirectMessage import DirectMessage
from mongoengine.queryset.visitor import Q
from api.models import (
    DirectMessage
)

@main.route("/account/<id>/private", methods=["GET"])
def get_11_most_recent_unread_dms(id):
    try:
        messages = DirectMessage.objects.get(Q(recipient_id=id) & Q(message_read=True)).limit(11)
    except:
        msg = "No mentee with that id"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(data={"messages" : messages})