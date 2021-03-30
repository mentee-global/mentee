from os import path
from flask import Blueprint, request, jsonify
from api.models import MentorProfile, MenteeProfile, Users, Message
from api.utils.request_utils import MessageForm, is_invalid_form
from api.core import create_response, serialize_list, logger
from api.models import db
from datetime import datetime


messages = Blueprint("messages", __name__)


@messages.route("/all", methods=["GET"])
def get_all_messages():
    try:
        messages = Message.objects()
    except:
        msg = "Failed to get messages"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"Messages": messages}, status=200, message="Success")


@messages.route("/<string:message_id>", methods=["GET"])
def get_message(message_id):
    try:
        message = Message.objects.get(id=message_id)
    except:
        msg = "Failed to get message"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"Message": message}, status=200, message="Success")


@messages.route("/from=<string:sender_username>", methods=["GET"])
def get_all_messages_from_user(sender_username):
    try:
        messages = Message.objects.get(user_name=sender_username)
    except:
        msg = "Failed to get messages"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"Messages": messages}, status=200, message="Success")


@messages.route("/from_id=<string:sender_id>", methods=["GET"])
def get_all_messages_from_user_id(sender_id):
    try:
        messages = Message.objects.get(user_id=sender_id)
    except:
        msg = "Failed to get messages"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"Messages": messages}, status=200, message="Success")


@messages.route("/to=<string:recipient_username>", methods=["GET"])
def get_all_messages_to_user(recipient_username):
    try:
        messages = Message.objects.get(recipient_name=recipient_username)
    except:
        msg = "Failed to get messages"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"Messages": messages}, status=200, message="Success")


@messages.route("/to_id=<string:recipient_id>", methods=["GET"])
def get_all_messages_to_user_id(recipient_id):
    try:
        messages = Message.objects.get(recipient_id=recipient_id)
    except:
        msg = "Failed to get messages"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return create_response(data={"Messages": messages}, status=200, message="Success")


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


@messages.route("/<string:message_id>/<field>:<value>", methods=["PUT"])
def update_message(message_id, field, value):
    try:
        message = Message.objects.get(id=message_id)
    except:
        msg = "Invalid message id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    try:
        message[field] = value
        message.save()
        return create_response(
            status=200,
            message=f"message_id: {message_id} field: {field} updated with: {value}",
        )
    except:
        msg = "Failed to update message"
        logger.info(msg)
        return create_response(status=422, message=msg)


@messages.route("/", methods=["POST"])
def create_message():
    data = request.get_json()
    validate_data = MessageForm.from_json(data)
    msg, is_invalid = is_invalid_form(validate_data)

    if is_invalid:
        return create_response(status=422, message=msg)
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
