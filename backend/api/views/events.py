from flask import Blueprint, request
import json
from numpy import imag
from werkzeug.utils import secure_filename
from api.core import create_response, logger
from api.models import (
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
)
from api.utils.constants import (
    Account,
    EVENT_TEMPLATE,
    TRANSLATIONS,
    TARGET_LANGS,
)
from api.utils.request_utils import send_email, imgur_client

event = Blueprint("event", __name__)  # initialize blueprint


@event.route("events/<role>", methods=["GET"])
def get_events(role):
    lang = request.args.get("lang", "en-US")
    hub_user_id = request.args.get("hub_user_id", None)
    partner_id = request.args.get("partner_id", None)
    user_id = request.args.get("user_id", None)
    if int(role) == Account.ADMIN:
        events = Event.objects().order_by("-start_datetime")
    elif int(role) == Account.HUB:
        events = Event.objects.filter(
            role__in=[role], hub_id=str(hub_user_id)
        ).order_by("-start_datetime")
        temp = []
        if partner_id:
            for event in events:
                if (
                    (event.partner_ids is None)
                    or (len(event.partner_ids) == 0)
                    or (partner_id in event.partner_ids)
                ):
                    temp.append(event)
            if user_id:
                print("usss", user_id)
                for event in events:
                    print("eeeee", event.user_id, str(event.user_id) == user_id)
                    if str(event.user_id) == user_id:
                        temp.append(event)
            events = temp
    else:
        events = Event.objects(role__in=[role]).order_by("-start_datetime")
    result = []

    if lang in TARGET_LANGS:
        for event in events:
            event_dic = json.loads(event.to_json())
            event_dic["name"] = event.titleTranslated.get(lang, event.title)
            event_dic["description"] = event.descriptionTranslated.get(
                lang, event.description
            )
            result.append(event_dic)
    else:
        result = events

    return create_response(data={"events": result})


@event.route("event/<string:id>", methods=["GET"])
def get_event_by_id(id):
    try:
        event = Event.objects.get(id=id)
    except:
        return create_response(status=422, message="event not found")

    return create_response(data={"event": event})


@event.route("events/delete/<string:id>", methods=["DELETE"])
def delete_train(id):
    try:
        event = Event.objects.get(id=id)
        event.delete()
    except:
        return create_response(status=422, message="event not found")

    return create_response(status=200, message="Successful deletion")


######################################################################
def send_mail_for_event(
    recipients, role_name, title, eventdate, target_url, start_datetime, end_datetime
):
    for recipient in recipients:
        if "timezone" in recipient and recipient.timezone:
            match = re.match(r"UTC([+-]\d{2}):(\d{2})", recipient.timezone)
            if match:
                hours_offset = int(match.group(1))
                minutes_offset = int(match.group(2))
                # Create a timezone with the parsed offset
                offset = timezone(timedelta(hours=hours_offset, minutes=minutes_offset))
                # Convert the datetime to the target timezone

                eventdate = (
                    datetime.strptime(
                        start_datetime.replace("Z", "+00:00"), "%Y-%m-%dT%H:%M:%S.%f%z"
                    )
                    .astimezone(offset)
                    .strftime("%m-%d-%Y %I:%M%p %Z")
                    + " ~ "
                    + datetime.strptime(
                        end_datetime.replace("Z", "+00:00"), "%Y-%m-%dT%H:%M:%S.%f%z"
                    )
                    .astimezone(offset)
                    .strftime("%m-%d-%Y %I:%M%p %Z")
                )

        res, res_msg = send_email(
            recipient=recipient.email,
            data={
                "link": target_url,
                "eventtitle": title,
                "eventdate": eventdate,
                "role": role_name,
                recipient.preferred_language: True,
                "subject": TRANSLATIONS[recipient.preferred_language]["new_event"],
            },
            template_id=EVENT_TEMPLATE,
        )
        if not res:
            msg = "Failed to send new event data alert email " + res_msg
            logger.error(msg)


