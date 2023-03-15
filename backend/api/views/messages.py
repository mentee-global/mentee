from flask import Blueprint, request
from api.models import (
    MentorProfile,
    MenteeProfile,
    Message,
    DirectMessage,
    PartnerProfile,
)
from api.utils.request_utils import send_email
from api.utils.constants import Account, MENTOR_CONTACT_ME
from api.core import create_response, logger
import json
from datetime import datetime
from api import socketio
from mongoengine.queryset.visitor import Q
from urllib.parse import unquote


messages = Blueprint("messages", __name__)


@messages.route("/", methods=["GET"])
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
def create_message():
    data = request.get_json()

    try:
        message = DirectMessage(
            body=data["message"],
            message_read=False,
            sender_id=data["user_id"],
            recipient_id=data["recipient_id"],
            created_at=data.get("time"),
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

    res, res_msg = send_email(
        mentor.email,
        data={
            "response_email": mentee.email,
            "interest_areas": data.get("interest_areas", ""),
            "communication_method": data.get("communication_method", ""),
            "message": data.get("message", ""),
            "name": mentee.name,
        },
        template_id=MENTOR_CONTACT_ME,
    )
    if not res:
        msg = "Failed to send mentee email " + res_msg
        logger.info(msg)
        return create_response(status=500, message="Failed to send message")

    try:
        message = DirectMessage(
            body=data.get("message", "Hello"),
            message_read=False,
            sender_id=mentee_id,
            recipient_id=mentor_id,
            created_at=datetime.today().isoformat(),
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

    return create_response(status=200, message="successfully sent email message")


@messages.route("/contacts/<string:user_id>", methods=["GET"])
def get_sidebar(user_id):
    try:
        sentMessages = DirectMessage.objects.filter(
            Q(sender_id=user_id) | Q(recipient_id=user_id)
        ).order_by("-created_at")

        contacts = []
        sidebarContacts = set()
        for message in sentMessages:
            otherId = message["recipient_id"]

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

                contacts.append(sidebarObject)
                sidebarContacts.add(otherId)

        return create_response(data={"data": contacts}, status=200, message="res")
    except Exception as e:
        logger.info(e)
        return create_response(status=422, message=str(e))


@messages.route("/contacts/mentors/<int:pageNumber>", methods=["GET"])
def get_sidebar_mentors(pageNumber):
    searchTerm = request.args.get("searchTerm")
    searchTerm = unquote(searchTerm)
    startDate = request.args.get("startDate")
    endDate = request.args.get("endDate")
    pageSize = int(request.args.get("pageSize"))
    startRecord = pageSize * (pageNumber - 1)
    endRecord = pageSize * pageNumber
    mentors = MentorProfile.objects()
    detailMessages = []

    for mentor in list(mentors):
        user_id = mentor.id
        mentor_user = json.loads(mentor.to_json())
        try:
            sentMessages = (
                DirectMessage.objects.filter(
                    Q(sender_id=user_id) | Q(recipient_id=user_id)
                )
                .filter(
                    created_at__gte=datetime.fromisoformat(startDate),
                    created_at__lte=datetime.fromisoformat(endDate),
                )
                .order_by("-created_at")
            )
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
                otherUser = MenteeProfile.objects.get(id=contactId)
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

            try:
                latestMessage = [
                    messagee
                    for messagee in sentMessages
                    if (
                        messagee["recipient_id"] == contactId
                        or messagee["sender_id"] == contactId
                    )
                ][0]
            except:
                continue
            sidebarObject = {
                "otherId": str(contactId),
                "numberOfMessages": len(
                    [
                        messagee
                        for messagee in sentMessages
                        if (
                            messagee["recipient_id"] == contactId
                            or messagee["sender_id"] == contactId
                        )
                    ]
                ),
                "otherUser": otherUserObj,
                "latestMessage": json.loads(latestMessage.to_json()),
                "user": mentor_user,
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


@messages.route("/direct/", methods=["GET"])
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


@socketio.on("send")
def chat(msg, methods=["POST"]):
    try:
        message = DirectMessage(
            body=msg["body"],
            message_read=msg["message_read"],
            sender_id=msg["sender_id"],
            recipient_id=msg["recipient_id"],
            created_at=msg["time"],
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
