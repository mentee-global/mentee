from flask import Blueprint, request
from api.core import create_response, logger
from api.models import Training
from datetime import datetime
from api.utils.require_auth import admin_only, all_users
from datetime import datetime
from flask import send_file
from io import BytesIO

training = Blueprint("training", __name__)  # initialize blueprint


@training.route("/<role>", methods=["GET"])
@all_users
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
@admin_only
def get_train(id):
    try:
        train = Training.objects.get(id=id)
    except:
        return create_response(status=422, message="training not found")

    return create_response(status=200, data={"train": train})


##################################################################################
@training.route("/trainVideo/<string:id>", methods=["GET"])
@all_users
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
    # try:
    name = request.form["name"]
    url = request.form["url"]
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
    # except:
    #    return create_response(status=401, message="missing parameters")

    return create_response(status=200, data={"train": train})