@event.route("event_register", methods=["POST"])
def new_event():
    try:
        data = request.get_json()
        event_id = data["event_id"]
        user_id = data["user_id"]
        title = data["title"]
        roles = data["role"]
        front_url = data["front_url"]
        titleTranslated = get_all_translations(data["title"])
        description = None
        descriptionTranslated = None
        if "description" in data:
            description = data["description"]
            descriptionTranslated = get_all_translations(data["description"])
        start_datetime = None
        end_datetime = None
        start_datetime_str = ""
        end_datetime_str = ""
        url = None
        hub_id = None
        if "start_datetime" in data:
            start_datetime = data["start_datetime"]
            start_datetime_str = data["start_datetime_str"]
        if "end_datetime" in data:
            end_datetime = data["end_datetime"]
            end_datetime_str = data["end_datetime_str"]
        if "url" in data:
            url = data["url"]
        if "hub_id" in data:
            hub_id = data["hub_id"]

        partner_ids = None
        if "partner_ids" in data:
            partner_ids = list(data["partner_ids"])

        if event_id == 0:
            event = Event(
                user_id=user_id,
                title=title,
                titleTranslated=titleTranslated,
                description=description,
                descriptionTranslated=descriptionTranslated,
                role=list(roles),
                partner_ids=partner_ids,
                start_datetime=start_datetime,
                end_datetime=end_datetime,
                url=url,
                hub_id=hub_id,
                date_submitted=datetime.now(),
            )
            event.save()

            new_event_id = event.id
            target_url = front_url + "event/" + str(new_event_id)
            role_name = ""
            eventdate = ""
            if start_datetime_str != "":
                eventdate = start_datetime_str + " ~ " + end_datetime_str
            if Account.MENTOR in roles:
                recipients = MentorProfile.objects.only(
                    "email", "preferred_language", "timezone"
                )
                role_name = "MENTOR"

                send_mail_for_event(
                    recipients,
                    role_name,
                    title,
                    eventdate,
                    target_url,
                    start_datetime,
                    end_datetime,
                )
            if Account.MENTEE in roles:
                recipients = MenteeProfile.objects.only(
                    "email", "preferred_language", "timezone"
                )
                role_name = "MENTEE"
                send_mail_for_event(
                    recipients,
                    role_name,
                    title,
                    eventdate,
                    target_url,
                    start_datetime,
                    end_datetime,
                )
            if Account.PARTNER in roles:
                recipients = PartnerProfile.objects.only(
                    "email", "preferred_language", "timezone"
                )
                role_name = "Partner"
                send_mail_for_event(
                    recipients,
                    role_name,
                    title,
                    eventdate,
                    target_url,
                    start_datetime,
                    end_datetime,
                )
            if hub_id is not None:
                role_name = "Hub"
                if partner_ids:
                    partners = PartnerProfile.objects.filter(id__in=partner_ids).only(
                        "email", "preferred_language"
                    )
                else:
                    partners = PartnerProfile.objects.filter(hub_id=hub_id).only(
                        "email", "preferred_language"
                    )
                hub_users = Hub.objects(id=hub_id).only(
                    "email", "preferred_language", "url"
                )
                recipients = []
                for hub_user in hub_users:
                    role_name = hub_user.name
                    recipients.append(hub_user)
                    target_url = (
                        front_url + hub_user.url + "/event/" + str(new_event_id)
                    )
                for partner_user in partners:
                    recipients.append(partner_user)
                send_mail_for_event(
                    recipients,
                    role_name,
                    title,
                    eventdate,
                    target_url,
                    start_datetime,
                    end_datetime,
                )
        else:
            event = Event.objects.get(id=event_id)
            event.user_id = user_id
            event.title = title
            event.role = list(roles)
            event.titleTranslated = titleTranslated
            event.description = description
            event.descriptionTranslated = descriptionTranslated
            event.start_datetime = start_datetime
            event.end_datetime = end_datetime
            event.url = url
            event.hub_id = hub_id
            event.date_submitted = datetime.now()
            event.save()

    except Exception as e:
        return create_response(status=400, message=f"missing parameters {e}")

    return create_response(status=200, data={"event": event})


@event.route("event_register/<string:id>/image", methods=["PUT"])
def uploadImage(id):
    event = Event.objects.get(id=id)
    if event:
        try:
            if event.image_file is True and event.image_file.image_hash is True:
                image_response = imgur_client.delete_image(event.image_file.image_hash)

            image = request.files["image"]
            image_response = imgur_client.send_image(image)
            new_image = Image(
                url=image_response["data"]["link"],
                image_hash=image_response["data"]["deletehash"],
            )
            event.image_file = new_image
            event.save()
            return create_response(status=200, message=f"Image upload success")
        except:
            return create_response(status=400, message=f"Image upload failed")
    else:
        return create_response(status=400, message=f"Image upload failed")
