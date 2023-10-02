from flask import Blueprint, request
import json
from numpy import imag
from werkzeug.utils import secure_filename
from api.core import create_response, logger
from api.models import (
    Event,
    Image,
    MentorProfile,
    MenteeProfile,
    PartnerProfile,
)
from datetime import datetime
from api.utils.translate import (
    get_all_translations,
)
from datetime import datetime
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
    if int(role) == Account.ADMIN:
        events = Event.objects().order_by("-start_datetime")
    else:
        events = Event.objects(role=str(role)).order_by("-start_datetime")
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


@event.route("events/delete/<string:id>", methods=["DELETE"])
def delete_train(id):
    try:
        event = Event.objects.get(id=id)
        event.delete()
    except:
        return create_response(status=422, message="event not found")

    return create_response(status=200, message="Successful deletion")


######################################################################
@event.route("event_register/<role>", methods=["POST"])
def new_event(role):
    try:
        data = request.get_json()
        event_id = data["event_id"]
        user_id = data["user_id"]
        title = data["title"]
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
        if "start_datetime" in data:
            start_datetime = data["start_datetime"]
            start_datetime_str = data["start_datetime_str"]
        if "end_datetime" in data:
            end_datetime = data["end_datetime"]
            end_datetime_str = data["end_datetime_str"]
        if "url" in data:
            url = data["url"]

        if event_id == 0:
            event = Event(
                user_id=user_id,
                title=title,
                titleTranslated=titleTranslated,
                description=description,
                descriptionTranslated=descriptionTranslated,
                role=str(role),
                start_datetime=start_datetime,
                end_datetime=end_datetime,
                url=url,
                date_submitted=datetime.now(),
            )
            event.save()

            role_name = ""
            if int(role) == Account.MENTOR:
                recipients = MentorProfile.objects.only("email", "preferred_language")
                role_name = "MENTOR"
            elif int(role) == Account.MENTEE:
                recipients = MenteeProfile.objects.only("email", "preferred_language")
                role_name = "MENTEE"
            else:
                recipients = PartnerProfile.objects.only("email", "preferred_language")
                role_name = "Partner"

            eventdate = ""
            if start_datetime_str != "":
                eventdate = start_datetime_str + " ~ " + end_datetime_str
            for recipient in recipients:
                res, res_msg = send_email(
                    recipient=recipient.email,
                    data={
                        "eventtitle": title,
                        "eventdate": eventdate,
                        "role": role_name,
                        recipient.preferred_language: True,
                        "subject": TRANSLATIONS[recipient.preferred_language][
                            "new_event"
                        ],
                    },
                    template_id=EVENT_TEMPLATE,
                )
                if not res:
                    msg = "Failed to send new event data alert email " + res_msg
                    logger.error(msg)
        else:
            event = Event.objects.get(id=event_id)
            event.user_id = user_id
            event.title = title
            event.role = str(role)
            event.titleTranslated = titleTranslated
            event.description = description
            event.descriptionTranslated = descriptionTranslated
            event.start_datetime = start_datetime
            event.end_datetime = end_datetime
            event.url = url
            event.date_submitted = datetime.now()
            event.save()

    except Exception as e:
        return create_response(status=400, message=f"missing parameters {e}")

    return create_response(status=200, data={"event": event})


@event.route("event_register/<string:id>/image", methods=["PUT"])
def uploadImage(id):
    print(id)
    event = Event.objects.get(id=id)
    print(event)
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
            print(new_image)
            event.image_file = new_image
            event.save()
            return create_response(status=200, message=f"Image upload success")
        except:
            return create_response(status=400, message=f"Image upload failed")
    else:
        return create_response(status=400, message=f"Image upload failed")
