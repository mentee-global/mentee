from datetime import datetime
from flask import Blueprint, request, jsonify
from api.models import AppointmentRequest, MentorProfile
from api.core import create_response, serialize_list, logger
from api.utils.request_utils import ApppointmentForm

#download all appointments
@appointment.route("/download/all", methods=["GET"])
def download_appointments():
    try:
        appointments = AppointmentRequest.objects()
    except:
        msg = "Failed to get appointments"
        logger.info(msg)
        return create_response(status=422, message=msg)
    if not appointments:
        return jsonify({'error': 'appointments not found'})
    else:
        return jsonify(user.to_json())