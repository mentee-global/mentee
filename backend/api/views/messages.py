from os import path
from flask import Blueprint, request, jsonify
from api.models import MentorProfile, MenteeProfile, Users, Message
from api.core import create_response, serialize_list, logger
from api.models import db
var mongoose = require('mongoose')
messages = Blueprint("messages", __name__)


@messages.route("/all", methods=["GET"])
def get_all_messages():
    try:
        messages = Message.objects()
    except:
        msg = "Failed to get messages"
        logger.info(msg)
        return create_response(status=422, message=msg)
    
@messages.route("/", methods=["POST"])
def create_message():
    data = request.json
    message = Message(message = data['message'], user_name = data['user_name'], user_id = mongoose.Types.ObjectId(data['user_id']), recipient_name = data['recipient_name'], recipient_id = mongoose.Types.ObjectId(data['recipient_id']), email = data['email'], link = data['link'], read = data['link'])
    try: 
        db['messages'].insert_one(data)
    except:
        msg = "Failed to save message"
        logger.info(msg)
        return create_response(status=422, message=msg)
    return data