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
from api.utils.require_auth import admin_only, all_users
from pymongo import collation
from api.utils.google_translate import get_all_translations, get_translation

masters = Blueprint("masters", __name__)

# IGNORE is found in backend/user_options.json
# This function is used to populate the Languages and Specializations collections
# with the data from user_options.json
# It is only used once, when the database is first created
# @masters.route("/google-translate", methods=["GET"])
# def google_translate():
#     mapping = {"languages": Languages, "specializations": Specializations}

#     for database in IGNORE:
#         for item in IGNORE[database]:
#             try:
#                 record = mapping[database].objects.get(name=item["name"])
#             except:
#                 logger.info(f"Could not find {item['name']}")
#                 record = mapping[database](
#                     name=item["name"],
#                     updated_at=datetime.now()
#                 )
#                 logger.info("Creating new record")
#             record.translations = item["translations"]
#             record.save()

#     return create_response(data={"result": "success"})

# @masters.route("/translate", methods=["PUT"])
# @admin_only
# def translate():
#     mapping = {"languages": Languages, "specializations": Specializations}
#     optionType = request.form["optionType"]
#     selectId = request.form["selectId"]

#     try:
#         record = mapping[optionType].objects.get(id=selectId)
#     except:
#         return create_response(status=422, message="Record not found")
#     record.translations = get_all_translations(record.name)
#     record.save()

#     return create_response(data={"result": "success", "record": record})


@masters.route("/languages", methods=["GET"])
# @all_users
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


# TODO: Add translations to this as well in case of typos
@masters.route("/languages/<string:id>", methods=["PUT"])
@admin_only
def edit_language_by_id(id):
    record = Languages.objects.get(id=id)
    lang_name = record.name
    mentors = MentorProfile.objects(languages__in=[lang_name])
    for mentor in mentors:
        new_langs = mentor.languages
        new_langs = list(
            map(lambda x: x.replace(lang_name, request.form["name"]), new_langs)
        )
        mentor.languages = new_langs
        if "taking_appointments" not in mentor:
            mentor.taking_appointments = False
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

    return create_response(status=200, data={"result": record})


######################################################################
@masters.route("/languages", methods=["POST"])
@admin_only
def new_language():
    name = request.form["name"]
    record = Languages(name=name, updated_at=datetime.now())
    record.translations = get_all_translations(name)

    record.save()

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


# TODO: Add translations to this as well in case of typos
@masters.route("/specializations/<string:id>", methods=["PUT"])
@admin_only
def edit_specialization_by_id(id):
    record = Specializations.objects.get(id=id)
    prev_name = record.name
    mentors = MentorProfile.objects(specializations__in=[prev_name])
    for mentor in mentors:
        new_specs = mentor.specializations
        new_specs = list(
            map(lambda x: x.replace(prev_name, request.form["name"]), new_specs)
        )
        mentor.specializations = new_specs
        if "taking_appointments" not in mentor:
            mentor.taking_appointments = False
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

    return create_response(status=200, data={"result": record})


######################################################################
@masters.route("/specializations", methods=["POST"])
@admin_only
def new_specailization():
    name = request.form["name"]
    record = Specializations(name=name, updated_at=datetime.now())
    record.translations = get_all_translations(name)

    record.save()

    return create_response(status=200, data={"result": record})
