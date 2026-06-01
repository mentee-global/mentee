from datetime import datetime

from bson.errors import InvalidId
from flask import Blueprint, g, request
from mongoengine.queryset.visitor import Q

from api.core import create_response, logger
from api.models import (
    Admin,
    DirectMessage,
    GroupMessage,
    MessageFlag,
    PartnerGroupMessage,
)
from api.utils.message_flagging import (
    SOURCE_DIRECT,
    SOURCE_GROUP,
    SOURCE_PARTNER_GROUP,
    deliver_flagged_message,
    hide_or_delete_original_message,
    original_message_for_flag,
    send_warning_to_sender,
    sender_label,
)
from api.utils.require_auth import admin_only

message_flags = Blueprint("message_flags", __name__)


def _date_arg(name):
    value = request.args.get(name)
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except (TypeError, ValueError):
        return None


def _flag_payload(flag):
    data = flag.to_mongo().to_dict()
    data["_id"] = {"$oid": str(data.pop("_id"))}
    for field in (
        "source_message_id",
        "sender_id",
        "recipient_id",
        "hub_user_id",
        "reviewed_by",
    ):
        if data.get(field):
            data[field] = {"$oid": str(data[field])}
    for field in (
        "created_at",
        "updated_at",
        "reviewed_at",
        "warning_sent_at",
        "original_created_at",
    ):
        if data.get(field):
            data[field] = {"$date": data[field].isoformat()}
    data["sender"] = sender_label(flag.sender_id)
    return data


def _admin_profile_id():
    claims = getattr(g, "auth_claims", None) or {}
    uid = claims.get("uid")
    if not uid:
        return None
    admin = Admin.objects(firebase_uid=uid).only("id").first()
    return admin.id if admin else None


def _context_for_flag(flag):
    if flag.source_type == SOURCE_DIRECT and flag.sender_id and flag.recipient_id:
        conversation = (
            Q(sender_id=flag.sender_id) & Q(recipient_id=flag.recipient_id)
        ) | (Q(sender_id=flag.recipient_id) & Q(recipient_id=flag.sender_id))
        return list(
            DirectMessage.objects(conversation).order_by("-created_at").limit(40)
        )

    if flag.source_type == SOURCE_GROUP and flag.hub_user_id:
        return list(
            GroupMessage.objects(hub_user_id=flag.hub_user_id, is_deleted__ne=True)
            .order_by("-created_at")
            .limit(40)
        )

    if flag.source_type == SOURCE_PARTNER_GROUP:
        return list(PartnerGroupMessage.objects().order_by("-created_at").limit(40))

    return []


@message_flags.route("/", methods=["GET"])
@admin_only
def list_message_flags():
    query = Q()
    status = request.args.get("status")
    severity = request.args.get("severity")
    source_type = request.args.get("source_type")
    origin = request.args.get("origin")
    search = (request.args.get("search") or "").strip()
    limit = min(request.args.get("limit", default=50, type=int), 100)
    page = max(request.args.get("page", default=1, type=int), 1)

    if status and status != "all":
        query &= Q(status=status)
    if severity and severity != "all":
        query &= Q(severity=severity)
    if source_type and source_type != "all":
        query &= Q(source_type=source_type)
    if origin and origin != "all":
        query &= Q(origin=origin)

    since = _date_arg("since")
    before = _date_arg("before")
    if since:
        query &= Q(created_at__gte=since)
    if before:
        query &= Q(created_at__lte=before)
    if search:
        query &= Q(body__icontains=search) | Q(reason__icontains=search)

    queryset = MessageFlag.objects(query).order_by("-created_at")
    total = queryset.count()
    flags = queryset.skip((page - 1) * limit).limit(limit)
    return create_response(
        data={
            "items": [_flag_payload(flag) for flag in flags],
            "total": total,
            "page": page,
            "limit": limit,
        }
    )


@message_flags.route("/<string:flag_id>", methods=["GET"])
@admin_only
def get_message_flag(flag_id):
    try:
        flag = MessageFlag.objects.get(id=flag_id)
    except Exception:
        return create_response(status=404, message="Message flag not found")

    original = original_message_for_flag(flag)
    context = _context_for_flag(flag)
    return create_response(
        data={
            "flag": _flag_payload(flag),
            "original_message": original,
            "context": context,
        }
    )


@message_flags.route("/<string:flag_id>/action", methods=["PUT"])
@admin_only
def update_message_flag_action(flag_id):
    try:
        flag = MessageFlag.objects.get(id=flag_id)
    except Exception:
        return create_response(status=404, message="Message flag not found")

    body = request.get_json(silent=True) or {}
    action = body.get("action")
    note = (body.get("note") or "").strip()
    reviewed_by = _admin_profile_id()

    try:
        if action == "allow":
            if not flag.source_message_id:
                deliver_flagged_message(flag)
                flag.reload()
            flag.status = "allowed"
        elif action == "dismiss":
            flag.status = "dismissed"
        elif action in {"hide", "delete"}:
            hide_or_delete_original_message(flag)
            flag.status = "hidden" if action == "hide" else "deleted"
        elif action == "warn":
            ok, err = send_warning_to_sender(flag, note=note)
            if not ok:
                return create_response(status=422, message=err)
        else:
            return create_response(status=422, message="Invalid action")

        if action != "warn":
            flag.reviewed_at = datetime.utcnow()
            flag.reviewed_by = reviewed_by
        flag.action_notes = note or flag.action_notes
        flag.updated_at = datetime.utcnow()
        flag.save()
    except InvalidId:
        return create_response(status=422, message="Invalid message id")
    except Exception as exc:
        logger.exception("message flag action failed")
        return create_response(status=500, message=str(exc))

    return create_response(data={"flag": _flag_payload(flag)}, message="Success")
