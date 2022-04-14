from flask import Blueprint, request, jsonify
from api.core import create_response, logger
from api.models import Training
from datetime import datetime

training = Blueprint("training", __name__)  # initialize blueprint


@training.route("/", methods=["GET"])
def get_trainings():
    #try:
    trainings = Training.objects
    #except:
    #    msg = "trainings does not exist"
    #    logger.info(msg)
    #    return create_response(status=422, message=msg)

    return create_response(data={"trainings": trainings})
