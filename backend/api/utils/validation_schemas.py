from marshmallow import Schema, fields, validate, ValidationError, pre_load, post_load
from datetime import datetime
import bleach
import re
from typing import Dict, Any, List
from api.core import logger
from api.utils.constants import Account

ALLOWED_HTML_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a']
ALLOWED_HTML_ATTRIBUTES = {'a': ['href', 'title']}

ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
MAX_FILE_SIZE = 10 * 1024 * 1024

class BaseSchema(Schema):
    @pre_load
    def sanitize_inputs(self, in_data, **kwargs):
        if isinstance(in_data, dict):
            return self._sanitize_dict(in_data)
        return in_data

    def _sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = self._sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_string(item) if isinstance(item, str) 
                    else self._sanitize_dict(item) if isinstance(item, dict) 
                    else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        return sanitized

    def _sanitize_string(self, value: str) -> str:
        if not value:
            return value
        value = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x84\x86-\x9f]', '', value)
        value = re.sub(r'[{}$]', '', value)
        value = bleach.clean(value, tags=[], attributes={}, strip=True)
        return value.strip()

class AvailabilitySchema(BaseSchema):
    start_time = fields.DateTime(required=True, format='iso')
    end_time = fields.DateTime(required=True, format='iso')

    @post_load
    def validate_time_range(self, data, **kwargs):
        if data['end_time'] <= data['start_time']:
            raise ValidationError('End time must be after start time')
        now = datetime.utcnow()
        if data['start_time'] < now:
            raise ValidationError('Appointment cannot be scheduled in the past')
        duration = data['end_time'] - data['start_time']
        if duration.total_seconds() < 900:
            raise ValidationError('Appointment must be at least 15 minutes long')
        if duration.total_seconds() > 14400:
            raise ValidationError('Appointment cannot be longer than 4 hours')
        return data

class AppointmentSchema(BaseSchema):
    mentor_id = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    mentee_id = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    topic = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    message = fields.Str(required=False, validate=validate.Length(max=2000))
    status = fields.Str(
        required=True, 
        validate=validate.OneOf(["pending", "accepted", "denied", "rejected", "completed", "cancelled"])
    )
    allow_texts = fields.Boolean(required=True)
    allow_calls = fields.Boolean(required=True)
    timeslot = fields.Nested(AvailabilitySchema, required=True)

class MessageSchema(BaseSchema):
    body = fields.Str(required=True, validate=validate.Length(min=1, max=5000))
    recipient_id = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    sender_id = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    message_type = fields.Str(
        required=False, 
        validate=validate.OneOf(["text", "system", "notification"]),
        missing="text"
    )

    @pre_load
    def sanitize_message_body(self, in_data, **kwargs):
        if 'body' in in_data and isinstance(in_data['body'], str):
            in_data['body'] = bleach.clean(
                in_data['body'], 
                tags=ALLOWED_HTML_TAGS, 
                attributes=ALLOWED_HTML_ATTRIBUTES,
                strip=True
            )
        return super().sanitize_inputs(in_data, **kwargs)

class UserProfileSchema(BaseSchema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    phone = fields.Str(required=False, validate=validate.Regexp(r'^\+?[\d\s\-\(\)]{10,20}$'))
    bio = fields.Str(required=False, validate=validate.Length(max=2000))
    languages = fields.List(fields.Str(validate=validate.Length(min=1, max=50)), required=False)
    specializations = fields.List(fields.Str(validate=validate.Length(min=1, max=100)), required=False)

class MentorApplicationSchema(BaseSchema):
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    cell_number = fields.Str(required=True, validate=validate.Regexp(r'^\+?[\d\s\-\(\)]{10,20}$'))
    hear_about_us = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    employer_name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    role_description = fields.Str(required=True, validate=validate.Length(min=10, max=1000))
    languages = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    referral = fields.Str(required=False, validate=validate.Length(max=200))
    knowledge_location = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    identify = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    past_live_location = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    role = fields.Str(required=True, validate=validate.OneOf([str(Account.MENTOR.value)]))

class MenteeApplicationSchema(BaseSchema):
    email = fields.Email(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    immigrant_status = fields.List(fields.Str(validate=validate.Length(min=1, max=100)), required=True)
    identify = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    language = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    topics = fields.List(fields.Str(validate=validate.Length(min=1, max=100)), required=True)
    workstate = fields.List(fields.Str(validate=validate.Length(min=1, max=100)), required=True)
    is_social = fields.Str(required=True, validate=validate.OneOf(["yes", "no"]))
    role = fields.Str(required=True, validate=validate.OneOf([str(Account.MENTEE.value)]))

class FileUploadSchema(BaseSchema):
    filename = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    content_type = fields.Str(required=True)
    file_size = fields.Integer(required=True, validate=validate.Range(min=1, max=MAX_FILE_SIZE))

    @post_load
    def validate_file_type(self, data, **kwargs):
        content_type = data['content_type']
        filename = data['filename']
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        if content_type in ALLOWED_IMAGE_TYPES:
            if extension not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                raise ValidationError('File extension does not match content type')
        elif content_type in ALLOWED_DOCUMENT_TYPES:
            if extension not in ['pdf', 'txt', 'doc', 'docx']:
                raise ValidationError('File extension does not match content type')
        else:
            raise ValidationError(f'File type {content_type} not allowed')
        return data

class EventSchema(BaseSchema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(required=True, validate=validate.Length(min=1, max=2000))
    start_date = fields.DateTime(required=True, format='iso')
    end_date = fields.DateTime(required=True, format='iso')
    location = fields.Str(required=False, validate=validate.Length(max=300))
    max_attendees = fields.Integer(required=False, validate=validate.Range(min=1, max=10000))

    @post_load
    def validate_event_dates(self, data, **kwargs):
        if data['end_date'] <= data['start_date']:
            raise ValidationError('End date must be after start date')
        return data

def validate_json_schema(schema_class):
    def decorator(f):
        from functools import wraps
        from flask import request
        from api.core import create_response

        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                json_data = request.get_json()
                if json_data is None:
                    return create_response(
                        status=400, 
                        message="Invalid JSON payload or Content-Type not set to application/json"
                    )
                schema = schema_class()
                validated_data = schema.load(json_data)
                logger.info(f"Input validation successful for {f.__name__}")
                kwargs['validated_data'] = validated_data
                return f(*args, **kwargs)
            except ValidationError as e:
                logger.warning(f"Input validation failed for {f.__name__}: {e.messages}")
                return create_response(
                    status=400,
                    message="Input validation failed",
                    data={"errors": e.messages}
                )
            except Exception as e:
                logger.error(f"Unexpected error during validation for {f.__name__}: {str(e)}")
                return create_response(
                    status=500,
                    message="Internal validation error"
                )
        return decorated_function
    return decorator
