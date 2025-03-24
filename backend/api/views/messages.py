from flask import Blueprint, request
from api.models import (
    MentorProfile,
    MenteeProfile,
    Message,
    DirectMessage,
    GroupMessage,
    PartnerGroupMessage,
    PartnerProfile,
    Availability,
    Specializations,
)
from api.utils.request_utils import send_email
from api.utils.constants import Account, MENTOR_CONTACT_ME, TRANSLATIONS
from api.utils.require_auth import all_users
from api.utils.translate import get_translated_options
from api.core import create_response, logger
import json
from datetime import datetime
from api import socketio
from mongoengine.queryset.visitor import Q
from urllib.parse import unquote


messages = Blueprint("messages", __name__)


@messages.route("/", methods=["GET"])
@all_users
def get_messages():
    try:
        messages = Message.objects.filter(**request.args)
    except:
        msg = "Invalid parameters provided"
        logger.info(msg)
        return create_response(status=422, message=msg)
    msg = "Success"
    if not messages:
        msg = "Messages could not be found with parameters provided"
    return create_response(data={"Messages": messages}, status=200, message=msg)


@messages.route("/<string:message_id>", methods=["DELETE"])
@all_users
def delete_message(message_id):
    try:
        message = Message.objects.get(id=message_id)
    except:
        msg = "Invalid message id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    try:
        message.delete()
        return create_response(
            status=200, message=f"message_id: {message_id} deleted successfully"
        )
    except:
        msg = "Failed to delete message"
        logger.info(msg)
        return create_response(status=422, message=msg)


@messages.route("/<string:message_id>", methods=["PUT"])
@all_users
def update_message(message_id):
    try:
        message = Message.objects.get(id=message_id)
    except:
        msg = "Invalid message id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    try:
        body = request.get_json()
        for field in body:
            message[field] = body[field]
        message.save()
        return create_response(
            status=200,
            message=f"message_id: {message_id} field: {field} updated with: {body[field]}",
        )
    except:
        msg = "Failed to update message"
        logger.info(msg)
        return create_response(status=422, message=msg)


@messages.route("/", methods=["POST"])
@all_users
def create_message():
    data = request.get_json()
    availabes_in_future = None
    if "availabes_in_future" in data:
        availabes_in_future = data.get("availabes_in_future")
    try:
        message = DirectMessage(
            body=data["message"],
            message_read=False,
            sender_id=data["user_id"],
            recipient_id=data["recipient_id"],
            created_at=data.get("time"),
            availabes_in_future=availabes_in_future,
        )
    except Exception as e:
        msg = "Invalid parameter provided"
        logger.info(e)
        return create_response(status=422, message=msg)
    try:
        message.save()
    except:
        msg = "Failed to save message"
        logger.info(msg)
        return create_response(status=422, message=msg)

    socketio.emit(data["recipient_id"], json.loads(message.to_json()))
    return create_response(
        status=201,
        message=f"Successfully saved message",
    )


@messages.route("/mentor/<string:mentor_id>", methods=["POST"])
@all_users
def contact_mentor(mentor_id):
    data = request.get_json()
    if "mentee_id" not in data:
        return create_response(status=422, message="missing mentee_id")

    mentee_id = data["mentee_id"]
    try:
        mentor = MentorProfile.objects.get(id=mentor_id)
        mentee = MenteeProfile.objects.get(id=mentee_id)
    except:
        msg = "Could not find mentor or mentee for given ids"
        return create_response(status=422, message=msg)

    interest_areas = data.get("interest_areas", [])
    translated_interest_areas = get_translated_options(
        mentor.preferred_language, interest_areas, Specializations
    )

    res, res_msg = send_email(
        mentor.email,
        data={
            "interest_areas": ", ".join(translated_interest_areas),
            "message": data.get("message", ""),
            "name": mentee.name,
            mentor.preferred_language: True,
            "subject": TRANSLATIONS[mentor.preferred_language]["mentor_contact_me"],
        },
        template_id=MENTOR_CONTACT_ME,
    )
    email_sent_status = ""
    if not res:
        msg = "Failed to send mentee email " + res_msg
        logger.info(msg)
        # return create_response(status=500, message="Failed to send message")
        email_sent_status = ", But failed to send message"

    try:
        message = DirectMessage(
            body=data.get("message", "Hello"),
            message_read=False,
            sender_id=mentee_id,
            recipient_id=mentor_id,
            created_at=datetime.utcnow().isoformat(),
        )

        socketio.emit(mentor_id, json.loads(message.to_json()))
    except Exception as e:
        msg = "Invalid parameter provided"
        logger.info(e)
        return create_response(status=422, message=msg)
    try:
        message.save()
    except:
        msg = "Failed to save message"
        logger.info(msg)
        return create_response(status=422, message=msg)

    return create_response(
        status=200, message="successfully sent email message" + email_sent_status
    )


