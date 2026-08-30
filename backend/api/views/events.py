from functools import wraps

from bson.errors import InvalidId
from flask import Blueprint, g, request
from mongoengine import ValidationError

from api.core import create_response, logger
from api.models import Event, Image
from api.utils.event_review_notifications import (
    EventReviewNotificationError,
    admin_event_notifications,
    event_review_recipient_options,
    mark_all_admin_event_notifications_read,
    mark_admin_event_notification_read,
    set_event_review_recipient_ids,
)
from api.utils.event_workflow import (
    EventWorkflowError,
    audience_preview,
    cancel_event,
    can_edit_event,
    can_view_event,
    create_event,
    list_events,
    publication_preview,
    publish_event,
    resolve_event_actor,
    review_event,
    serialize_event,
    serialize_events,
    submit_event,
    update_event,
)
from api.utils.constants import Account
from api.utils.require_auth import all_users
from api.utils.request_utils import imgur_client


event = Blueprint("event", __name__)


def _actor():
    return resolve_event_actor(getattr(g, "auth_claims", None) or {})


def _find_event(event_id):
    try:
        return Event.objects.get(id=event_id)
    except (Event.DoesNotExist, InvalidId, ValidationError):
        raise EventWorkflowError("Event not found", 404)


def _error_response(error):
    logger.info(error.message)
    return create_response(status=error.status, message=error.message)


def event_admin_only(fn):
    @all_users
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            role = int(g.auth_claims.get("role"))
        except (TypeError, ValueError):
            role = None
        if role != Account.ADMIN.value:
            return create_response(status=403, message="Forbidden")
        return fn(*args, **kwargs)

    return wrapper


@event.route("events/review-recipients", methods=["GET"])
@event_admin_only
def get_event_review_recipients():
    return create_response(data=event_review_recipient_options())


@event.route("events/review-recipients", methods=["PUT"])
@event_admin_only
def update_event_review_recipients():
    try:
        data = request.get_json() or {}
        options = set_event_review_recipient_ids(data.get("admin_ids"))
        return create_response(data=options)
    except EventReviewNotificationError as error:
        return _error_response(error)


@event.route("events/review-notifications", methods=["GET"])
@event_admin_only
def get_event_review_notifications():
    return create_response(data=admin_event_notifications(g.auth_claims.get("uid")))


@event.route("events/review-notifications/read", methods=["POST"])
@event_admin_only
def read_all_event_review_notifications():
    updated_count = mark_all_admin_event_notifications_read(g.auth_claims.get("uid"))
    return create_response(data={"updated_count": updated_count})


@event.route(
    "events/review-notifications/<string:notification_id>/read",
    methods=["POST"],
)
@event_admin_only
def read_event_review_notification(notification_id):
    try:
        notification = mark_admin_event_notification_read(
            g.auth_claims.get("uid"), notification_id
        )
        return create_response(data={"notification": notification})
    except EventReviewNotificationError as error:
        return _error_response(error)


