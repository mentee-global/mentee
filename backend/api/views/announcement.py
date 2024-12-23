from flask import Blueprint, request
import json
from numpy import imag
from werkzeug.utils import secure_filename
from api.core import create_response, logger
from api.models import (
    Announcement,
    Event,
    Hub,
    Image,
    MentorProfile,
    MenteeProfile,
    PartnerProfile,
)
from datetime import datetime, timezone, timedelta
import re
from api.utils.translate import (
    get_all_translations,
    get_translation_document,
)
from flask import send_file
from io import BytesIO
from api.utils.constants import (
    Account,
    EVENT_TEMPLATE,
    TRANSLATIONS,
    TARGET_LANGS,
    NEW_ANNOUNCE_TEMPLATE,
)
from api.utils.request_utils import send_email, imgur_client
from mongoengine.queryset.visitor import Q

announcement = Blueprint("announcement", __name__)  # initialize blueprint


@announcement.route("announcement/<role>", methods=["GET"])
def get_announcements(role):
    lang = request.args.get("lang", "en-US")
    hub_user_id = request.args.get("hub_user_id", None)
    user_id = request.args.get("user_id", None)

    if int(role) == Account.HUB:
        data = Announcement.objects.filter(role__in=[role], hub_id=str(hub_user_id))
    else:
        data = Announcement.objects(role__in=[role])

    append_data = []
    if int(role) == Account.MENTOR:
        if user_id is None:
            append_data = Announcement.objects(
                Q(mentor_id__ne=None) & Q(mentor_id__ne="")
            )
        else:
            append_data = Announcement.objects(mentor_id=user_id)
    if int(role) == Account.MENTEE:
        if user_id is None:
            append_data = Announcement.objects(
                Q(mentee_id__ne=None) & Q(mentee_id__ne="")
            )
        else:
            append_data = Announcement.objects(mentee_id=user_id)

    result = []

    if lang in TARGET_LANGS:
        for item in data:
            item_dic = json.loads(item.to_json())
            item_dic["name"] = item.nameTranslated.get(lang, item.name)
            item_dic["description"] = item.descriptionTranslated.get(
                lang, item.description
            )
            result.append(item_dic)
        for item in append_data:
            item_dic = json.loads(item.to_json())
            item_dic["name"] = item.nameTranslated.get(lang, item.name)
            item_dic["description"] = item.descriptionTranslated.get(
                lang, item.description
            )
            result.append(item_dic)
    else:
        for item in data:
            result.append(item)
        for item in append_data:
            result.append(item)

    return create_response(data={"res": result})


@announcement.route("announcement/register/<role>", methods=["POST"])
def new_announce(role):
    try:
        name = request.form["name"]
        nameTranslated = get_all_translations(request.form["description"])
        description = request.form["description"]
        descriptionTranslated = get_all_translations(request.form["description"])
        hub_id = None

        if "hub_id" in request.form:
            hub_id = request.form["hub_id"]

        partner_id = None
        if (
            "partner_id" in request.form
            and request.form["partner_id"] is not None
            and request.form["partner_id"] != ""
        ):
            partner_id = request.form["partner_id"]
        mentor_id = None
        if (
            "mentor_id" in request.form
            and request.form["mentor_id"] is not None
            and request.form["mentor_id"] != ""
        ):
            mentor_id = request.form["mentor_id"]
        mentee_id = None
        if (
            "mentee_id" in request.form
            and request.form["mentee_id"] is not None
            and request.form["mentee_id"] != ""
        ):
            mentee_id = request.form["mentee_id"]

        announce = Announcement(
            name=name,
            nameTranslated=nameTranslated,
            description=description,
            descriptionTranslated=descriptionTranslated,
            role=str(role),
            date_submitted=datetime.now(),
            hub_id=hub_id,
            partner_id=partner_id,
            mentor_id=mentor_id,
            mentee_id=mentee_id,
        )

        document = request.files.get("document", None)
        if document:
            file_name = secure_filename(document.filename)
            if file_name == "":
                return create_response(status=400, message="Missing file name")
            announce.file_name = file_name
            announce.filee.put(document, filename=file_name)

        announce.save()

        front_url = request.form["front_url"]
        send_notification = (
            True if request.form["send_notification"] == "true" else False
        )
        if send_notification == True:
            new_id = announce.id
            hub_url = ""
            if int(role) == Account.MENTOR:
                recipients = MentorProfile.objects.only("email", "preferred_language")
            elif int(role) == Account.MENTEE:
                recipients = MenteeProfile.objects.only("email", "preferred_language")
            elif int(role) == Account.PARTNER:
                if partner_id is not None:
                    recipients = []
                    partner_data = PartnerProfile.objects.filter(id=partner_id).only(
                        "email", "preferred_language"
                    )
                    for item in partner_data:
                        recipients.append(item)
                    if mentor_id is not None:
                        mentor_data = MentorProfile.objects.filter(id=mentor_id).only(
                            "email", "preferred_language"
                        )
                        for item in mentor_data:
                            item.mentor = "mentor"
                            recipients.append(item)
                    if mentee_id is not None:
                        mentee_data = MenteeProfile.objects.filter(id=mentee_id).only(
                            "email", "preferred_language"
                        )
                        for item in mentee_data:
                            item.mentee = "mentee"
                            recipients.append(item)
                else:
                    recipients = PartnerProfile.objects.only(
                        "email", "preferred_language"
                    )
            else:
                hub_users = Hub.objects.filter(id=hub_id).only(
                    "email", "preferred_language", "url"
                )
                partners = PartnerProfile.objects.filter(hub_id=hub_id).only(
                    "email", "preferred_language"
                )
                recipients = []
                for hub_user in hub_users:
                    recipients.append(hub_user)
                    if hub_url == "":
                        hub_url = hub_user.url + "/"
                for partner_user in partners:
                    recipients.append(partner_user)
            target_url = front_url + hub_url + "announcement/" + str(new_id)

            for recipient in recipients:
                res, res_msg = send_email(
                    recipient=recipient.email,
                    data={"link": target_url, "title": announce.name},
                    template_id=NEW_ANNOUNCE_TEMPLATE,
                )
                if not res:
                    msg = "Failed to send new traing data alert email " + res_msg
                    logger.error(msg)

    except Exception as e:
        return create_response(status=400, message=f"missing parameters {e}")

    return create_response(status=200, data={"announce": announce})