@messages.route("/contacts/<string:user_id>", methods=["GET"])
@all_users
def get_sidebar(user_id):
    try:
        sentMessages = DirectMessage.objects.filter(
            Q(recipient_id=user_id) | Q(sender_id=user_id)
        ).order_by("-created_at")

        contacts = []
        sidebarContacts = set()
        for message in sentMessages:
            otherId = message["recipient_id"]
            message_read = message["message_read"]

            if str(otherId) == user_id:
                otherId = message["sender_id"]

            if otherId not in sidebarContacts:
                otherUser = None
                user_type = Account.MENTOR.value
                try:
                    otherUser = MentorProfile.objects.get(id=otherId)
                except:
                    try:
                        otherUser = PartnerProfile.objects.get(id=otherId)
                        user_type = Account.PARTNER.value
                    except:
                        pass
                if not otherUser:
                    user_type = Account.MENTEE.value
                    try:
                        otherUser = MenteeProfile.objects.get(id=otherId)
                    except Exception as e:
                        logger.info(e)
                        msg = "Could not find mentor or mentee for given ids"
                        logger.info(msg)
                        continue
                otherUser = json.loads(otherUser.to_json())
                if user_type == Account.PARTNER.value:
                    otherUserObj = {
                        "name": otherUser["organization"],
                        "user_type": user_type,
                    }
                else:
                    otherUserObj = {
                        "name": otherUser["name"],
                        "user_type": user_type,
                    }

                if "image" in otherUser:
                    otherUserObj["image"] = otherUser["image"]["url"]

                sidebarObject = {
                    "otherId": str(otherId),
                    "message_read": message_read,
                    "numberOfMessages": len(
                        [
                            messagee
                            for messagee in sentMessages
                            if (
                                messagee["recipient_id"] == otherId
                                or messagee["sender_id"] == otherId
                            )
                        ]
                    ),
                    "otherUser": otherUserObj,
                    "latestMessage": json.loads(message.to_json()),
                }

                allMessages = [
                    json.loads(message.to_json()) for message in sentMessages
                ]

                contacts.append(sidebarObject)
                sidebarContacts.add(otherId)

        return create_response(
            data={
                "data": contacts,
                "allMessages": allMessages,
            },
            status=200,
            message="res",
        )
    except Exception as e:
        logger.info(e)
        return create_response(status=422, message=str(e))


