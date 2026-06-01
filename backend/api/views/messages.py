from flask import Blueprint, request, g
from firebase_admin import auth as firebase_admin_auth
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
from api.utils.direct_messages import (
    direct_message_display_user_or_placeholder,
    validate_direct_message_participants,
)
from api.utils.constants import (
    Account,
    MENTOR_CONTACT_ME,
    TRANSLATIONS,
    UNREAD_MESSAGE_TEMPLATE,
)
from api.utils.require_auth import all_users, hub_access_error
from api.utils.translate import get_translated_options
from api.core import create_response, logger
from api.utils.message_flagging import (
    SOURCE_DIRECT,
    SOURCE_GROUP,
    SOURCE_PARTNER_GROUP,
    build_direct_payload,
    build_group_payload,
    build_partner_group_payload,
    flag_pending_message_if_needed,
)
import json
from datetime import datetime, timedelta, timezone
from api import socketio
from mongoengine.queryset.visitor import Q
from bson import ObjectId
from bson.errors import InvalidId
from urllib.parse import unquote

messages = Blueprint("messages", __name__)
# Verified Firebase claims per Socket.IO session id, populated on connect.
# This is per-process state and assumes a single Socket.IO worker (the Procfile
# runs `gunicorn --workers 1 --worker-class eventlet`). If the app is ever
# scaled to multiple workers, connect and send can land in different processes
# and this must move to a shared store (e.g. Redis) alongside a SocketIO
# message_queue, or every cross-worker send will be rejected.
_SOCKET_AUTH_BY_SID = {}

# Roles with legitimate cross-user visibility into message history: the
# admin-only /messages-details console (ADMIN) and SUPPORT, which the auth layer
# already treats as a universal override. Everyone else may only read their own
# conversations.
_STAFF_ROLES = {Account.ADMIN.value, Account.SUPPORT.value}

_PROFILE_MODEL_BY_ROLE = {
    Account.MENTOR.value: MentorProfile,
    Account.MENTEE.value: MenteeProfile,
    Account.PARTNER.value: PartnerProfile,
}


def _profile_id_from_claims(claims):
    """Resolve (role, profile_id) from verified Firebase claims. The profile id
    is looked up by firebase_uid, so a caller can never assert an identity they
    do not own (we never trust profile ids supplied in the request as proof of
    access). Returns (role_int_or_None, profile_id_str_or_None)."""
    try:
        role = int(claims.get("role"))
    except (TypeError, ValueError):
        return None, None
    uid = claims.get("uid")
    model = _PROFILE_MODEL_BY_ROLE.get(role)
    if not uid or model is None:
        return role, None
    profile = model.objects(firebase_uid=uid).only("id").first()
    return role, (str(profile.id) if profile else None)


def _caller_role_and_profile_id():
    """Resolve the authenticated caller's (role, profile_id) from the verified
    Firebase claims stashed on `g` by verify_user."""
    return _profile_id_from_claims(getattr(g, "auth_claims", None) or {})


