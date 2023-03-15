from datetime import datetime

from flask.globals import request
from api.core import create_response, logger
from flask import Blueprint
from api.models import (
    Languages,
    Specializations,
    MentorProfile,
    MenteeProfile,
    MentorApplication,
    MenteeApplication,
    NewMentorApplication,
)
from api.utils.require_auth import admin_only
from pymongo import collation

masters = Blueprint("masters", __name__)


@masters.route("/languages", methods=["GET"])
def getLanguages():
    try:
        languages = Languages.objects.order_by("name").collation(
            collation.Collation("en", strength=2)
        )
    except Exception as e:
        msg = "Get Languages error"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(data={"result": languages})


@masters.route("/languages/<string:id>", methods=["GET"])
@admin_only
def get_language(id):
    try:
        record = Languages.objects.get(id=id)
    except:
        return create_response(status=422, message="Languages not found")

    return create_response(status=200, data={"result": record})


@masters.route("/languages/<string:id>", methods=["DELETE"])
@admin_only
def delete_language(id):
    try:
        language = Languages.objects.get(id=id)
        # lang_name = language.name
        # mentors = MentorProfile.objects(languages__in=[lang_name])
        # for mentor in mentors:
        #     new_langs = mentor.languages
        #     new_langs.remove(lang_name)
        #     mentor.languages = new_langs
        #     mentor.save()
        # mentees = MenteeProfile.objects(languages__in=[lang_name])
        # for mentee in mentees:
        #     new_langs = mentee.languages
        #     new_langs.remove(lang_name)
        #     mentee.languages = new_langs
        #     mentee.save()
        language.delete()
    except:
        return create_response(status=422, message="language not found")

    return create_response(status=200, message="Successful deletion")


@masters.route("/languages/<string:id>", methods=["PUT"])
@admin_only
def edit_language_by_id(id):
    # try:
    record = Languages.objects.get(id=id)
    lang_name = record.name
    mentors = MentorProfile.objects(languages__in=[lang_name])
    for mentor in mentors:
        new_langs = mentor.languages
        new_langs = list(
            map(lambda x: x.replace(lang_name, request.form["name"]), new_langs)
        )
        mentor.languages = new_langs
        mentor.save()
    mentees = MenteeProfile.objects(languages__in=[lang_name])
    for mentee in mentees:
        new_langs = mentee.languages
        new_langs = list(
            map(lambda x: x.replace(lang_name, request.form["name"]), new_langs)
        )
        mentee.languages = new_langs
        mentee.save()

    MentorApplication.objects(languages=lang_name).update(
        set__languages=request.form["name"]
    )
    MenteeApplication.objects(language=lang_name).update(
        set__language=request.form["name"]
    )
    NewMentorApplication.objects(languages=lang_name).update(
        set__languages=request.form["name"]
    )
    record.name = request.form["name"]
    record.updated_at = datetime.now()
    record.save()
    # except:
    #   return create_response(status=422, message="training not found")

    return create_response(status=200, data={"result": record})


######################################################################
@masters.route("/languages", methods=["POST"])
@admin_only
def new_language():
    # try:
    name = request.form["name"]
    record = Languages(name=name, updated_at=datetime.now())

    record.save()
    # except:
    #    return create_response(status=401, message="missing parameters")

    return create_response(status=200, data={"result": record})


@masters.route("/specializations", methods=["GET"])
def getSpecializations():
    try:
        specializations = Specializations.objects.order_by("name").collation(
            collation.Collation("en", strength=2)
        )
    except Exception as e:
        msg = "Get Specializations error"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(data={"result": specializations})


@masters.route("/specializations/<string:id>", methods=["GET"])
@admin_only
def get_specialization(id):
    try:
        record = Specializations.objects.get(id=id)
    except:
        return create_response(status=422, message="Specializations not found")

    return create_response(status=200, data={"result": record})


@masters.route("specializations/<string:id>", methods=["DELETE"])
@admin_only
def delete_specializations(id):
    try:
        specializations = Specializations.objects.get(id=id)
        # prev_name = specializations.name
        # mentors = MentorProfile.objects(specializations__in=[prev_name])
        # for mentor in mentors:
        #     new_specs = mentor.specializations
        #     new_specs.remove(prev_name)
        #     mentor.specializations = new_specs
        #     mentor.save()
        # mentees = MenteeProfile.objects(specializations__in=[prev_name])
        # for mentee in mentees:
        #     new_specs = mentee.specializations
        #     new_specs.remove(prev_name)
        #     mentee.specializations = new_specs
        #     mentee.save()
        # mentor_apps = MentorApplication.objects(specializations__in=[prev_name])
        # for mentor_app in mentor_apps:
        #     new_specs = mentor_app.specializations
        #     new_specs.remove(prev_name)
        #     mentor_app.specializations = new_specs
        #     mentor_app.save()
        specializations.delete()
    except Exception as e:
        logger.info(e)
        return create_response(status=422, message="specialization not found")

    return create_response(status=200, message="Successful deletion")


@masters.route("/specializations/<string:id>", methods=["PUT"])
@admin_only
def edit_specialization_by_id(id):
    # try:
    record = Specializations.objects.get(id=id)
    prev_name = record.name
    mentors = MentorProfile.objects(specializations__in=[prev_name])
    for mentor in mentors:
        new_specs = mentor.specializations
        new_specs = list(
            map(lambda x: x.replace(prev_name, request.form["name"]), new_specs)
        )
        mentor.specializations = new_specs
        mentor.save()
    mentees = MenteeProfile.objects(specializations__in=[prev_name])
    for mentee in mentees:
        new_specs = mentee.specializations
        new_specs = list(
            map(lambda x: x.replace(prev_name, request.form["name"]), new_specs)
        )
        mentee.specializations = new_specs
        mentee.save()
    mentor_apps = MentorApplication.objects(specializations__in=[prev_name])
    for mentor_app in mentor_apps:
        new_specs = mentor_app.specializations
        new_specs = list(
            map(lambda x: x.replace(prev_name, request.form["name"]), new_specs)
        )
        mentor_app.specializations = new_specs
        mentor_app.save()

    record.name = request.form["name"]
    record.updated_at = datetime.now()

    record.save()
    # except:
    #   return create_response(status=422, message="training not found")

    return create_response(status=200, data={"result": record})


######################################################################
@masters.route("/specializations", methods=["POST"])
@admin_only
def new_specailization():
    # try:
    name = request.form["name"]
    record = Specializations(name=name, updated_at=datetime.now())

    record.save()
    # except:
    #    return create_response(status=401, message="missing parameters")

    return create_response(status=200, data={"result": record})
