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




@messages.route("/direct/", methods=["POST"])
def post_messages():
  data = request.get_json()
  for i in data:
      validate_data = DirectMessageForm.from_json(i)
      msg, is_invalid = is_invalid_form(validate_data)
      dm = DirectMessage(
          sender_id=i['sender_id']["$oid"],
          recipient_id=i['recipient_id']["$oid"],
          body=i['body'],
          created_at=datetime.now(),
          message_read=False,
      )
      dm.save()
      print('success')
