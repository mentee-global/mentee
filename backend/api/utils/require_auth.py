from functools import wraps
from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_admin_auth
from api.utils.firebase import client as firebase_auth
from api.core import create_response, serialize_list, logger


def admin_only(fn):
  @wraps(fn)
  def wrapper(*args, **kwargs):
    data = request.json
    token = data.get('token')
    claims = firebase_admin_auth.verify_id_token(token);
    role = claims['role']

    if role == 'admin':
      return fn(*args, **kwargs)
    
    msg = "Unauthorized"
    logger.info(msg)
    return create_response(status=401, message=msg)
  
  return wrapper