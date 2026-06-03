import json

from bson import ObjectId
from bson.errors import InvalidId
from mongoengine.queryset.visitor import Q

from api.models import DirectMessage, MenteeProfile, MentorProfile, PartnerProfile
from api.utils.constants import Account

DIRECT_MESSAGE_PROFILE_ROLES = {
    Account.MENTOR.value,
    Account.MENTEE.value,
    Account.PARTNER.value,
}


def resolve_direct_message_user(profile_id):
    """Return a sidebar-compatible profile tuple for a direct-message user."""
    for model, user_type in (
        (MentorProfile, Account.MENTOR.value),
        (PartnerProfile, Account.PARTNER.value),
        (MenteeProfile, Account.MENTEE.value),
    ):
        profile = model.objects(id=profile_id).first()
        if profile:
            return profile, user_type
    return None, None


def direct_message_display_user(profile, user_type):
    profile_json = json.loads(profile.to_json())
    if user_type == Account.PARTNER.value:
        name = profile_json.get("organization") or profile_json.get("title")
    else:
        name = profile_json.get("name")

    display_user = {
        "name": name,
        "user_type": user_type,
    }

    image = profile_json.get("image")
    if image and "url" in image:
        display_user["image"] = image["url"]

    return display_user


DELETED_ACCOUNT_NAME = "Deleted Account"


def direct_message_display_user_or_placeholder(profile_id):
    """Display object for a DM counterpart, falling back to a 'Deleted Account'
    placeholder (deleted=True) when the profile no longer resolves. Lets the
    conversation keep rendering so the other party retains their history while
    the UI blocks replying to a deleted account."""
    profile, user_type = resolve_direct_message_user(profile_id)
    if profile:
        user = direct_message_display_user(profile, user_type)
        user["deleted"] = False
        return user
    return {"name": DELETED_ACCOUNT_NAME, "user_type": None, "deleted": True}


def visible_unread_direct_message_sender_ids(recipient_id):
    """Unread sender ids whose profiles can be rendered in the DM sidebar."""
    sender_ids = []
    seen = set()
    for message in DirectMessage.objects(
        Q(recipient_id=recipient_id) & Q(message_read=False)
    ):
        sender_id = str(message.sender_id)
        if sender_id in seen:
            continue
        sender, _ = resolve_direct_message_user(message.sender_id)
        if not sender:
            continue
        seen.add(sender_id)
        sender_ids.append(message.sender_id)
    return sender_ids


def visible_unread_direct_message_count(recipient_id):
    return len(visible_unread_direct_message_sender_ids(recipient_id))


def direct_message_recipient(recipient_id):
    return resolve_direct_message_user(ObjectId(recipient_id))[0]


def resolve_message_profile_id(profile_id):
    try:
        oid = ObjectId(str(profile_id))
    except (InvalidId, TypeError):
        return None, None
    return resolve_direct_message_user(oid)


def validate_direct_message_participants(sender_id, recipient_id, role, caller_id):
    if not sender_id or not recipient_id:
        return False, "Missing sender or recipient"
    if role not in DIRECT_MESSAGE_PROFILE_ROLES or caller_id != str(sender_id):
        return False, "Forbidden"
    if not resolve_message_profile_id(sender_id)[0]:
        return False, "Invalid sender"
    if not resolve_message_profile_id(recipient_id)[0]:
        return False, "Invalid recipient"
    return True, None
