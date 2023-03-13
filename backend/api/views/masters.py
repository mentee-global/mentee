from datetime import datetime

from flask.globals import request
from api.core import create_response, logger
from flask import Blueprint
from api.models import Languages, Specializations
from api.utils.require_auth import admin_only

masters = Blueprint("masters", __name__)

@masters.route("/languages", methods=["GET"])
def getLanguages():
    try:
        languages = Languages.objects.all().order_by('name')
    except Exception as e:
        msg = "Get Languages error"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(data={"result": languages})

@masters.route("/languages/<string:id>", methods=["GET"])
# @admin_only
def get_language(id):

    try:
        record=Languages.objects.get(id=id)
    except:    
        return create_response(status=422, message="Languages not found")

    return create_response(status=200, data={'result':record})

@masters.route("/languages/<string:id>", methods=["DELETE"])
# @admin_only
def delete_language(id):

    try:
        language=Languages.objects.get(id=id)
        language.delete()
    except:    
        return create_response(status=422, message="language not found")

    return create_response(status=200, message="Successful deletion")

@masters.route("/languages/<string:id>", methods=["PUT"])
# @admin_only
def edit_language_by_id(id):
    #try:
    record=Languages.objects.get(id=id)
    record.name=request.form['name']
    record.updated_at = datetime.now()
    record.save()
    #except:    
    #   return create_response(status=422, message="training not found")

    return create_response(status=200, data={'result':record})

######################################################################
@masters.route("/languages", methods=["POST"])
# @admin_only
def new_language():

    #try:
        name=request.form['name']
       
        record=Languages(
            name=name,
            updated_at=datetime.now()
        )

        record.save()
    #except:    
    #    return create_response(status=401, message="missing parameters")

        return create_response(status=200, data={'result':record})

@masters.route("/specializations", methods=["GET"])
def getSpecializations():
    try:
        specializations = Specializations.objects.all().order_by('name')
    except Exception as e:
        msg = "Get Specializations error"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(data={"result": specializations})

@masters.route("/specializations/<string:id>", methods=["GET"])
# @admin_only
def get_specialization(id):

    try:
        record=Specializations.objects.get(id=id)
    except:    
        return create_response(status=422, message="Specializations not found")

    return create_response(status=200, data={'result':record})

@masters.route("specializations/<string:id>", methods=["DELETE"])
# @admin_only
def delete_specializations(id):

    try:
        specializations=Specializations.objects.get(id=id)
        specializations.delete()
    except:    
        return create_response(status=422, message="language not found")

    return create_response(status=200, message="Successful deletion")

@masters.route("/specializations/<string:id>", methods=["PUT"])
# @admin_only
def edit_specialization_by_id(id):
    #try:
    record=Specializations.objects.get(id=id)
    record.name=request.form['name']
    record.updated_at = datetime.now()

    record.save()
    #except:    
    #   return create_response(status=422, message="training not found")

    return create_response(status=200, data={'result':record})

######################################################################
@masters.route("/specializations", methods=["POST"])
# @admin_only
def new_specailization():

    #try:
        name=request.form['name']
        record=Specializations(
            name=name,
            updated_at=datetime.now()
        )

        record.save()
    #except:    
    #    return create_response(status=401, message="missing parameters")

        return create_response(status=200, data={'result':record})