@announcement.route("announcement/edit/<string:id>", methods=["PUT"])
def edit(id):
    try:
        announcement = Announcement.objects.get(id=id)
    except Exception as e:
        return create_response(status=422, message=f"Failed to get training: {e}")

    new_name = request.form.get("name", announcement.name)
    new_description = request.form.get("description", announcement.description)

    hub_id = None
    if "hub_id" in request.form:
        hub_id = request.form["hub_id"]
    announcement.hub_id = hub_id

    if announcement.name != new_name:
        announcement.name = new_name
        announcement.nameTranslated = get_all_translations(new_name)
    if announcement.description != new_description:
        announcement.description = new_description
        announcement.descriptionTranslated = get_all_translations(new_description)

    announcement.role = str(request.form.get("role", announcement.role))

    announcement.partner_id = request.form.get("partner_id", announcement.partner_id)
    announcement.mentor_id = request.form.get("mentor_id", announcement.mentor_id)
    announcement.mentee_id = request.form.get("mentee_id", announcement.mentee_id)

    document = request.files.get("document", None)
    if document:
        file_name = secure_filename(document.filename)
        if file_name == "":
            return create_response(status=400, message="Missing file name")

        announcement.filee.replace(document, filename=file_name)
        announcement.file_name = file_name

    announcement.save()

    return create_response(status=200, data={"announce": announcement})


@announcement.route("announcement/upload/<string:id>/image", methods=["PUT"])
def uploadImage(id):
    announcement = Announcement.objects.get(id=id)
    if announcement:
        try:
            if (
                announcement.image is True
                and announcement.announcement.image_hash is True
            ):
                image_response = imgur_client.delete_image(
                    announcement.image_file.image_hash
                )

            image = request.files["image"]
            image_response = imgur_client.send_image(image)
            new_image = Image(
                url=image_response["data"]["link"],
                image_hash=image_response["data"]["deletehash"],
            )
            announcement.image = new_image
            announcement.save()
            return create_response(status=200, message=f"Image upload success")
        except:
            return create_response(status=400, message=f"Image upload failed")
    else:
        return create_response(status=400, message=f"Image upload failed")


@announcement.route("/announcement/getDoc/<string:id>", methods=["GET"])
def get_doc_file(id):
    lang = request.args.get("lang", "en-US")
    try:
        announcement = Announcement.objects.get(id=id)
    except:
        return create_response(status=422, message="training not found")

    if lang in TARGET_LANGS:
        document = get_translation_document(announcement.translations, lang)
    else:
        document = announcement.filee.read()

    content_type = announcement.filee.content_type

    if not document:
        return create_response(status=422, message="No document found")
    return send_file(
        BytesIO(document), download_name=announcement.file_name, mimetype=content_type
    )


@announcement.route("announcement/get/<string:id>", methods=["GET"])
def get_announce_by_id(id):
    try:
        announcement = Announcement.objects.get(id=id)
    except:
        return create_response(status=422, message="announcement not found")

    return create_response(data={"announcement": announcement})


@announcement.route("announcement/delete/<string:id>", methods=["DELETE"])
def delete(id):
    try:
        announcement = Announcement.objects.get(id=id)
        announcement.delete()
    except:
        return create_response(status=422, message="event not found")

    return create_response(status=200, message="Successful deletion")
