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
from api.utils.constants import (
    Account,
    MENTOR_CONTACT_ME,
    TRANSLATIONS,
    UNREAD_MESSAGE_TEMPLATE,
)
from api.utils.require_auth import all_users
from api.utils.validation_schemas import validate_json_schema, MessageSchema
from api.utils.secure_queries import sanitize_query, validate_object_id
from api.utils.translate import get_translated_options
from api.core import create_response, logger
import json
from datetime import datetime, timedelta, timezone
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
@validate_json_schema(MessageSchema)
def create_message(validated_data):
    """Create a new direct message with comprehensive validation."""
    try:
        # Validate recipient and sender IDs
        sender_id = validate_object_id(validated_data["sender_id"])
        recipient_id = validate_object_id(validated_data["recipient_id"])
        
        if not sender_id or not recipient_id:
            return create_response(status=400, message="Invalid sender or recipient ID")
        
        # Additional business logic validation
        if str(sender_id) == str(recipient_id):
            return create_response(status=400, message="Cannot send message to yourself")
        
        # Create message with validated data
        message = DirectMessage(
            body=validated_data["body"],
            message_read=False,
            sender_id=str(sender_id),
            recipient_id=str(recipient_id),
            created_at=validated_data.get("created_at"),
            availabes_in_future=validated_data.get("availabes_in_future"),
        )
        
        # Save message
        message.save()
        
        # Emit socket event with sanitized data
        sanitized_data = {
            "body": message.body,
            "sender_id": str(message.sender_id),
            "recipient_id": str(message.recipient_id),
            "created_at": message.created_at,
            "message_read": message.message_read
        }
        socketio.emit(str(recipient_id), sanitized_data)
        
        logger.info(f"Message created successfully from {sender_id} to {recipient_id}")
        return create_response(
            data={"message": sanitized_data},
            message="Message sent successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to create message: {str(e)}")
        return create_response(status=500, message="Failed to send message")

    email_sent_status = ""
    try:
        recipient = PartnerProfile.objects.get(id=data["recipient_id"])
        res, res_msg = send_email(
            recipient.email,
            data={
                "number_unread": "1",
                recipient.preferred_language: True,
                "subject": TRANSLATIONS[recipient.preferred_language]["unread_message"],
            },
            template_id=UNREAD_MESSAGE_TEMPLATE,
        )
        print("send mail status message----------", res_msg)
        logger.info(res_msg)
    except:
        email_sent_status = ", But failed to send message"

    print("email_sent_status", email_sent_status)
    return create_response(
        status=201,
        message=f"Successfully saved message" + email_sent_status,
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

        print("send messages", len(sentMessages))

        contacts = []
        sidebarContacts = set()
        search_user_ids = set()
        for message in sentMessages:
            otherId = message["recipient_id"]
            message_read = message["message_read"]

            if str(otherId) == user_id:
                otherId = message["sender_id"]

            if otherId not in sidebarContacts and otherId not in search_user_ids:
                otherUser = None
                user_type = Account.MENTOR.value
                print("otherId", otherId)
                search_user_ids.add(otherId)
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
                        pass
                if otherUser:
                    otherUser = json.loads(otherUser.to_json())
                    if user_type == Account.PARTNER.value:
                        if "organization" in otherUser:
                            otherUserObj = {
                                "name": otherUser["organization"],
                                "user_type": user_type,
                            }
                        else:
                            otherUserObj = {
                                "name": otherUser["title"],
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


@messages.route("/contacts/mentors/<int:page_number>", methods=["GET"])
@all_users
def get_sidebar_mentors(page_number):
    partner_id = request.args.get("partner_id", "no-affiliation")
    view_mode = request.args.get("view_mode", "all")
    search_term = request.args.get("searchTerm", "")
    start_date = request.args.get("startDate", "")
    end_date = request.args.get("endDate", "")
    page_size = request.args.get("pageSize", 20, type=int)

    start_record = page_size * (page_number - 1)
    end_record = page_size * page_number

    if partner_id == "all":
        mentors = MentorProfile.objects()
    elif partner_id == "all-partners":
        all_partners = PartnerProfile.objects()
        mentor_ids = set()

        for partner in all_partners:
            if partner.assign_mentors:
                for mentor_data in partner.assign_mentors:
                    mentor_ids.add(mentor_data["id"])

        if mentor_ids:
            mentors = MentorProfile.objects(id__in=list(mentor_ids))
        else:
            mentors = MentorProfile.objects(id=None)
    elif partner_id == "no-affiliation":
        all_partners = PartnerProfile.objects()
        mentor_ids = set()

        for partner in all_partners:
            if partner.assign_mentors:
                for mentor_data in partner.assign_mentors:
                    mentor_ids.add(mentor_data["id"])

        if mentor_ids:
            mentors = MentorProfile.objects(id__nin=list(mentor_ids))
        else:
            mentors = MentorProfile.objects()
    else:
        partner = PartnerProfile.objects(id=partner_id).first()
        if partner and partner.assign_mentors:
            mentor_ids = [mentor_data["id"] for mentor_data in partner.assign_mentors]
            mentors = MentorProfile.objects(id__in=mentor_ids)
        else:
            mentors = MentorProfile.objects(id=None)

    detail_messages = []

    message_filter = {}
    if start_date and end_date:
        try:
            message_filter = {
                "created_at__gte": datetime.fromisoformat(
                    start_date.replace("Z", "+00:00")
                ),
                "created_at__lte": datetime.fromisoformat(
                    end_date.replace("Z", "+00:00")
                ),
            }
        except (ValueError, TypeError):
            pass

    all_messages = DirectMessage.objects.filter(**message_filter).order_by(
        "-created_at"
    )

    messages_by_sender_or_recipient = {}

    for message_item in all_messages:
        if message_item.sender_id not in messages_by_sender_or_recipient:
            messages_by_sender_or_recipient[message_item.sender_id] = []
        messages_by_sender_or_recipient[message_item.sender_id].append(message_item)
        if message_item.recipient_id not in messages_by_sender_or_recipient:
            messages_by_sender_or_recipient[message_item.recipient_id] = []
        messages_by_sender_or_recipient[message_item.recipient_id].append(message_item)

    if partner_id == "all":
        all_mentees = MenteeProfile.objects()
    elif partner_id == "all-partners":
        all_partners = PartnerProfile.objects()
        mentee_ids = set()

        for partner in all_partners:
            if partner.assign_mentees:
                for mentee_data in partner.assign_mentees:
                    mentee_ids.add(mentee_data["id"])

        if mentee_ids:
            all_mentees = MenteeProfile.objects(id__in=list(mentee_ids))
        else:
            all_mentees = MenteeProfile.objects(id=None)
    elif partner_id == "no-affiliation":
        all_partners = PartnerProfile.objects()
        mentee_ids = set()

        for partner in all_partners:
            if partner.assign_mentees:
                for mentee_data in partner.assign_mentees:
                    mentee_ids.add(mentee_data["id"])

        if mentee_ids:
            all_mentees = MenteeProfile.objects(id__nin=list(mentee_ids))
        else:
            all_mentees = MenteeProfile.objects()
    else:
        partner = PartnerProfile.objects(id=partner_id).first()
        if partner and partner.assign_mentees:
            mentee_ids = [mentee_data["id"] for mentee_data in partner.assign_mentees]
            all_mentees = MenteeProfile.objects(id__in=mentee_ids)
        else:
            all_mentees = MenteeProfile.objects(id=None)

    mentees_by_id = {}
    for mentee_item in all_mentees:
        mentees_by_id[mentee_item.id] = mentee_item

    current_time = datetime.now(timezone.utc)
    hours_72 = timedelta(hours=72)

    for mentor in list(mentors):
        user_id = mentor.id
        mentor_user = json.loads(mentor.to_json())
        try:
            sent_messages = ()
            if user_id in messages_by_sender_or_recipient:
                sent_messages = messages_by_sender_or_recipient[user_id]
        except:
            continue
        if len(sent_messages) == 0:
            continue
        contacts = []
        for message in sent_messages:
            if str(user_id) == message["recipient_id"]:
                contacts.append(message["sender_id"])
            else:
                contacts.append(message["recipient_id"])
        contacts = list(dict.fromkeys(contacts))
        for contact_id in contacts:
            try:
                other_user = mentees_by_id[contact_id]
            except:
                continue
            other_user_obj = {
                "name": other_user["name"],
                "user_type": Account.MENTEE.value,
            }
            if "image" in other_user:
                other_user_obj["image"] = other_user["image"]["url"]
            else:
                other_user_obj["image"] = ""

            if "pair_partner" in other_user:
                other_user_obj["pair_partner"] = other_user["pair_partner"]

            conversation_messages = [
                messagee
                for messagee in sent_messages
                if (
                    messagee["recipient_id"] == contact_id
                    or messagee["sender_id"] == contact_id
                )
            ]

            if len(conversation_messages) == 0:
                continue

            # Sort messages by creation time (newest first)
            conversation_messages.sort(key=lambda x: x["created_at"], reverse=True)

            latest_message = conversation_messages[0]

            # Parse the datetime from the message
            try:
                if (
                    isinstance(latest_message["created_at"], dict)
                    and "$date" in latest_message["created_at"]
                ):
                    date_str = latest_message["created_at"]["$date"]
                    if isinstance(date_str, int):
                        latest_message_date = datetime.fromtimestamp(
                            date_str / 1000, tz=timezone.utc
                        )
                    else:
                        if "Z" in date_str:
                            date_str = date_str.replace("Z", "+00:00")
                        latest_message_date = datetime.fromisoformat(date_str)
                else:
                    latest_message_date = latest_message["created_at"]
                    if not latest_message_date.tzinfo:
                        latest_message_date = latest_message_date.replace(
                            tzinfo=timezone.utc
                        )
            except Exception as e:
                logger.error(f"Error parsing date: {e}")
                # Default to current time if parsing fails
                latest_message_date = current_time
                has_unanswered_messages = False
                continue

            has_unanswered_messages = False

            time_difference = current_time - latest_message_date

            has_unanswered_messages = time_difference > hours_72

            skip_conversation = False

            if view_mode == "mentee-to-mentor":
                mentee_messages = [
                    msg
                    for msg in conversation_messages
                    if msg["sender_id"] == contact_id
                ]
                if not mentee_messages:
                    skip_conversation = True
                else:
                    latest_message = mentee_messages[0]

            elif view_mode == "mentor-to-mentee":
                mentor_messages = [
                    msg
                    for msg in conversation_messages
                    if msg["sender_id"] == str(user_id)
                ]
                if not mentor_messages:
                    skip_conversation = True
                else:
                    latest_message = mentor_messages[0]

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
                    latest_message = mentor_messages[0]

            elif view_mode == "mentees":
                mentee_messages = [
                    msg
                    for msg in conversation_messages
                    if msg["sender_id"] == contact_id
                ]
                if not mentee_messages:
                    skip_conversation = True
                else:
                    latest_message = mentee_messages[0]

            if skip_conversation:
                continue

            sidebar_object = {
                "otherId": str(contact_id),
                "numberOfMessages": len(conversation_messages),
                "otherUser": other_user_obj,
                "latestMessage": json.loads(latest_message.to_json()),
                "user": mentor_user,
                "hasUnansweredMessages": has_unanswered_messages,
            }

            detail_messages.append(sidebar_object)

    formatted_data = []
    for subitem in detail_messages:
        mentee_name = subitem["otherUser"]["name"].lower()
        mentor_name = subitem["user"]["name"].lower()
        if search_term.lower() in mentor_name or search_term.lower() in mentee_name:
            formatted_data.append(subitem)

    sorted_data = sorted(
        formatted_data,
        key=lambda x: x["latestMessage"]["created_at"]["$date"],
        reverse=True,
    )

    sorted_data = sorted_data[start_record:end_record]
    total_length = len(formatted_data)

    return create_response(
        data={"data": sorted_data, "total_length": total_length},
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
        recipient_id = request.args.get("recipient_id")
        if (
            recipient_id == str(Account.MENTEE.value)
            or recipient_id == str(Account.MENTOR.value)
            or recipient_id == str(Account.PARTNER.value)
        ):
            msg = "Invalid parameters provided"
            logger.info(msg)
            return create_response(status=422, message=msg)
        else:
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
