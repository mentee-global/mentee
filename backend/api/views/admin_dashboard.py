"""Admin dashboard read-only metric endpoints.

One batch `/summary` endpoint backs the KPI tile strip; the remaining
endpoints back individual Chart.js charts on the admin dashboard page.

All routes require admin (Firebase `role == 0`) via @admin_only.

The aggregation pipelines here mirror the ones validated in
`backend/scripts/dashboard_research/05_domain_probes.py`. That script was
used to discover and verify every shape; treat it as the reference doc.
"""
from datetime import datetime, timedelta

from bson import ObjectId
from flask import Blueprint, request

from api.core import create_response, logger
from api.models import (
    AppointmentRequest,
    BugReport,
    DirectMessage,
    ErrorLog,
    MenteeApplication,
    MenteeProfile,
    MentorProfile,
    NewMentorApplication,
    Notifications,
    OAuthRefreshToken,
    PartnerProfile,
    SignedDocs,
    Users,
)
from api.utils.require_auth import admin_only

admin_dashboard = Blueprint("admin_dashboard", __name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Mirrors frontend `ACCOUNT_TYPE` (utils/consts.js). Kept here so the
# dashboard can present role counts without an extra round-trip to a
# constants endpoint.
ROLE_LABELS = {
    "0": "admin",
    "1": "mentor",
    "2": "mentee",
    "3": "partner",
    "4": "guest",
    "5": "support",
    "6": "hub",
    "7": "moderator",
}


def _jsonable(value):
    """Recursively coerce BSON/datetime types into JSON-friendly primitives."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _jsonable(v) for k, v in value.items()}
    return value


def _aggregate(model, pipeline):
    """Run an aggregation and return JSON-friendly results."""
    cursor = model.objects.aggregate(pipeline, allowDiskUse=True)
    return [_jsonable(doc) for doc in cursor]


def _int_arg(name, default, lo=1, hi=365):
    """Parse a bounded integer query param."""
    raw = request.args.get(name, default)
    try:
        n = int(raw)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, n))


def _str_arg(name, allowed, default):
    raw = request.args.get(name, default)
    return raw if raw in allowed else default


# ---------------------------------------------------------------------------
# /summary — backs all KPI tiles on the dashboard
# ---------------------------------------------------------------------------


def _summary_users():
    raw = _aggregate(
        Users,
        [
            {"$group": {"_id": "$role", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ],
    )
    by_role = [
        {
            "role": str(r["_id"]),
            "label": ROLE_LABELS.get(str(r["_id"]), "other"),
            "count": r["count"],
        }
        for r in raw
        if r.get("_id") is not None
    ]
    profile_counts = {
        "mentor_profile": MentorProfile.objects.count(),
        "mentee_profile": MenteeProfile.objects.count(),
        "partner_profile": PartnerProfile.objects.count(),
    }
    return {
        "total": Users.objects.count(),
        "by_role": by_role,
        "profile_counts": profile_counts,
    }


def _summary_funnel(model):
    """{state: count} for an application collection."""
    raw = _aggregate(
        model,
        [{"$group": {"_id": "$application_state", "count": {"$sum": 1}}}],
    )
    return {r["_id"]: r["count"] for r in raw if r.get("_id")}


def _summary_appointments():
    raw = _aggregate(
        AppointmentRequest,
        [
            {
                "$project": {
                    "status_norm": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$eq": ["$status", "accepted"]},
                                    "then": "accepted",
                                },
                                {
                                    "case": {"$eq": ["$status", "denied"]},
                                    "then": "denied",
                                },
                                {
                                    "case": {"$eq": ["$status", "pending"]},
                                    "then": "pending",
                                },
                                {
                                    "case": {"$eq": ["$accepted", True]},
                                    "then": "accepted",
                                },
                                {
                                    "case": {"$eq": ["$accepted", False]},
                                    "then": "denied",
                                },
                            ],
                            "default": "unknown",
                        }
                    }
                }
            },
            {"$group": {"_id": "$status_norm", "count": {"$sum": 1}}},
        ],
    )
    counts = {r["_id"]: r["count"] for r in raw}
    return {
        "total": AppointmentRequest.objects.count(),
        "accepted": counts.get("accepted", 0),
        "denied": counts.get("denied", 0),
        "pending": counts.get("pending", 0),
        "unknown": counts.get("unknown", 0),
    }


def _summary_messaging(now):
    return {
        "total": DirectMessage.objects.count(),
        "last_24h": DirectMessage.objects(
            created_at__gte=now - timedelta(hours=24)
        ).count(),
        "last_7d": DirectMessage.objects(
            created_at__gte=now - timedelta(days=7)
        ).count(),
        "last_30d": DirectMessage.objects(
            created_at__gte=now - timedelta(days=30)
        ).count(),
        "unread": DirectMessage.objects(message_read=False).count(),
    }


def _summary_ops(now):
    bugs_open = BugReport.objects(status="new").count()
    oldest = BugReport.objects(status="new").order_by("date_submitted").first()
    oldest_age_days = None
    if oldest and oldest.date_submitted:
        oldest_age_days = max(0, (now - oldest.date_submitted).days)
    return {
        "errors_24h": ErrorLog.objects(
            timestamp__gte=now - timedelta(hours=24)
        ).count(),
        "errors_7d": ErrorLog.objects(timestamp__gte=now - timedelta(days=7)).count(),
        "errors_total": ErrorLog.objects.count(),
        "bugs_open": bugs_open,
        "oldest_bug_age_days": oldest_age_days,
    }


def _summary_oauth(now):
    raw = _aggregate(
        OAuthRefreshToken,
        [
            {"$match": {"revoked": False, "expires_at": {"$gt": now}}},
            {"$group": {"_id": "$client_id", "active_sessions": {"$sum": 1}}},
            {"$sort": {"active_sessions": -1}},
        ],
    )
    distinct_users = len(
        set(
            OAuthRefreshToken.objects(revoked=False, expires_at__gt=now).distinct(
                "user_id"
            )
        )
    )
    return {
        "active_sessions_by_client": [
            {"client_id": r["_id"], "active_sessions": r["active_sessions"]}
            for r in raw
        ],
        "distinct_users": distinct_users,
    }


def _summary_hygiene():
    """Cheap red-alert counts. Sample-based where collection scans would be silly."""
    n_total = Notifications.objects.count()
    n_unread = Notifications.objects(readed=False).count()

    appt_total = AppointmentRequest.objects.count()
    appt_legacy = AppointmentRequest.objects(
        __raw__={
            "$and": [
                {
                    "$or": [
                        {"status": {"$in": [None, ""]}},
                        {"status": {"$exists": False}},
                    ]
                },
                {"accepted": {"$exists": True}},
            ]
        }
    ).count()

    dirty_roles = Users.objects(
        __raw__={"role": {"$not": {"$in": [str(i) for i in range(8)]}}}
    ).count()

    # signed_docs: training_id rarely resolves. Sample-based estimate keeps it cheap.
    sample = list(
        SignedDocs.objects.aggregate(
            [
                {"$sample": {"size": 100}},
                {"$project": {"training_id": 1}},
            ]
        )
    )
    oids = []
    for doc in sample:
        tid = doc.get("training_id")
        if isinstance(tid, str) and len(tid) == 24:
            try:
                oids.append(ObjectId(tid))
            except Exception:
                pass
    sampled = len(oids)
    resolved = 0
    if oids:
        from api.models import Training

        resolved = Training.objects(__raw__={"_id": {"$in": oids}}).count()

    return {
        "notifications": {"total": n_total, "unread": n_unread},
        "appointments_legacy": {"total": appt_total, "legacy_only": appt_legacy},
        "signed_docs_training_id": {"sampled": sampled, "resolved": resolved},
        "users_dirty_role_count": dirty_roles,
    }


@admin_dashboard.route("/summary", methods=["GET"])
@admin_only
def summary():
    try:
        now = datetime.utcnow()
        data = {
            "generated_at": now.isoformat(),
            "users": _summary_users(),
            "funnel": {
                "mentee": _summary_funnel(MenteeApplication),
                "mentor": _summary_funnel(NewMentorApplication),
            },
            "appointments": _summary_appointments(),
            "messaging": _summary_messaging(now),
            "ops": _summary_ops(now),
            "oauth": _summary_oauth(now),
            "hygiene": _summary_hygiene(),
        }
        return create_response(data={"summary": data})
    except Exception as e:
        logger.exception("dashboard /summary failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Applications by month (stacked bar)
# ---------------------------------------------------------------------------


@admin_dashboard.route("/applications/by-month", methods=["GET"])
@admin_only
def applications_by_month():
    months = _int_arg("months", 12, lo=1, hi=36)
    role = _str_arg("role", {"mentee", "mentor"}, "mentee")
    since = datetime.utcnow() - timedelta(days=months * 31)
    model = MenteeApplication if role == "mentee" else NewMentorApplication

    pipeline = [
        {"$match": {"date_submitted": {"$type": "date", "$gte": since}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m", "date": "$date_submitted"}
                },
                "submitted": {"$sum": 1},
                "approved": {
                    "$sum": {
                        "$cond": [{"$eq": ["$application_state", "APPROVED"]}, 1, 0]
                    }
                },
                "completed": {
                    "$sum": {
                        "$cond": [{"$eq": ["$application_state", "COMPLETED"]}, 1, 0]
                    }
                },
                "rejected": {
                    "$sum": {
                        "$cond": [{"$eq": ["$application_state", "REJECTED"]}, 1, 0]
                    }
                },
                "build_profile": {
                    "$sum": {
                        "$cond": [{"$eq": ["$application_state", "BuildProfile"]}, 1, 0]
                    }
                },
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "month": "$_id",
                "submitted": 1,
                "approved": 1,
                "completed": 1,
                "rejected": 1,
                "build_profile": 1,
            }
        },
    ]
    try:
        return create_response(data={"buckets": _aggregate(model, pipeline)})
    except Exception as e:
        logger.exception("applications/by-month failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------


@admin_dashboard.route("/appointments/by-month", methods=["GET"])
@admin_only
def appointments_by_month():
    months = _int_arg("months", 12, lo=1, hi=36)
    since = datetime.utcnow() - timedelta(days=months * 31)
    pipeline = [
        {"$match": {"timeslot.start_time": {"$type": "date", "$gte": since}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m", "date": "$timeslot.start_time"}
                },
                "total": {"$sum": 1},
                "accepted": {
                    "$sum": {
                        "$cond": [
                            {
                                "$or": [
                                    {"$eq": ["$status", "accepted"]},
                                    {
                                        "$and": [
                                            {"$not": ["$status"]},
                                            {"$eq": ["$accepted", True]},
                                        ]
                                    },
                                ]
                            },
                            1,
                            0,
                        ]
                    }
                },
                "denied": {
                    "$sum": {
                        "$cond": [
                            {
                                "$or": [
                                    {"$eq": ["$status", "denied"]},
                                    {
                                        "$and": [
                                            {"$not": ["$status"]},
                                            {"$eq": ["$accepted", False]},
                                        ]
                                    },
                                ]
                            },
                            1,
                            0,
                        ]
                    }
                },
                "pending": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}},
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "month": "$_id",
                "total": 1,
                "accepted": 1,
                "denied": 1,
                "pending": 1,
            }
        },
    ]
    try:
        return create_response(
            data={"buckets": _aggregate(AppointmentRequest, pipeline)}
        )
    except Exception as e:
        logger.exception("appointments/by-month failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/appointments/top-mentors", methods=["GET"])
@admin_only
def appointments_top_mentors():
    limit = _int_arg("limit", 10, lo=1, hi=50)
    pipeline = [
        {"$group": {"_id": "$mentor_id", "appointments": {"$sum": 1}}},
        {"$sort": {"appointments": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "mentor_profile",
                "localField": "_id",
                "foreignField": "_id",
                "as": "profile",
            }
        },
        {
            "$project": {
                "_id": 0,
                "mentor_id": {"$toString": "$_id"},
                "appointments": 1,
                "mentor_name": {"$arrayElemAt": ["$profile.name", 0]},
                "specializations": {"$arrayElemAt": ["$profile.specializations", 0]},
            }
        },
    ]
    try:
        return create_response(
            data={"mentors": _aggregate(AppointmentRequest, pipeline)}
        )
    except Exception as e:
        logger.exception("appointments/top-mentors failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/appointments/acceptance-rates", methods=["GET"])
@admin_only
def appointments_acceptance_rates():
    min_requests = _int_arg("min_requests", 3, lo=1, hi=100)
    limit = _int_arg("limit", 30, lo=1, hi=100)
    pipeline = [
        {
            "$group": {
                "_id": "$mentor_id",
                "total": {"$sum": 1},
                "accepted": {
                    "$sum": {"$cond": [{"$eq": ["$status", "accepted"]}, 1, 0]}
                },
                "denied": {"$sum": {"$cond": [{"$eq": ["$status", "denied"]}, 1, 0]}},
                "pending": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}},
            }
        },
        {"$match": {"total": {"$gte": min_requests}}},
        {"$sort": {"total": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "mentor_profile",
                "localField": "_id",
                "foreignField": "_id",
                "as": "profile",
            }
        },
        {
            "$project": {
                "_id": 0,
                "mentor_id": {"$toString": "$_id"},
                "mentor_name": {"$arrayElemAt": ["$profile.name", 0]},
                "total": 1,
                "accepted": 1,
                "denied": 1,
                "pending": 1,
                "acceptance_rate": {
                    "$cond": [
                        {"$eq": ["$total", 0]},
                        0,
                        {"$divide": ["$accepted", "$total"]},
                    ]
                },
            }
        },
    ]
    try:
        return create_response(
            data={"mentors": _aggregate(AppointmentRequest, pipeline)}
        )
    except Exception as e:
        logger.exception("appointments/acceptance-rates failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Messaging
# ---------------------------------------------------------------------------


@admin_dashboard.route("/messages/by-day", methods=["GET"])
@admin_only
def messages_by_day():
    days = _int_arg("days", 90, lo=1, hi=365)
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$type": "date", "$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "messages": {"$sum": 1},
                "read": {"$sum": {"$cond": [{"$eq": ["$message_read", True]}, 1, 0]}},
            }
        },
        {"$sort": {"_id": 1}},
        {"$project": {"_id": 0, "day": "$_id", "messages": 1, "read": 1}},
    ]
    try:
        return create_response(data={"buckets": _aggregate(DirectMessage, pipeline)})
    except Exception as e:
        logger.exception("messages/by-day failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Demographics
# ---------------------------------------------------------------------------


def _top_n(model, field, limit, match=None, unwind=False):
    pipeline = []
    if match:
        pipeline.append({"$match": match})
    if unwind:
        pipeline.append({"$unwind": f"${field}"})
    pipeline += [
        {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
        {"$project": {"_id": 0, "value": "$_id", "count": 1}},
    ]
    return _aggregate(model, pipeline)


@admin_dashboard.route("/demographics/countries", methods=["GET"])
@admin_only
def demographics_countries():
    limit = _int_arg("limit", 15, lo=1, hi=50)
    try:
        data = _top_n(
            MenteeApplication,
            "Country",
            limit,
            match={"Country": {"$exists": True, "$ne": None, "$nin": ["", " "]}},
        )
        return create_response(data={"items": data})
    except Exception as e:
        logger.exception("demographics/countries failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/demographics/topics", methods=["GET"])
@admin_only
def demographics_topics():
    limit = _int_arg("limit", 15, lo=1, hi=50)
    try:
        data = _top_n(MenteeApplication, "topics", limit, unwind=True)
        return create_response(data={"items": data})
    except Exception as e:
        logger.exception("demographics/topics failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/demographics/crisis-status", methods=["GET"])
@admin_only
def demographics_crisis_status():
    limit = _int_arg("limit", 10, lo=1, hi=30)
    try:
        data = _top_n(MenteeApplication, "immigrant_status", limit, unwind=True)
        return create_response(data={"items": data})
    except Exception as e:
        logger.exception("demographics/crisis-status failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/demographics/identify", methods=["GET"])
@admin_only
def demographics_identify():
    """Gender identification, normalised. Collapses variants like 'Female '
    and 'As a female' into the dominant 'woman'/'man' buckets so the chart
    isn't fragmented by typos."""
    source = _str_arg("source", {"mentee", "mentor"}, "mentee")
    model = MenteeApplication if source == "mentee" else NewMentorApplication
    pipeline = [
        {"$match": {"identify": {"$exists": True, "$ne": None, "$ne": ""}}},
        {
            "$project": {
                "norm": {
                    "$let": {
                        "vars": {"lc": {"$toLower": {"$trim": {"input": "$identify"}}}},
                        "in": {
                            "$switch": {
                                "branches": [
                                    {
                                        "case": {
                                            "$regexMatch": {
                                                "input": "$$lc",
                                                "regex": "wom(a|e)n|female",
                                            }
                                        },
                                        "then": "woman",
                                    },
                                    {
                                        "case": {
                                            "$regexMatch": {
                                                "input": "$$lc",
                                                "regex": "man|male",
                                            }
                                        },
                                        "then": "man",
                                    },
                                    {
                                        "case": {
                                            "$regexMatch": {
                                                "input": "$$lc",
                                                "regex": "lgbt|queer|non.?binary",
                                            }
                                        },
                                        "then": "lgbtq+",
                                    },
                                ],
                                "default": "other",
                            }
                        },
                    }
                }
            }
        },
        {"$group": {"_id": "$norm", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$project": {"_id": 0, "value": "$_id", "count": 1}},
    ]
    try:
        return create_response(data={"items": _aggregate(model, pipeline)})
    except Exception as e:
        logger.exception("demographics/identify failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/demographics/mentor-specializations", methods=["GET"])
@admin_only
def demographics_mentor_specs():
    limit = _int_arg("limit", 15, lo=1, hi=50)
    try:
        data = _top_n(MentorProfile, "specializations", limit, unwind=True)
        return create_response(data={"items": data})
    except Exception as e:
        logger.exception("demographics/mentor-specializations failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/demographics/mentor-flags", methods=["GET"])
@admin_only
def demographics_mentor_flags():
    """Returns the percentage of mentor applicants who self-identify as
    color/marginalized/native/economically-disadvantaged."""
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "color": {"$sum": {"$cond": [{"$eq": ["$isColorPerson", True]}, 1, 0]}},
                "marginalized": {
                    "$sum": {"$cond": [{"$eq": ["$isMarginalized", True]}, 1, 0]}
                },
                "native": {
                    "$sum": {"$cond": [{"$eq": ["$isFamilyNative", True]}, 1, 0]}
                },
                "economically": {
                    "$sum": {"$cond": [{"$eq": ["$isEconomically", True]}, 1, 0]}
                },
                "immigrant": {
                    "$sum": {"$cond": [{"$eq": ["$immigrant_status", True]}, 1, 0]}
                },
            }
        },
        {"$project": {"_id": 0}},
    ]
    try:
        rows = _aggregate(NewMentorApplication, pipeline)
        row = rows[0] if rows else {"total": 0}
        return create_response(data={"flags": row})
    except Exception as e:
        logger.exception("demographics/mentor-flags failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Partners
# ---------------------------------------------------------------------------


@admin_dashboard.route("/partners/top", methods=["GET"])
@admin_only
def partners_top():
    limit = _int_arg("limit", 10, lo=1, hi=50)
    role = _str_arg("role", {"mentee", "mentor"}, "mentee")
    model = MenteeApplication if role == "mentee" else NewMentorApplication

    pipeline = [
        {"$match": {"partner": {"$exists": True, "$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$partner", "applications": {"$sum": 1}}},
        {"$sort": {"applications": -1}},
        {"$limit": limit},
        # Resolve the partner id (stored as a string) against partner_profile._id.
        # We cast the string -> ObjectId before joining so the comparison hits.
        {
            "$addFields": {
                "partner_oid": {
                    "$convert": {
                        "input": "$_id",
                        "to": "objectId",
                        "onError": None,
                        "onNull": None,
                    }
                }
            }
        },
        {
            "$lookup": {
                "from": "partner_profile",
                "localField": "partner_oid",
                "foreignField": "_id",
                "as": "profile",
            }
        },
        {
            "$project": {
                "_id": 0,
                "partner_id": "$_id",
                "applications": 1,
                "organization": {"$arrayElemAt": ["$profile.organization", 0]},
                "person_name": {"$arrayElemAt": ["$profile.person_name", 0]},
            }
        },
    ]
    try:
        return create_response(data={"partners": _aggregate(model, pipeline)})
    except Exception as e:
        logger.exception("partners/top failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Errors / ops
# ---------------------------------------------------------------------------


@admin_dashboard.route("/errors/by-day", methods=["GET"])
@admin_only
def errors_by_day():
    days = _int_arg("days", 30, lo=1, hi=90)
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"timestamp": {"$type": "date", "$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "total": {"$sum": 1},
                "backend": {"$sum": {"$cond": [{"$eq": ["$source", "backend"]}, 1, 0]}},
                "frontend": {
                    "$sum": {"$cond": [{"$eq": ["$source", "frontend"]}, 1, 0]}
                },
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "day": "$_id",
                "total": 1,
                "backend": 1,
                "frontend": 1,
            }
        },
    ]
    try:
        return create_response(data={"buckets": _aggregate(ErrorLog, pipeline)})
    except Exception as e:
        logger.exception("errors/by-day failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/errors/top-exceptions", methods=["GET"])
@admin_only
def errors_top_exceptions():
    limit = _int_arg("limit", 10, lo=1, hi=30)
    try:
        data = _top_n(ErrorLog, "exception_type", limit)
        return create_response(data={"items": data})
    except Exception as e:
        logger.exception("errors/top-exceptions failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/errors/top-endpoints", methods=["GET"])
@admin_only
def errors_top_endpoints():
    limit = _int_arg("limit", 10, lo=1, hi=30)
    try:
        data = _top_n(ErrorLog, "endpoint", limit)
        return create_response(data={"items": data})
    except Exception as e:
        logger.exception("errors/top-endpoints failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# OAuth
# ---------------------------------------------------------------------------


@admin_dashboard.route("/oauth/tokens-by-day", methods=["GET"])
@admin_only
def oauth_tokens_by_day():
    days = _int_arg("days", 60, lo=1, hi=365)
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$type": "date", "$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "issued": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
        {"$project": {"_id": 0, "day": "$_id", "issued": 1}},
    ]
    try:
        return create_response(
            data={"buckets": _aggregate(OAuthRefreshToken, pipeline)}
        )
    except Exception as e:
        logger.exception("oauth/tokens-by-day failed")
        return create_response(status=500, message=str(e))
