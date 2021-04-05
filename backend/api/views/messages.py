from os import path
from flask import Blueprint, request, jsonify
from api.models import MentorProfile, MenteeProfile, Users, Message
from api.utils.request_utils import MessageForm, is_invalid_form
from api.core import create_response, serialize_list, logger
from api.models import db
from datetime import datetime


messages = Blueprint("messages", __name__)

@messages.route("/", methods=["GET"])
def get_messages():
    try:
        params = {}
        for arg in request.args:
            params[arg] = request.args.get(arg)
        messages = Message.objects(__raw__= params)
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


@messages.route("/<string:message_id>", methods=["PUT"]) #TODO:Make put request able to work with json
def update_message(message_id):
    try:
        message = Message.objects.get(id=message_id)
    except:
        msg = "Invalid message id"
        logger.info(msg)
        return create_response(status=422, message=msg)
    try:
        body = request.get_json()
        print(body)
        for field in body:
            message[field] = body[value]
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
