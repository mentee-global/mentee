from flask import Blueprint, request, jsonify
from api.core import create_response, logger
from api.models import Training
from datetime import datetime
from api.utils.require_auth import admin_only
from datetime import datetime


training = Blueprint("training", __name__)  # initialize blueprint


@training.route("/<role>", methods=["GET"])
def get_trainings(role):
    #try:
    trainings = Training.objects(role=str(role))
    trainings=list(trainings)
    for train in trainings:
        train.id=train.id

    #except:
    #    msg = "trainings does not exist"
    #    logger.info(msg)
    #    return create_response(status=422, message=msg)

    return create_response(data={"trainings": trainings})

@training.route("/<string:id>", methods=["DELETE"])
@admin_only
def delete_train(id):

    try:
        train=Training.objects.get(id=id)
        train.delete()
    except:    
        return create_response(status=422, message="training not found")

    return create_response(status=200, message="Successful deletion")
#############################################################################333
@training.route("/train/<string:id>", methods=["GET"])
@admin_only
def get_train(id):

    try:
        train=Training.objects.get(id=id)
    except:    
        return create_response(status=422, message="training not found")

    return create_response(status=200, data={'train':train})
##################################################################################    
@training.route("/<string:id>", methods=["PUT"])
@admin_only
def get_train_id_edit(id):
    data = request.get_json()

    #try:
    train=Training.objects.get(id=id)
    train.name=data.get('name',train.name)
    train.url=data.get('url',train.url)
    train.description=data.get('description',train.description)
    train.role=str(data.get('role',train.role))
    train.save()
    #except:    
     #   return create_response(status=422, message="training not found")

    return create_response(status=200, data={'train':train})

######################################################################
@training.route("/<role>", methods=["POST"])
@admin_only
def new_train(role):

    #try:
        name=request.get_json().get('name')
        url=request.get_json().get('url')
        description=request.get_json().get('description')
        train=Training(
            name=name,
            url=url,
            description=description,
            role=str(role),
            date_submitted=datetime.now()
        )
        train.save()
    #except:    
    #    return create_response(status=401, message="missing parameters")

        return create_response(status=200, data={'train':train})
