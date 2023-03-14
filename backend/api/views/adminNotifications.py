from flask import Blueprint, request, jsonify
from api.core import create_response, logger
from api.models import Notifications
from datetime import datetime
from api.utils.require_auth import admin_only
from datetime import datetime
from flask import send_file
from io import BytesIO

Notificationss = Blueprint("Notificationss", __name__)  # initialize blueprint


@Notificationss.route("/", methods=["GET"])
def get_notifys():
    # try:
    notifys = Notifications.objects.order_by("-date_submitted")

    # except:
    #    msg = "notifys does not exist"
    #    logger.info(msg)
    #    return create_response(status=422, message=msg)

    return create_response(data={"notifys": notifys})


#############################################################################
@Notificationss.route("/<id>", methods=["GET"])
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
@Notificationss.route("/newNotify", methods=["POST"])
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
