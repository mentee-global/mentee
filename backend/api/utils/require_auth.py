from functools import wraps
from flask import Blueprint, request, jsonify
from firebase_admin import auth as firebase_auth
from api.core import create_response, serialize_list, logger


def admin_only(fn):
  @wraps(fn)
  def wrapper(*args, **kwargs):
    data = token.
    return fn(*args, **kwargs)
  
  return wrapper

def require_auth():
  pass