@messages.route("/contacts/mentors/<int:pageNumber>", methods=["GET"])
@all_users
def get_sidebar_mentors(pageNumber):
    partner_id = request.args.get("partner_id", "no-affiliation")
    view_mode = request.args.get("view_mode", "all")
    searchTerm = request.args.get("searchTerm", "")
    startDate = request.args.get("startDate", "")
    endDate = request.args.get("endDate", "")
    pageSize = request.args.get("pageSize", 20, type=int)

    startRecord = pageSize * (pageNumber - 1)
    endRecord = pageSize * pageNumber

    # Get all mentors based on partner affiliation
    if partner_id == "all":
        mentors = MentorProfile.objects()
    elif partner_id == "no-affiliation":
        mentors = MentorProfile.objects(
            Q(pair_partner__exists=False) | Q(pair_partner=None)
        )
    else:
        # Filter mentors by partner_id
        mentors = MentorProfile.objects(Q(pair_partner__partner_id=partner_id))

    detailMessages = []

    allMessages = DirectMessage.objects.filter(
        created_at__gte=datetime.fromisoformat(startDate),
        created_at__lte=datetime.fromisoformat(endDate),
    ).order_by("-created_at")
    messages_by_sender_or_recipient = {}

    for message_item in allMessages:
        if message_item.sender_id not in messages_by_sender_or_recipient:
            messages_by_sender_or_recipient[message_item.sender_id] = []
        messages_by_sender_or_recipient[message_item.sender_id].append(message_item)
        if message_item.recipient_id not in messages_by_sender_or_recipient:
            messages_by_sender_or_recipient[message_item.recipient_id] = []
        messages_by_sender_or_recipient[message_item.recipient_id].append(message_item)

    # Get all mentees based on partner affiliation
    if partner_id == "all":
        allMentees = MenteeProfile.objects()
    elif partner_id == "no-affiliation":
        allMentees = MenteeProfile.objects(
            Q(pair_partner__exists=False) | Q(pair_partner=None)
        )
    else:
        # Filter mentees by partner_id
        allMentees = MenteeProfile.objects(Q(pair_partner__partner_id=partner_id))

    mentees_by_id = {}
    for mentee_item in allMentees:
        mentees_by_id[mentee_item.id] = mentee_item

    for mentor in list(mentors):
        user_id = mentor.id
        mentor_user = json.loads(mentor.to_json())
        try:
            sentMessages = ()
            if user_id in messages_by_sender_or_recipient:
                sentMessages = messages_by_sender_or_recipient[user_id]
        except:
            continue
        if len(sentMessages) == 0:
            continue
        contacts = []
        for message in sentMessages:
            if str(user_id) == message["recipient_id"]:
                contacts.append(message["sender_id"])
            else:
                contacts.append(message["recipient_id"])
        contacts = list(dict.fromkeys(contacts))
        for contactId in contacts:
            try:
                otherUser = mentees_by_id[contactId]
            except:
                continue
            otherUserObj = {
                "name": otherUser["name"],
                "user_type": Account.MENTEE.value,
            }
            if "image" in otherUser:
                otherUserObj["image"] = otherUser["image"]["url"]
            else:
                otherUserObj["image"] = ""

            if "pair_partner" in otherUser:
                otherUserObj["pair_partner"] = otherUser["pair_partner"]

            conversation_messages = [
                messagee
                for messagee in sentMessages
                if (
                    messagee["recipient_id"] == contactId
                    or messagee["sender_id"] == contactId
                )
            ]

            if len(conversation_messages) == 0:
                continue

            conversation_messages.sort(key=lambda x: x["created_at"], reverse=True)

            latestMessage = conversation_messages[0]

            has_unanswered_messages = False
            if view_mode in ["mentee-to-mentor", "mentees", "all"]:
                latest_mentee_message = next(
                    (
                        msg
                        for msg in conversation_messages
                        if msg["sender_id"] == contactId
                    ),
                    None,
                )

                if latest_mentee_message:
                    latest_mentee_date = latest_mentee_message["created_at"]
                    mentor_responses = [
                        msg
                        for msg in conversation_messages
                        if msg["sender_id"] == str(user_id)
                        and msg["created_at"] > latest_mentee_date
                    ]

                    has_unanswered_messages = len(mentor_responses) == 0

            skip_conversation = False

            if view_mode == "mentee-to-mentor":
                mentee_messages = [
                    msg
                    for msg in conversation_messages
                    if msg["sender_id"] == contactId
                ]
                if not mentee_messages:
                    skip_conversation = True
                else:
                    latestMessage = mentee_messages[0]

            elif view_mode == "mentor-to-mentee":
                mentor_messages = [
                    msg
                    for msg in conversation_messages
                    if msg["sender_id"] == str(user_id)
                ]
                if not mentor_messages:
                    skip_conversation = True
                else:
                    latestMessage = mentor_messages[0]

            elif view_mode == "mentors":
                # For mentors only, ensure the latest message is from mentor
                mentor_messages = [
                    msg
                    for msg in conversation_messages
                    if msg["sender_id"] == str(user_id)
                ]
                if not mentor_messages:
                    skip_conversation = True
                else:
                    latestMessage = mentor_messages[0]

            elif view_mode == "mentees":
                mentee_messages = [
                    msg
                    for msg in conversation_messages
                    if msg["sender_id"] == contactId
                ]
                if not mentee_messages:
                    skip_conversation = True
                else:
                    latestMessage = mentee_messages[0]

            if skip_conversation:
                continue

            sidebarObject = {
                "otherId": str(contactId),
                "numberOfMessages": len(conversation_messages),
                "otherUser": otherUserObj,
                "latestMessage": json.loads(latestMessage.to_json()),
                "user": mentor_user,
                "hasUnansweredMessages": has_unanswered_messages,
            }

            detailMessages.append(sidebarObject)

    FormattedData = []
    for subitem in detailMessages:
        menteeName = subitem["otherUser"]["name"].lower()
        mentorName = subitem["user"]["name"].lower()
        if searchTerm.lower() in mentorName or searchTerm.lower() in menteeName:
            FormattedData.append(subitem)

    sortedData = sorted(
        FormattedData,
        key=lambda x: x["latestMessage"]["created_at"]["$date"],
        reverse=True,
    )

    sortedData = sortedData[startRecord:endRecord]
    total_length = len(FormattedData)
    return create_response(
        data={"data": sortedData, "total_length": total_length},
        status=200,
        message="res",
    )


