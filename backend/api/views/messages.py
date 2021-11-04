from os import path
from flask import Blueprint, request, jsonify
from api.models import MentorProfile, MenteeProfile, Users, Message
from api.utils.request_utils import MessageForm, is_invalid_form, send_email
from api.utils.constants import MENTOR_CONTACT_ME
from api.core import create_response, serialize_list, logger
from api.models import db
from datetime import datetime
from api import socketio
from flask_socketio import send, emit

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

@messages.route("/", methods=["PUT"])
def mark_as_read(sender_id, receiver_id):
    messages = Message.objects.get(user_id=sender_id, recipient_id=receiver_id)
    messages.find( { 'read': False } ).update( { '$set': { 'read': True } } )

@messages.route("/", methods=["POST"])
def create_message():
    data = request.get_json()
    validate_data = MessageForm.from_json(data)
    msg, is_invalid = is_invalid_form(validate_data)

    if is_invalid:
        return create_response(status=422, message=msg)
    try:
        message = Message(
            message=data.get("message"),
            user_name=data.get("user_name"),
            user_id=data.get("user_id"),
            recipient_name=data.get("recipient_name"),
            recipient_id=data.get("recipient_id"),
            email=data.get("email"),
            link=data.get("link"),
            time=datetime.strptime(data.get("time"), "%Y-%m-%d, %H:%M:%S%z"),
            # read=data.get("read"),
        )
    except:
        msg = "Invalid parameter provided"
        logger.info(msg)
        return create_response(status=422, message=msg)
    try:
        message.save()
    except:
        msg = "Failed to save message"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(
        status=201,
        message=f"Successfully saved message: {message.message} from user: {message.user_name} to: {message.recipient_name} sent on: {message.time}",
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
            "message": data.get("message", ""),
            "name": mentee.name,
        },
        template_id=MENTOR_CONTACT_ME,
    )
    if not res:
        msg = "Failed to send mentee email " + res_msg
        logger.info(msg)
        return create_response(status=500, message="Failed to send message")

    logger.info(
        f"Sending an email to {mentor.email} with message: {data.get('message', '')} as mentee {mentee.email}"
    )
    return create_response(status=200, message="successfully sent email message")


@socketio.on("message")
def handle_message(data):
    logger.info(data)




