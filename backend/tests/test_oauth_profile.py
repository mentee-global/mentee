"""Tests for GET /oauth/profile and the DTO assembler.

Split between unit tests against `assemble_profile_dto` (no HTTP, direct
Mongo seeding + in-process call) and a handful of HTTP tests that go
through the Flask test client. Both rely on a dev Mongo; the HTTP tests
additionally require OAUTH_ENABLED=true so the blueprint is registered.
"""

import datetime
import os
import secrets
import uuid

import bcrypt
import pytest

from api.models import (
    Education,
    MenteeApplication,
    MenteeProfile,
    MentorProfile,
    OAuthAccessToken,
    OAuthClient,
    PartnerProfile,
    Users,
)
from api.utils.oauth_profile import ProfileNotFound, assemble_profile_dto
from api.utils.oauth_server import sha256_hex


PROFILE_SCOPE = "mentee.api.profile.read"


@pytest.fixture
def mentee_user(client):
    firebase_uid = f"fb-{uuid.uuid4().hex[:10]}"
    email = f"profile-{uuid.uuid4().hex[:8]}@example.test"
    user = Users(
        firebase_uid=firebase_uid,
        email=email,
        role="2",
        verified=True,
        token_version=0,
    )
    user.save()
    yield user
    MenteeProfile.objects(firebase_uid=firebase_uid).delete()
    MenteeApplication.objects(email=email).delete()
    Users.objects(id=user.id).delete()


def _build_profile(user, **overrides):
    defaults = dict(
        firebase_uid=user.firebase_uid,
        name="Test Mentee",
        gender="female",
        location="Mexico City, Mexico",
        age="22",
        email=user.email,
        languages=["Spanish", "English"],
        text_notifications=False,
        email_notifications=False,
        is_private=False,
        specializations=["scholarships_EU", "AI"],
        biography="First-gen student interested in EU grad programs.",
        workstate=["studying", "part_time"],
        immigrant_status=["first_gen"],
        isStudent="Yes",
        education_level="undergraduate",
        timezone="America/Mexico_City",
        birthday=datetime.date(2003, 5, 14),
        education=[
            Education(
                education_level="Bachelor's",
                school="UNAM",
                majors=["Computer Science"],
                graduation_year=2027,
            )
        ],
    )
    defaults.update(overrides)
    mp = MenteeProfile(**defaults)
    mp.save()
    return mp


def _build_application(user, **overrides):
    defaults = dict(
        email=user.email,
        name="Test Mentee",
        age="22",
        immigrant_status=["first_gen"],
        Country="MX",
        identify="She/Her",
        language=["Spanish", "English"],
        topics=["scholarships_EU", "AI"],
        workstate=["studying", "part_time"],
        isSocial="Yes",
        questions="Wants to apply to Chevening and DAAD by next cycle.",
        application_state="approved",
        date_submitted=datetime.datetime.utcnow(),
    )
    defaults.update(overrides)
    app_doc = MenteeApplication(**defaults)
    app_doc.save()
    return app_doc


def test_assembler_happy_path(mentee_user):
    application = _build_application(mentee_user)
    mentor = MentorProfile(
        firebase_uid=f"mentor-{uuid.uuid4().hex[:8]}",
        name="Dr. Kim",
        email="drkim@example.test",
        professional_title="Senior Research Advisor",
        languages=["English", "Korean"],
        specializations=["scholarships", "graduate_admissions"],
        text_notifications=False,
        email_notifications=False,
    )
    mentor.save()

    partner = PartnerProfile(
        firebase_uid=f"partner-{uuid.uuid4().hex[:8]}",
        email="partner@example.test",
        text_notifications=False,
        email_notifications=False,
        organization="Partner Foundation",
        person_name="Partner Admin",
        intro="Supporting mentees.",
        sdgs=["SDG4"],
        topics="Education access in LATAM",
        timezone="UTC",
    )
    partner.save()

    profile = _build_profile(
        mentee_user,
        organization=str(partner.id),
        mentorMentee=str(mentor.id),
    )

    try:
        data = assemble_profile_dto(str(mentee_user.id))
    finally:
        PartnerProfile.objects(id=partner.id).delete()
        MentorProfile.objects(id=mentor.id).delete()

    assert data["country"] == "MX"
    assert data["location"] == "Mexico City, Mexico"
    assert data["languages"] == ["es", "en"]
    assert data["age"] == "22"
    assert data["birthday"] == "2003-05-14"
    assert data["gender"] == "female"
    assert data["is_student"] is True
    assert data["education_level"] == "undergraduate"
    assert data["education"] == [
        {
            "level": "Bachelor's",
            "school": "UNAM",
            "majors": ["Computer Science"],
            "graduation_year": 2027,
        }
    ]
    assert data["interests"] == ["scholarships_EU", "AI"]
    assert data["topics"] == ["scholarships_EU", "AI"]
    assert data["identify"] == "She/Her"
    assert data["biography"] == "First-gen student interested in EU grad programs."
    assert data["work_state"] == ["studying", "part_time"]
    assert data["immigrant_status"] == ["first_gen"]
    assert data["organization"] == {
        "id": str(partner.id),
        "name": "Partner Foundation",
        "topics": "Education access in LATAM",
    }
    assert data["mentor"] == {
        "id": str(mentor.id),
        "name": "Dr. Kim",
        "professional_title": "Senior Research Advisor",
        "specializations": ["scholarships", "graduate_admissions"],
        "languages": ["en", "ko"],
    }
    assert data["socially_engaged"] is True
    assert (
        data["application_notes"]
        == "Wants to apply to Chevening and DAAD by next cycle."
    )
    assert "joined_at" in data and data["joined_at"].endswith("Z")
    for leaked in (
        "phone_number",
        "firebase_uid",
        "email",
        "roomName",
        "pair_partner",
        "favorite_mentors_ids",
        "token_version",
    ):
        assert leaked not in data


