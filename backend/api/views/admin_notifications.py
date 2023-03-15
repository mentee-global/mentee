from flask import Blueprint, request
from api.core import create_response
from api.models import Notifications
from datetime import datetime
from api.utils.require_auth import admin_only
from datetime import datetime

admin_notifications = Blueprint("admin_notifications", __name__)  # initialize blueprint


@admin_notifications.route("/", methods=["GET"])
def get_notifys():
    notifys = Notifications.objects.order_by("-date_submitted")

    return create_response(data={"notifys": notifys})


#############################################################################
@admin_notifications.route("/<id>", methods=["GET"])
@admin_only
def read_notify(id):
    try:
        notify = Notifications.objects.get(id=id)
        notify.readed = True
        notify.save()
    except:
        return create_response(status=422, message="notifys not found")

    return create_response(data={"notify": notify})


################################################################################
@admin_notifications.route("/newNotify", methods=["POST"])
@admin_only
def new_notify():
    try:
        message = request.form["message"]
        mentorId = request.form["mentorId"]
        readed = request.form["readed"]
        if readed == "false":
            readed = False
        else:
            readed = True
        notify = Notifications(
            message=message,
            mentorId=mentorId,
            readed=readed,
            date_submitted=datetime.now(),
        )
        notify.save()
    except:
        return create_response(status=401, message="missing parameters")

    return create_response(status=200, data={"notify": notify})