@messages.route("/group_delete/<string:message_id>", methods=["DELETE"])
@all_users
def delete_group_message(message_id):
    try:
        message = GroupMessage.objects.get(id=message_id)
    except:
        msg = "Invalid message id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    try:
        message.is_deleted = True
        message.save()
        return create_response(
            status=200, message=f"message_id: {message_id} deleted successfully"
        )
    except:
        msg = "Failed to delete message"
        logger.info(msg)
        return create_response(status=422, message=msg)


@messages.route("/group/", methods=["GET"])
@all_users
def get_group_messages():
    try:
        hub_user_id = request.args.get("hub_user_id", None)
        if hub_user_id is not None and hub_user_id != "":
            messages = GroupMessage.objects(
                Q(hub_user_id=request.args.get("hub_user_id")) & Q(is_deleted__ne=True)
            )
        else:
            messages = PartnerGroupMessage.objects()
    except:
        msg = "Invalid parameters provided"
        logger.info(msg)
        return create_response(status=422, message=msg)
    msg = "Success"
    if not messages:
        msg = request.args
    return create_response(data={"Messages": messages}, status=200, message=msg)


@messages.route("/direct/", methods=["GET"])
@all_users
def get_direct_messages():
    try:
        messages = DirectMessage.objects(
            Q(sender_id=request.args.get("sender_id"))
            & Q(recipient_id=request.args.get("recipient_id"))
            | Q(sender_id=request.args.get("recipient_id"))
            & Q(recipient_id=request.args.get("sender_id"))
        )
    except:
        msg = "Invalid parameters provided"
        logger.info(msg)
        return create_response(status=422, message=msg)
    msg = "Success"
    if not messages:
        msg = request.args
    return create_response(data={"Messages": messages}, status=200, message=msg)