def test_assembler_without_profile_still_returns_application_fields(mentee_user):
    _build_application(mentee_user, Country="CO", isSocial="No", questions=None)
    data = assemble_profile_dto(str(mentee_user.id))
    assert data == {
        "country": "CO",
        "socially_engaged": False,
        "identify": "She/Her",
        "topics": ["scholarships_EU", "AI"],
    }


def test_assembler_non_mentee_raises(client):
    mentor_user = Users(
        firebase_uid=f"fb-{uuid.uuid4().hex[:10]}",
        email=f"mentor-{uuid.uuid4().hex[:8]}@example.test",
        role="1",
        verified=True,
    )
    mentor_user.save()
    try:
        with pytest.raises(ProfileNotFound):
            assemble_profile_dto(str(mentor_user.id))
    finally:
        Users.objects(id=mentor_user.id).delete()


def test_assembler_organization_free_text(mentee_user):
    _build_application(mentee_user)
    _build_profile(mentee_user, organization="A community group")
    data = assemble_profile_dto(str(mentee_user.id))
    assert data["organization"] == {"name": "A community group"}
    assert "id" not in data["organization"]


def test_assembler_mentor_pointing_at_deleted_doc(mentee_user):
    _build_application(mentee_user)
    _build_profile(
        mentee_user,
        mentorMentee=str(uuid.uuid4().hex[:8] + uuid.uuid4().hex[:16]),
    )
    data = assemble_profile_dto(str(mentee_user.id))
    assert "mentor" not in data


def test_assembler_mentor_minimal_fields_omits_optional_subkeys(mentee_user):
    """Mentor with only `name` should yield `{id, name}` with no errors and
    no empty optional keys. Missing professional_title / specializations /
    languages must omit those keys, not return null."""
    _build_application(mentee_user)
    mentor = MentorProfile(
        firebase_uid=f"mentor-{uuid.uuid4().hex[:8]}",
        name="Just A Name",
        email="just-a-name@example.test",
        professional_title="",
        languages=[],
        specializations=[],
        text_notifications=False,
        email_notifications=False,
    )
    mentor.save()
    _build_profile(mentee_user, mentorMentee=str(mentor.id))
    try:
        data = assemble_profile_dto(str(mentee_user.id))
    finally:
        MentorProfile.objects(id=mentor.id).delete()

    assert data["mentor"] == {"id": str(mentor.id), "name": "Just A Name"}
    for k in ("professional_title", "specializations", "languages"):
        assert k not in data["mentor"]


def test_assembler_organization_fk_without_topics_omits_topics(mentee_user):
    """Partner with no topics field must yield `{id, name}` only —
    `topics` key must be absent, not null."""
    _build_application(mentee_user)
    partner = PartnerProfile(
        firebase_uid=f"partner-{uuid.uuid4().hex[:8]}",
        email="partner-no-topics@example.test",
        text_notifications=False,
        email_notifications=False,
        organization="Quiet Foundation",
        person_name="Partner Admin",
        intro="Supporting mentees.",
        sdgs=["SDG4"],
        timezone="UTC",
    )
    partner.save()
    _build_profile(mentee_user, organization=str(partner.id))
    try:
        data = assemble_profile_dto(str(mentee_user.id))
    finally:
        PartnerProfile.objects(id=partner.id).delete()

    assert data["organization"] == {
        "id": str(partner.id),
        "name": "Quiet Foundation",
    }
    assert "topics" not in data["organization"]


def test_assembler_country_comes_from_application(mentee_user):
    _build_application(mentee_user, Country="BR")
    _build_profile(mentee_user)
    data = assemble_profile_dto(str(mentee_user.id))
    assert data["country"] == "BR"


def test_assembler_is_student_variants(mentee_user):
    _build_application(mentee_user)
    _build_profile(mentee_user, isStudent="No")
    data = assemble_profile_dto(str(mentee_user.id))
    assert data["is_student"] is False

    MenteeProfile.objects(firebase_uid=mentee_user.firebase_uid).delete()
    _build_profile(mentee_user, isStudent=None)
    data = assemble_profile_dto(str(mentee_user.id))
    assert "is_student" not in data


