from flask import Blueprint, request
from api.core import create_response, logger
from api.models import Training, MentorProfile, MenteeProfile, PartnerProfile
from datetime import datetime
from api.utils.require_auth import admin_only
from datetime import datetime
from flask import send_file
from io import BytesIO
from api.utils.constants import Account, NEW_TRAINING_TEMPLATE
from api.utils.request_utils import send_email

training = Blueprint("training", __name__)  # initialize blueprint


@training.route("/<role>", methods=["GET"])
def get_trainings(role):
    # try:
    trainings = Training.objects(role=str(role))
    trainings = list(trainings)
    for train in trainings:
        train.id = train.id

    # except:
    #    msg = "trainings does not exist"
    #    logger.info(msg)
    #    return create_response(status=422, message=msg)

    return create_response(data={"trainings": trainings})


@training.route("/<string:id>", methods=["DELETE"])
@admin_only
def delete_train(id):
    try:
        train = Training.objects.get(id=id)
        train.delete()
    except:
        return create_response(status=422, message="training not found")

    return create_response(status=200, message="Successful deletion")


################################################################################
@training.route("/train/<string:id>", methods=["GET"])
# @admin_only
def get_train(id):
    try:
        train = Training.objects.get(id=id)
    except:
        return create_response(status=422, message="training not found")

    return create_response(status=200, data={"train": train})


##################################################################################
@training.route("/trainVideo/<string:id>", methods=["GET"])
def get_train_file(id):
    try:
        train = Training.objects.get(id=id)
    except:
        return create_response(status=422, message="training not found")
    file = train.filee.read()
    content_type = train.filee.content_type

    return send_file(
        BytesIO(file), download_name=train.filee.file_name, mimetype=content_type
    )


#############################################################################
@training.route("/<string:id>", methods=["PUT"])
@admin_only
def get_train_id_edit(id):
    isVideoo = request.form["isVideo"]
    if isVideoo == "true":
        isVideoo = True
    if isVideoo == "false":
        isVideoo = False
        logger.info(isVideoo)

    # try:
    train = Training.objects.get(id=id)
    train.name = request.form["name"]
    train.description = request.form["description"]
    train.role = str(request.form["role"])
    train.typee = request.form["typee"]
    train.isVideo = isVideoo
    if not isVideoo:
        filee = request.files["filee"]
        train.filee.replace(filee)
        train.file_name = filee.filename
    else:
        train.url = request.form["url"]

    train.save()

    # except:
    #   return create_response(status=422, message="training not found")

    return create_response(status=200, data={"train": train})


######################################################################
@training.route("/<role>", methods=["POST"])
@admin_only
def new_train(role):
    try:
        name = request.form["name"]
        description = request.form["description"]
        typee = request.form["typee"]
        isVideoo = request.form["isVideo"]
        if isVideoo == "true":
            isVideoo = True
        if isVideoo == "false":
            isVideoo = False

        train = Training(
            name=name,
            description=description,
            role=str(role),
            typee=typee,
            isVideo=isVideoo,
            date_submitted=datetime.now(),
        )
        if not isVideoo:
            filee = request.files["filee"]
            train.filee.put(filee, file_name=filee.filename)
            train.file_name = filee.filename
        else:
            train.url = request.form["url"]

        train.save()
        new_train_id = train.id
        if int(role) == Account.MENTOR:
            receivers = MentorProfile.objects.all()
        elif int(role) == Account.MENTEE:
            receivers = MenteeProfile.objects.all()
        else:
            receivers = PartnerProfile.objects.all()

        front_url = request.form["front_url"]
        target_url = front_url + "new_training/" + role + "/" + str(new_train_id)
        for receiver in receivers:
            res, res_msg = send_email(
                recipient=receiver.email,
                subject="New Training Data",
                data={"link": target_url},
                template_id=NEW_TRAINING_TEMPLATE,
            )
            if not res:
                msg = "Failed to send new traing data alert email " + res_msg
                logger.info(msg)

    except:
        return create_response(status=400, message="missing parameters")

    return create_response(status=200, data={"train": train})
