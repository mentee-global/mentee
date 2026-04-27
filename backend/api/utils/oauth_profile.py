"""DTO assembler for GET /oauth/profile.

Builds the curated v1 profile payload described in
docs/oauth/04-mentee-api-profile.md §3 from MenteeProfile, MenteeApplication,
MentorProfile (for the assigned mentor's name), and PartnerProfile (for the
organization when stored as an ObjectId FK).

Invariants:
- Never returns null. Keys whose value is empty/None are omitted so the
  payload shape matches the /oauth/userinfo contract.
- Never leaks fields flagged as excluded in the plan (phone_number, raw
  ObjectIds, media URLs, internal state, intake workflow state, settings).
"""

import datetime

from bson import ObjectId
from bson.errors import InvalidId

from api.models import (
    MenteeApplication,
    MenteeProfile,
    MentorProfile,
    PartnerProfile,
    Users,
)


class ProfileNotFound(Exception):
    """Raised when the token's user is not a mentee or no longer exists."""


_MENTEE_ROLE = 2

_LANGUAGE_TO_BCP47 = {
    "english": "en",
    "spanish": "es",
    "portuguese": "pt",
    "french": "fr",
    "german": "de",
    "italian": "it",
    "mandarin": "zh",
    "chinese": "zh",
    "arabic": "ar",
    "russian": "ru",
    "japanese": "ja",
    "korean": "ko",
    "hindi": "hi",
}


def _normalize_language(value):
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    return _LANGUAGE_TO_BCP47.get(trimmed.lower(), trimmed)


def _looks_like_object_id(value) -> bool:
    if not isinstance(value, str) or len(value) != 24:
        return False
    try:
        ObjectId(value)
    except (InvalidId, TypeError):
        return False
    return True


def _resolve_organization(raw):
    if not raw:
        return None
    if _looks_like_object_id(raw):
        partner = PartnerProfile.objects(id=raw).first()
        if partner is not None:
            name = getattr(partner, "organization", None) or getattr(
                partner, "person_name", None
            )
            if name:
                out = {"id": str(partner.id), "name": name}
                topics = getattr(partner, "topics", None)
                if isinstance(topics, str) and topics.strip():
                    out["topics"] = topics.strip()
                return out
    if isinstance(raw, str) and raw.strip():
        return {"name": raw.strip()}
    return None


def _resolve_mentor(raw):
    if not raw or not _looks_like_object_id(raw):
        return None
    mentor = MentorProfile.objects(id=raw).first()
    if mentor is None:
        return None
    name = getattr(mentor, "name", None)
    if not name:
        return None
    out = {"id": str(mentor.id), "name": name}
    title = getattr(mentor, "professional_title", None)
    if isinstance(title, str) and title.strip():
        out["professional_title"] = title.strip()
    specializations = [
        s
        for s in (getattr(mentor, "specializations", None) or [])
        if isinstance(s, str) and s
    ]
    if specializations:
        out["specializations"] = specializations
    languages = [
        normalized
        for normalized in (
            _normalize_language(lang)
            for lang in (getattr(mentor, "languages", None) or [])
        )
        if normalized
    ]
    if languages:
        out["languages"] = languages
    return out


def _education_entries(raw_list):
    out = []
    for entry in raw_list or []:
        item = {}
        level = getattr(entry, "education_level", None)
        school = getattr(entry, "school", None)
        majors = list(getattr(entry, "majors", []) or [])
        graduation_year = getattr(entry, "graduation_year", None)
        if level:
            item["level"] = level
        if school:
            item["school"] = school
        if majors:
            item["majors"] = majors
        if graduation_year:
            item["graduation_year"] = graduation_year
        if item:
            out.append(item)
    return out


def _joined_at(profile) -> str:
    generation_time = profile.id.generation_time
    if generation_time.tzinfo is not None:
        generation_time = generation_time.astimezone(datetime.timezone.utc).replace(
            tzinfo=None
        )
    return generation_time.strftime("%Y-%m-%dT%H:%M:%SZ")


def _birthday_string(raw):
    if isinstance(raw, (datetime.date, datetime.datetime)):
        return raw.strftime("%Y-%m-%d")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    return None


def _put_if(data: dict, key: str, value):
    if value is None:
        return
    if isinstance(value, (list, dict, str)) and len(value) == 0:
        return
    data[key] = value


def assemble_profile_dto(user_id: str) -> dict:
    user = Users.objects(id=user_id).first()
    if user is None:
        raise ProfileNotFound()
    try:
        role = int(user.role)
    except (TypeError, ValueError):
        raise ProfileNotFound()
    if role != _MENTEE_ROLE:
        raise ProfileNotFound()

    profile = MenteeProfile.objects(firebase_uid=user.firebase_uid).first()
    application = MenteeApplication.objects(email=user.email).first()

    data: dict = {}

    if application is not None:
        _put_if(data, "country", getattr(application, "Country", None))
        is_social = getattr(application, "isSocial", None)
        if is_social == "Yes":
            data["socially_engaged"] = True
        elif is_social == "No":
            data["socially_engaged"] = False
        _put_if(data, "application_notes", getattr(application, "questions", None))
        _put_if(data, "identify", getattr(application, "identify", None))
        topics = [
            t
            for t in (getattr(application, "topics", None) or [])
            if isinstance(t, str) and t
        ]
        _put_if(data, "topics", topics)

    if profile is None:
        return data

    _put_if(data, "location", getattr(profile, "location", None))

    languages = [
        normalized
        for normalized in (
            _normalize_language(lang) for lang in profile.languages or []
        )
        if normalized
    ]
    _put_if(data, "languages", languages)

    _put_if(data, "age", getattr(profile, "age", None))
    _put_if(data, "birthday", _birthday_string(getattr(profile, "birthday", None)))
    _put_if(data, "gender", getattr(profile, "gender", None))

    is_student_raw = getattr(profile, "isStudent", None)
    if is_student_raw == "Yes":
        data["is_student"] = True
    elif is_student_raw == "No":
        data["is_student"] = False

    _put_if(data, "education_level", getattr(profile, "education_level", None))
    _put_if(data, "education", _education_entries(profile.education))
    _put_if(data, "interests", list(profile.specializations or []))
    _put_if(data, "biography", getattr(profile, "biography", None))
    _put_if(data, "work_state", list(profile.workstate or []))
    _put_if(data, "immigrant_status", list(profile.immigrant_status or []))

    organization = _resolve_organization(getattr(profile, "organization", None))
    _put_if(data, "organization", organization)

    mentor = _resolve_mentor(getattr(profile, "mentorMentee", None))
    _put_if(data, "mentor", mentor)

    _put_if(data, "joined_at", _joined_at(profile))

    return data