def test_assembler_non_ascii_roundtrips(mentee_user):
    import json

    _build_application(mentee_user, Country="MX")
    _build_profile(
        mentee_user,
        location="São Paulo, Brasil",
        biography="Estudiante interesada en becas europeas — con acentos: ñ, á, é.",
    )
    data = assemble_profile_dto(str(mentee_user.id))
    as_json = json.dumps({"version": 1, "data": data}, ensure_ascii=False)
    reloaded = json.loads(as_json)
    assert reloaded["data"]["location"] == "São Paulo, Brasil"
    assert "ñ" in reloaded["data"]["biography"]


pytestmark_http = pytest.mark.skipif(
    os.environ.get("OAUTH_ENABLED", "false").lower() != "true",
    reason="HTTP tests require OAUTH_ENABLED=true so /oauth/profile is registered",
)


@pytest.fixture
def bot_client():
    client_id = f"test-profile-{uuid.uuid4().hex[:8]}"
    secret_plain = secrets.token_urlsafe(24)
    secret_hash = bcrypt.hashpw(secret_plain.encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )
    oc = OAuthClient(
        client_id=client_id,
        client_secret_hash=secret_hash,
        client_name="profile-endpoint-tests",
        redirect_uris=["http://localhost:8001/cb"],
        allowed_scopes=[
            "openid",
            "email",
            "profile",
            "mentee.role",
            PROFILE_SCOPE,
        ],
        response_types=["code"],
        grant_types=["authorization_code", "refresh_token"],
        token_endpoint_auth_method="client_secret_basic",
        is_first_party=True,
        is_active=True,
    )
    oc.save()
    yield oc
    OAuthClient.objects(client_id=client_id).delete()


def _seed_access_token(user, client_id, scope):
    plain = secrets.token_urlsafe(32)
    now = datetime.datetime.utcnow()
    OAuthAccessToken(
        token_hash=sha256_hex(plain),
        client_id=client_id,
        user_id=str(user.id),
        scope=scope,
        created_at=now,
        expires_at=now + datetime.timedelta(seconds=3600),
    ).save()
    return plain


@pytestmark_http
def test_http_happy_path(client, mentee_user, bot_client):
    _build_application(mentee_user)
    _build_profile(mentee_user)
    token = _seed_access_token(
        mentee_user,
        bot_client.client_id,
        f"openid email {PROFILE_SCOPE}",
    )
    try:
        response = client.get(
            "/oauth/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["version"] == 1
        assert body["data"]["country"] == "MX"
        assert body["data"]["languages"] == ["es", "en"]
    finally:
        OAuthAccessToken.objects(token_hash=sha256_hex(token)).delete()


@pytestmark_http
def test_http_missing_scope(client, mentee_user, bot_client):
    _build_application(mentee_user)
    _build_profile(mentee_user)
    token = _seed_access_token(mentee_user, bot_client.client_id, "openid email")
    try:
        response = client.get(
            "/oauth/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert response.get_json().get("error") == "insufficient_scope"
    finally:
        OAuthAccessToken.objects(token_hash=sha256_hex(token)).delete()


@pytestmark_http
def test_http_revoked_token(client, mentee_user, bot_client):
    _build_application(mentee_user)
    _build_profile(mentee_user)
    plain = secrets.token_urlsafe(32)
    now = datetime.datetime.utcnow()
    OAuthAccessToken(
        token_hash=sha256_hex(plain),
        client_id=bot_client.client_id,
        user_id=str(mentee_user.id),
        scope=f"openid {PROFILE_SCOPE}",
        revoked=True,
        created_at=now,
        expires_at=now + datetime.timedelta(seconds=3600),
    ).save()
    try:
        response = client.get(
            "/oauth/profile",
            headers={"Authorization": f"Bearer {plain}"},
        )
        assert response.status_code == 401
    finally:
        OAuthAccessToken.objects(token_hash=sha256_hex(plain)).delete()


@pytestmark_http
def test_http_mentor_token_returns_404(client, bot_client):
    mentor_user = Users(
        firebase_uid=f"fb-{uuid.uuid4().hex[:10]}",
        email=f"mentor-http-{uuid.uuid4().hex[:8]}@example.test",
        role="1",
        verified=True,
    )
    mentor_user.save()
    token = _seed_access_token(
        mentor_user, bot_client.client_id, f"openid {PROFILE_SCOPE}"
    )
    try:
        response = client.get(
            "/oauth/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 404
        assert response.get_json().get("error") == "profile_not_found"
    finally:
        OAuthAccessToken.objects(token_hash=sha256_hex(token)).delete()
        Users.objects(id=mentor_user.id).delete()


@pytestmark_http
def test_http_partial_profile_returns_empty_data(client, mentee_user, bot_client):
    token = _seed_access_token(
        mentee_user,
        bot_client.client_id,
        f"openid {PROFILE_SCOPE}",
    )
    try:
        response = client.get(
            "/oauth/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        body = response.get_json()
        assert body["version"] == 1
        assert body["data"] == {}
    finally:
        OAuthAccessToken.objects(token_hash=sha256_hex(token)).delete()
