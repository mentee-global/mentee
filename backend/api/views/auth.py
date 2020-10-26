from flask import Blueprint, request, jsonify
from api.models import db
from api.core import create_response, serialize_list, logger
import requests

auth = Blueprint("auth", __name__)  # initialize blueprint