def _socket_role_and_profile_id():
    return _profile_id_from_claims(_SOCKET_AUTH_BY_SID.get(request.sid, {}))


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
        body = request.get_json(silent=True) or {}
        if not isinstance(body, dict):
            return create_response(status=422, message="Invalid message payload")
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
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return create_response(status=422, message="Invalid message payload")
    payload = build_direct_payload(data, body_key="message")
    held, flag, moderation_error = flag_pending_message_if_needed(
        source_type=SOURCE_DIRECT, payload=payload
    )
    if moderation_error:
        return create_response(
            status=503,
            message=f"Message could not be reviewed: {moderation_error}",
        )
    if held:
        return create_response(
            data={"flag_id": str(flag.id)},
            status=202,
            message="Message is pending admin review",
        )
    availabes_in_future = None
    if "availabes_in_future" in data:
        availabes_in_future = data.get("availabes_in_future")
    role, caller_id = _caller_role_and_profile_id()
    allowed, msg = validate_direct_message_participants(
        data.get("user_id"), data.get("recipient_id"), role, caller_id
    )
    if not allowed:
        return create_response(status=403 if msg == "Forbidden" else 422, message=msg)
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
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return create_response(status=422, message="Invalid message payload")
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

    payload = {
        "body": data.get("message", "Hello"),
        "message_read": False,
        "sender_id": mentee_id,
        "recipient_id": mentor_id,
        "created_at": datetime.utcnow().isoformat(),
    }
    held, flag, moderation_error = flag_pending_message_if_needed(
        source_type=SOURCE_DIRECT, payload=payload
    )
    if moderation_error:
        return create_response(
            status=503,
            message=f"Message could not be reviewed: {moderation_error}",
        )
    if held:
        return create_response(
            data={"flag_id": str(flag.id)},
            status=202,
            message="Message is pending admin review",
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
    except Exception as e:
        msg = "Invalid parameter provided"
        logger.info(e)
        return create_response(status=422, message=msg)
    try:
        message.save()
        socketio.emit(mentor_id, json.loads(message.to_json()))
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
    # Only the owner of the sidebar (or staff) may read it; otherwise any
    # authenticated user could enumerate another user's contacts and history.
    role, caller_id = _caller_role_and_profile_id()
    if role not in _STAFF_ROLES and caller_id != user_id:
        return create_response(status=403, message="Forbidden")
    try:
        sentMessages = DirectMessage.objects.filter(
            Q(recipient_id=user_id) | Q(sender_id=user_id)
        ).order_by("-created_at")

        # Walk the history exactly once (it is newest-first), collapsing it into
        # one entry per conversation. We deliberately do NOT serialize and
        # return the full message history here -- it grows unbounded with the
        # user's history and is not needed to render the conversation list.
        message_count_by_other_id = {}
        latest_message_by_other_id = {}
        ordered_other_ids = []
        for message in sentMessages:
            otherId = message["recipient_id"]
            if str(otherId) == user_id:
                otherId = message["sender_id"]

            message_count_by_other_id[otherId] = (
                message_count_by_other_id.get(otherId, 0) + 1
            )
            # First time we see a contact is its latest message (newest-first).
            if otherId not in latest_message_by_other_id:
                latest_message_by_other_id[otherId] = message
                ordered_other_ids.append(otherId)

        contacts = []
        for otherId in ordered_other_ids:
            latest_message = latest_message_by_other_id[otherId]
            # Always render the conversation. A counterpart whose profile no
            # longer resolves (deleted account) shows as a "Deleted Account"
            # placeholder so the owner keeps their history; the UI blocks
            # replying. Unread counting stays strict elsewhere, and a deleted
            # account's sent messages are marked read on deletion, so this does
            # not resurrect phantom unread emails.
            otherUserObj = direct_message_display_user_or_placeholder(otherId)

            sidebarObject = {
                "otherId": str(otherId),
                "message_read": latest_message["message_read"],
                "numberOfMessages": message_count_by_other_id[otherId],
                "otherUser": otherUserObj,
                "latestMessage": json.loads(latest_message.to_json()),
            }

            contacts.append(sidebarObject)

        return create_response(
            data={"data": contacts},
            status=200,
            message="res",
        )
    except Exception as e:
        logger.info(e)
        return create_response(status=422, message=str(e))


@messages.route("/contacts/mentors/<int:page_number>", methods=["GET"])
@all_users
def get_sidebar_mentors(page_number):
    # Staff-only oversight view: it returns every mentor<->mentee conversation's
    # latest message across the platform, so it must not be reachable by regular
    # authenticated users (the /messages-details console is admin-gated).
    role, _ = _caller_role_and_profile_id()
    if role not in _STAFF_ROLES:
        return create_response(status=403, message="Forbidden")

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
        sender_id = message_item.sender_id
        recipient_id = message_item.recipient_id

        if sender_id not in messages_by_sender_or_recipient:
            messages_by_sender_or_recipient[sender_id] = []
        messages_by_sender_or_recipient[sender_id].append(message_item)

        if recipient_id not in messages_by_sender_or_recipient:
            messages_by_sender_or_recipient[recipient_id] = []
        messages_by_sender_or_recipient[recipient_id].append(message_item)

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
            sent_messages = []
            if user_id in messages_by_sender_or_recipient:
                sent_messages = messages_by_sender_or_recipient[user_id]
        except:
            continue
        if len(sent_messages) == 0:
            continue
        contacts = []
        for message in sent_messages:
            # Handle ObjectId comparison properly
            if user_id == message.recipient_id:
                contacts.append(message.sender_id)
            elif user_id == message.sender_id:
                contacts.append(message.recipient_id)
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
                    messagee.recipient_id == contact_id
                    or messagee.sender_id == contact_id
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
                    msg for msg in conversation_messages if msg.sender_id == contact_id
                ]
                if not mentee_messages:
                    skip_conversation = True
                else:
                    latest_message = mentee_messages[0]

            elif view_mode == "mentor-to-mentee":
                mentor_messages = [
                    msg for msg in conversation_messages if msg.sender_id == user_id
                ]
                if not mentor_messages:
                    skip_conversation = True
                else:
                    latest_message = mentor_messages[0]

            elif view_mode == "mentors":
                # For mentors only, ensure the latest message is from mentor
                mentor_messages = [
                    msg for msg in conversation_messages if msg.sender_id == user_id
                ]
                if not mentor_messages:
                    skip_conversation = True
                else:
                    latest_message = mentor_messages[0]

            elif view_mode == "mentees":
                mentee_messages = [
                    msg for msg in conversation_messages if msg.sender_id == contact_id
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
            # Only the owning hub (or staff) may read a hub's group messages.
            err = hub_access_error(hub_user_id)
            if err:
                return err
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
        sender_id = request.args.get("sender_id")
        if (
            recipient_id == str(Account.MENTEE.value)
            or recipient_id == str(Account.MENTOR.value)
            or recipient_id == str(Account.PARTNER.value)
        ):
            msg = "Invalid parameters provided"
            logger.info(msg)
            return create_response(status=422, message=msg)

        # Only a participant in the conversation (or staff) may read it.
        role, caller_id = _caller_role_and_profile_id()
        if role not in _STAFF_ROLES and (
            caller_id is None or caller_id not in (sender_id, recipient_id)
        ):
            return create_response(status=403, message="Forbidden")

        # Both directions of the conversation between the two users.
        conversation = (Q(sender_id=sender_id) & Q(recipient_id=recipient_id)) | (
            Q(sender_id=recipient_id) & Q(recipient_id=sender_id)
        )

        # Always sort oldest->newest on (created_at, id). created_at is the
        # primary key; _id breaks ties so the order is total and deterministic
        # even when several messages share a created_at -- it is client-provided
        # and not guaranteed unique. Without an explicit order_by, Mongo returns
        # natural order, which used to coincide with insertion (chronological)
        # order only because the collection had no indexes. Once compound indexes
        # were added to DirectMessage, the planner began satisfying this $or via
        # index scans, returning rows in index order and breaking chronological
        # display.
        limit = request.args.get("limit", type=int)
        if not limit:
            # Full-thread fetch (default). Used for search deep-links that must
            # scroll to an arbitrary historical message, so the whole thread has
            # to be present on the client.
            messages = DirectMessage.objects(conversation).order_by("created_at", "id")
            return create_response(
                data={"Messages": messages, "has_more": False},
                status=200,
                message="Success",
            )

        # Paginated fetch: the newest `limit` messages, optionally older than the
        # (before, before_id) keyset cursor -- the (created_at, _id) of the oldest
        # message already on the client. The compound cursor is a strict bound so
        # a batch of messages sharing one created_at can never trap pagination on
        # the same boundary set. (A created_at-only cursor loops forever once more
        # than `limit` messages share the cursor timestamp: every page re-reads
        # the same tied rows and never advances, leaving older history
        # unreachable.) We probe one extra row to learn whether older rows exist.
        filters = conversation
        before = request.args.get("before")
        before_id = request.args.get("before_id")
        if before and before_id:
            try:
                before_dt = datetime.fromisoformat(before.replace("Z", "+00:00"))
                before_oid = ObjectId(before_id)
                older = Q(created_at__lt=before_dt) | (
                    Q(created_at=before_dt) & Q(id__lt=before_oid)
                )
                filters = conversation & older
            except (ValueError, TypeError, InvalidId):
                pass

        window = list(
            DirectMessage.objects(filters)
            .order_by("-created_at", "-id")
            .limit(limit + 1)
        )
        has_more = len(window) > limit
        page = window[:limit]
        # Reverse the newest-first window back to oldest->newest for display.
        page.reverse()

        # Cursor for the next (older) page: the (created_at, _id) of the oldest
        # message we are returning. created_at goes out as an ISO string the
        # client echoes back verbatim so we never depend on how $date serializes.
        next_before = None
        next_before_id = None
        if page:
            oldest = page[0]
            if oldest.created_at is not None:
                next_before = oldest.created_at.isoformat()
            next_before_id = str(oldest.id)

        return create_response(
            data={
                "Messages": page,
                "has_more": has_more,
                "next_before": next_before,
                "next_before_id": next_before_id,
            },
            status=200,
            message="Success",
        )
    except:
        msg = "Invalid parameters provided"
        logger.info(msg)
        return create_response(status=422, message=msg)


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
            payload = build_group_payload(msg)
            held, flag, moderation_error = flag_pending_message_if_needed(
                source_type=SOURCE_GROUP, payload=payload
            )
            if moderation_error:
                return {
                    "success": False,
                    "message": f"Message could not be reviewed: {moderation_error}",
                }
            if held:
                return {
                    "success": True,
                    "held": True,
                    "flag_id": str(flag.id),
                    "message": "Message is pending admin review",
                }
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
            payload = build_partner_group_payload(msg)
            held, flag, moderation_error = flag_pending_message_if_needed(
                source_type=SOURCE_PARTNER_GROUP, payload=payload
            )
            if moderation_error:
                return {
                    "success": False,
                    "message": f"Message could not be reviewed: {moderation_error}",
                }
            if held:
                return {
                    "success": True,
                    "held": True,
                    "flag_id": str(flag.id),
                    "message": "Message is pending admin review",
                }
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
        return {"success": False, "message": "Failed to send message"}

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
        return {"success": False, "message": "Failed to send message"}
    return {"success": True, "message": "successfully sent message"}


@socketio.on("connect")
def connect(auth=None):
    token = (auth or {}).get("token")
    if not token:
        logger.info("Rejected socket connection without auth token")
        return False
    try:
        claims = firebase_admin_auth.verify_id_token(token)
    except Exception as e:
        logger.info(f"Rejected socket connection: {e}")
        return False
    _SOCKET_AUTH_BY_SID[request.sid] = claims
    return True


@socketio.on("disconnect")
def disconnect():
    _SOCKET_AUTH_BY_SID.pop(request.sid, None)


@socketio.on("send")
def chat(msg, methods=["POST"]):
    try:
        role, caller_id = _socket_role_and_profile_id()
        allowed, validation_msg = validate_direct_message_participants(
            msg.get("sender_id"), msg.get("recipient_id"), role, caller_id
        )
        if not allowed:
            logger.info(f"Rejected socket message: {validation_msg}")
            return {"success": False, "message": validation_msg}

        payload = build_direct_payload(msg)
        held, flag, moderation_error = flag_pending_message_if_needed(
            source_type=SOURCE_DIRECT, payload=payload
        )
        if moderation_error:
            return {
                "success": False,
                "message": f"Message could not be reviewed: {moderation_error}",
            }
        if held:
            return {
                "success": True,
                "held": True,
                "flag_id": str(flag.id),
                "message": "Message is pending admin review",
            }

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

    except Exception as e:
        logger.info(e)
        return {"success": False, "message": "Failed to send message"}
    try:
        message.save()
        socketio.emit(msg["recipient_id"], json.loads(message.to_json()))
        msg = "successfully sent message"
    except:
        msg = "Error in meessage"
        logger.info(msg)
        return {"success": False, "message": "Failed to send message"}
    return {"success": True, "message": "successfully sent message"}


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