@socketio.on("editGroupMessage")
def editGroupMessage(id, hub_user_id, message_title, message_body, methods=["POST"]):
    try:
        if hub_user_id is not None:
            message = GroupMessage.objects.get(id=id)
            message.title = message_title
            message.body = message_body
            message.message_edited = True

        else:
            message = PartnerGroupMessage.objects.get(id=id)
            message.body = message_body
            message.message_edited = True

    except Exception as e:
        logger.info(e)
        return create_response(status=500, message="Failed to edit message")

    try:
        message.save()
        if hub_user_id is not None:
            socketio.emit(hub_user_id + "-edited", json.loads(message.to_json()))
        else:
            socketio.emit("group-partner-edited", json.loads(message.to_json()))
        msg = "successfully message edited"
    except:
        msg = "Error in meessage"
        logger.info(msg)
        return create_response(status=500, message="Failed to edit message")
    return create_response(status=200, message="successfully message edited")


@socketio.on("sendGroup")
def chatGroup(msg, methods=["POST"]):
    try:
        if "hub_user_id" in msg and msg["hub_user_id"] is not None:
            message = GroupMessage(
                title=msg.get("title"),
                body=msg["body"],
                message_read=msg["message_read"],
                sender_id=msg["sender_id"],
                hub_user_id=msg["hub_user_id"],
                parent_message_id=msg.get("parent_message_id"),
                created_at=msg["time"],
            )
            logger.info(msg["hub_user_id"])

        else:
            message = PartnerGroupMessage(
                body=msg["body"],
                message_read=msg["message_read"],
                sender_id=msg["sender_id"],
                parent_message_id=msg["parent_message_id"],
                created_at=msg["time"],
            )
            logger.info(msg["sender_id"])

    except Exception as e:
        logger.info(e)
        return create_response(status=500, message="Failed to send message")

    try:
        message.save()
        if "hub_user_id" in msg and msg["hub_user_id"] is not None:
            socketio.emit(msg["hub_user_id"], json.loads(message.to_json()))
        else:
            socketio.emit("group-partner", json.loads(message.to_json()))
        msg = "successfully sent message"
    except:
        msg = "Error in meessage"
        logger.info(msg)
        return create_response(status=500, message="Failed to send message")
    return create_response(status=200, message="successfully sent message")


@socketio.on("send")
def chat(msg, methods=["POST"]):
    try:
        availabes_in_future = None
        if "availabes_in_future" in msg:
            availabes_in_future = [
                Availability(
                    start_time=availability.get("start_time").get("$date"),
                    end_time=availability.get("end_time").get("$date"),
                )
                for availability in msg["availabes_in_future"]
            ]

        message = DirectMessage(
            body=msg["body"],
            message_read=msg["message_read"],
            sender_id=msg["sender_id"],
            recipient_id=msg["recipient_id"],
            created_at=msg["time"],
            availabes_in_future=availabes_in_future,
        )
        logger.info(msg["recipient_id"])
        socketio.emit(msg["recipient_id"], json.loads(message.to_json()))

    except Exception as e:
        logger.info(e)
        return create_response(status=500, message="Failed to send message")
    try:
        message.save()
        msg = "successfully sent message"
    except:
        msg = "Error in meessage"
        logger.info(msg)
        return create_response(status=500, message="Failed to send message")
    return create_response(status=200, message="successfully sent message")


@socketio.on("invite")
def invite(msg, methods=["POST"]):
    try:
        logger.info(msg["recipient_id"])
        inviteObject = {
            "inviteeId": msg["sender_id"],
            "allowBooking": "true",
        }
        socketio.emit(msg["recipient_id"], inviteObject)

    except Exception as e:
        logger.info(e)
        return create_response(status=500, message="Failed to send invite")
    try:
        mentee = MenteeProfile.objects.get(id=msg["recipient_id"])
        if msg["sender_id"] not in mentee.favorite_mentors_ids:
            mentee.favorite_mentors_ids.append(msg["sender_id"])
        mentee.save()
    except Exception as e:
        msg = "Failed to saved mentor as favorite"
        logger.info(e)
        return create_response(status=422, message=msg)

    return create_response(status=200, message="successfully sent invite")