@event.route("events", methods=["GET"])
@all_users
def get_events():
    try:
        actor = _actor()
        events = list_events(
            actor,
            view=request.args.get("view", "published"),
            status=request.args.get("status"),
        )
        lang = request.args.get("lang", "en-US")
        return create_response(data={"events": serialize_events(events, lang, actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/audience-preview", methods=["POST"])
@all_users
def preview_event_audience():
    try:
        return create_response(
            data={"preview": audience_preview(_actor(), request.get_json() or {})}
        )
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<role>", methods=["GET"])
@all_users
def get_legacy_events(role):
    try:
        actor = _actor()
        events = list_events(actor, view="published")
        lang = request.args.get("lang", "en-US")
        return create_response(data={"events": serialize_events(events, lang, actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<string:event_id>", methods=["PATCH", "POST"])
@all_users
def update_existing_event(event_id):
    try:
        actor = _actor()
        item = update_event(actor, _find_event(event_id), request.get_json() or {})
        return create_response(data={"event": serialize_event(item, actor=actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events", methods=["POST"])
@all_users
def create_new_event():
    try:
        actor = _actor()
        item = create_event(actor, request.get_json() or {})
        return create_response(
            status=201, data={"event": serialize_event(item, actor=actor)}
        )
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<string:event_id>/submit", methods=["POST"])
@all_users
def submit_existing_event(event_id):
    try:
        actor = _actor()
        item = submit_event(actor, _find_event(event_id))
        return create_response(data={"event": serialize_event(item, actor=actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<string:event_id>/review", methods=["POST"])
@all_users
def review_existing_event(event_id):
    try:
        actor = _actor()
        data = request.get_json() or {}
        item = review_event(
            actor,
            _find_event(event_id),
            decision=data.get("decision"),
            feedback=data.get("feedback"),
        )
        if data.get("decision") == "approve":
            item = publish_event(actor, item, bool(data.get("notify")))
        return create_response(data={"event": serialize_event(item, actor=actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<string:event_id>/publication-preview", methods=["GET"])
@all_users
def preview_event_publication(event_id):
    try:
        return create_response(
            data={"preview": publication_preview(_actor(), _find_event(event_id))}
        )
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<string:event_id>/publish", methods=["POST"])
@all_users
def publish_existing_event(event_id):
    try:
        actor = _actor()
        item = publish_event(
            actor,
            _find_event(event_id),
            bool((request.get_json() or {}).get("notify")),
        )
        return create_response(data={"event": serialize_event(item, actor=actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<string:event_id>/cancel", methods=["POST"])
@all_users
def cancel_existing_event(event_id):
    try:
        actor = _actor()
        item = cancel_event(actor, _find_event(event_id))
        return create_response(data={"event": serialize_event(item, actor=actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("event/<string:event_id>", methods=["GET"])
@all_users
def get_event_by_id(event_id):
    try:
        actor = _actor()
        item = _find_event(event_id)
        if not can_view_event(actor, item):
            raise EventWorkflowError("Forbidden", 403)
        return create_response(data={"event": serialize_event(item, actor=actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("events/<string:event_id>/image", methods=["PUT"])
@all_users
def upload_event_image(event_id):
    try:
        actor = _actor()
        item = _find_event(event_id)
        if not can_edit_event(actor, item):
            raise EventWorkflowError("Forbidden", 403)
        if item.status == "pending_review":
            raise EventWorkflowError("Pending events cannot be edited", 409)

        image = request.files["image"]
        image_response = imgur_client.send_image(image)
        old_hash = item.image_file.image_hash if item.image_file else None
        item.image_file = Image(
            url=image_response["data"]["link"],
            image_hash=image_response["data"]["deletehash"],
        )
        item.save()
        if old_hash:
            imgur_client.delete_image(old_hash)
        return create_response(message="Image upload successful")
    except EventWorkflowError as error:
        return _error_response(error)
    except (KeyError, TypeError) as error:
        logger.info(f"Event image upload failed: {error}")
        return create_response(status=400, message="Image upload failed")


# Temporary compatibility adapters for older clients. They use the same
# authorization and never publish or notify as a side effect of saving.
@event.route("event_register", methods=["POST"])
@all_users
def legacy_save_event():
    try:
        actor = _actor()
        data = request.get_json() or {}
        if data.get("hub_id") and not data.get("scope_type"):
            data["scope_type"] = "hub"
            data["scope_id"] = data["hub_id"]
        event_id = data.get("event_id")
        if event_id and event_id != 0 and str(event_id) != "0":
            item = update_event(actor, _find_event(str(event_id)), data)
        else:
            item = create_event(actor, data)
        return create_response(data={"event": serialize_event(item, actor=actor)})
    except EventWorkflowError as error:
        return _error_response(error)


@event.route("event_register/<string:event_id>/image", methods=["PUT"])
@all_users
def legacy_upload_event_image(event_id):
    return upload_event_image(event_id)


@event.route("events/delete/<string:event_id>", methods=["DELETE"])
@all_users
def legacy_delete_event(event_id):
    try:
        actor = _actor()
        cancel_event(actor, _find_event(event_id))
        return create_response(message="Event cancelled")
    except EventWorkflowError as error:
        return _error_response(error)
