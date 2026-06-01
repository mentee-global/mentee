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
    Hub,
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
        "hub": Hub.objects.count(),
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


def _profile_email_set(model):
    return {
        email.strip().lower()
        for email in model.objects.distinct("email")
        if isinstance(email, str) and email.strip()
    }


def _summary_conversion(app_model, profile_model):
    profile_emails = _profile_email_set(profile_model)
    apps = list(app_model.objects.only("email", "application_state"))
    total = len(apps)
    approved_states = {"APPROVED", "BuildProfile", "COMPLETED"}
    approved_or_later = 0
    profile_created = 0
    approved_without_profile = 0
    build_profile_without_profile = 0
    completed_without_profile = 0

    for app in apps:
        email = (getattr(app, "email", "") or "").strip().lower()
        state = getattr(app, "application_state", None)
        has_profile = bool(email and email in profile_emails)
        if state in approved_states:
            approved_or_later += 1
            if has_profile:
                profile_created += 1
            else:
                approved_without_profile += 1
        if state == "BuildProfile" and not has_profile:
            build_profile_without_profile += 1
        if state == "COMPLETED" and not has_profile:
            completed_without_profile += 1

    return {
        "total_applications": total,
        "approved_or_later": approved_or_later,
        "profile_created_from_approved": profile_created,
        "profile_conversion_rate": (
            round((profile_created / approved_or_later) * 100, 1)
            if approved_or_later
            else None
        ),
        "approved_without_profile": approved_without_profile,
        "build_profile_without_profile": build_profile_without_profile,
        "completed_without_profile": completed_without_profile,
    }


def _count_created_since(model, since):
    return model.objects(
        __raw__={
            "$or": [
                {"created_at": {"$gte": since}},
                {
                    "created_at": {"$exists": False},
                    "_id": {"$gte": ObjectId.from_datetime(since)},
                },
            ]
        }
    ).count()


def _distinct_profile_activity(profile_model, profile_field, since):
    profile_ids = set(profile_model.objects.scalar("id"))
    if not profile_ids:
        return 0
    message_ids = set(
        DirectMessage.objects(created_at__gte=since).distinct("sender_id")
    ) | set(DirectMessage.objects(created_at__gte=since).distinct("recipient_id"))
    appointment_ids = set(
        AppointmentRequest.objects(
            __raw__={
                "$or": [
                    {"created_at": {"$gte": since}},
                    {"status_updated_at": {"$gte": since}},
                    {"timeslot.start_time": {"$gte": since}},
                    {
                        "created_at": {"$exists": False},
                        "_id": {"$gte": ObjectId.from_datetime(since)},
                    },
                ]
            }
        ).distinct(profile_field)
    )
    return len(profile_ids & (message_ids | appointment_ids))


def _status_count_since(status, since):
    return AppointmentRequest.objects(
        status=status, timeslot__start_time__gte=since
    ).count()


def _application_count_between(model, start, end):
    return model.objects(date_submitted__gte=start, date_submitted__lt=end).count()


def _period_delta(current, previous):
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 1)


def _top_supply_demand_gaps(limit=8):
    demand_rows = _aggregate(
        MenteeProfile,
        [
            {"$unwind": "$specializations"},
            {"$group": {"_id": "$specializations", "demand": {"$sum": 1}}},
        ],
    )
    supply_rows = _aggregate(
        MentorProfile,
        [
            {
                "$match": {
                    "$and": [
                        {
                            "$or": [
                                {"taking_appointments": True},
                                {"taking_appointments": {"$exists": False}},
                            ]
                        },
                        {
                            "$or": [
                                {"paused_flag": False},
                                {"paused_flag": {"$exists": False}},
                            ]
                        },
                    ]
                }
            },
            {"$unwind": "$specializations"},
            {"$group": {"_id": "$specializations", "supply": {"$sum": 1}}},
        ],
    )
    supply = {row["_id"]: row["supply"] for row in supply_rows}
    gaps = []
    for row in demand_rows:
        topic = row["_id"]
        demand = row["demand"]
        supply_count = supply.get(topic, 0)
        gaps.append(
            {
                "topic": topic,
                "demand": demand,
                "supply": supply_count,
                "gap": demand - supply_count,
            }
        )
    return sorted(gaps, key=lambda row: row["gap"], reverse=True)[:limit]


def _summary_executive(now):
    since_30d = now - timedelta(days=30)
    prev_30d = now - timedelta(days=60)
    mentee_apps_30d = _application_count_between(MenteeApplication, since_30d, now)
    mentor_apps_30d = _application_count_between(NewMentorApplication, since_30d, now)
    mentee_apps_prev = _application_count_between(
        MenteeApplication, prev_30d, since_30d
    )
    mentor_apps_prev = _application_count_between(
        NewMentorApplication, prev_30d, since_30d
    )
    accepted_30d = _status_count_since("accepted", since_30d)
    accepted_prev = AppointmentRequest.objects(
        status="accepted",
        timeslot__start_time__gte=prev_30d,
        timeslot__start_time__lt=since_30d,
    ).count()
    mentee_conversion = _summary_conversion(MenteeApplication, MenteeProfile)
    mentor_conversion = _summary_conversion(NewMentorApplication, MentorProfile)

    return {
        "active_mentees_30d": _distinct_profile_activity(
            MenteeProfile, "mentee_id", since_30d
        ),
        "active_mentors_30d": _distinct_profile_activity(
            MentorProfile, "mentor_id", since_30d
        ),
        "new_mentee_profiles_30d": _count_created_since(MenteeProfile, since_30d),
        "new_mentor_profiles_30d": _count_created_since(MentorProfile, since_30d),
        "mentee_applications_30d": mentee_apps_30d,
        "mentor_applications_30d": mentor_apps_30d,
        "mentee_application_delta_30d": _period_delta(
            mentee_apps_30d, mentee_apps_prev
        ),
        "mentor_application_delta_30d": _period_delta(
            mentor_apps_30d, mentor_apps_prev
        ),
        "accepted_sessions_30d": accepted_30d,
        "accepted_sessions_delta_30d": _period_delta(accepted_30d, accepted_prev),
        "mentor_supply_available": MentorProfile.objects(
            __raw__={
                "$and": [
                    {"taking_appointments": True},
                    {
                        "$or": [
                            {"paused_flag": False},
                            {"paused_flag": {"$exists": False}},
                        ]
                    },
                ]
            }
        ).count(),
        "mentor_supply_total": MentorProfile.objects.count(),
        "attention": {
            "approved_mentees_without_profile": mentee_conversion[
                "approved_without_profile"
            ],
            "approved_mentors_without_profile": mentor_conversion[
                "approved_without_profile"
            ],
            "mentor_build_profile_without_profile": mentor_conversion[
                "build_profile_without_profile"
            ],
            "users_dirty_role_count": Users.objects(
                __raw__={"role": {"$nin": [str(i) for i in range(8)]}}
            ).count(),
            "mentee_profiles_missing_timezone": MenteeProfile.objects(
                __raw__={
                    "$or": [
                        {"timezone": {"$exists": False}},
                        {"timezone": {"$in": [None, ""]}},
                    ]
                }
            ).count(),
            "mentor_profiles_missing_timezone": MentorProfile.objects(
                __raw__={
                    "$or": [
                        {"timezone": {"$exists": False}},
                        {"timezone": {"$in": [None, ""]}},
                    ]
                }
            ).count(),
            "mentors_taking_appointments_without_availability": MentorProfile.objects(
                __raw__={
                    "taking_appointments": True,
                    "$or": [
                        {"availability": {"$exists": False}},
                        {"availability": {"$size": 0}},
                    ],
                }
            ).count(),
        },
        "supply_demand_gaps": _top_supply_demand_gaps(),
    }


def _summary_appointments(now):
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
    pending_past_timeslot = AppointmentRequest.objects(
        status="pending", timeslot__start_time__lt=now
    ).count()
    pending_next_7d = AppointmentRequest.objects(
        status="pending",
        timeslot__start_time__gte=now,
        timeslot__start_time__lte=now + timedelta(days=7),
    ).count()
    return {
        "total": AppointmentRequest.objects.count(),
        "accepted": counts.get("accepted", 0),
        "denied": counts.get("denied", 0),
        "pending": counts.get("pending", 0),
        "unknown": counts.get("unknown", 0),
        "pending_past_timeslot": pending_past_timeslot,
        "pending_next_7d": pending_next_7d,
    }


def _summary_messaging(now):
    last_30d = DirectMessage.objects(created_at__gte=now - timedelta(days=30)).count()
    unread_conversations = list(
        DirectMessage.objects(message_read=False).aggregate(
            [
                {
                    "$group": {
                        "_id": {
                            "sender_id": "$sender_id",
                            "recipient_id": "$recipient_id",
                        }
                    }
                },
                {"$count": "count"},
            ]
        )
    )
    return {
        "total": DirectMessage.objects.count(),
        "last_24h": DirectMessage.objects(
            created_at__gte=now - timedelta(hours=24)
        ).count(),
        "last_7d": DirectMessage.objects(
            created_at__gte=now - timedelta(days=7)
        ).count(),
        "last_30d": last_30d,
        "average_per_day_30d": round(last_30d / 30, 1),
        "unread": DirectMessage.objects(message_read=False).count(),
        "unread_48h": DirectMessage.objects(
            message_read=False, created_at__lt=now - timedelta(hours=48)
        ).count(),
        "unread_7d": DirectMessage.objects(
            message_read=False, created_at__lt=now - timedelta(days=7)
        ).count(),
        "unread_conversations": (
            unread_conversations[0]["count"] if unread_conversations else 0
        ),
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
        __raw__={"role": {"$nin": [str(i) for i in range(8)]}}
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
        section = _str_arg(
            "section",
            {
                "all",
                "overview",
                "executive",
                "applications",
                "users",
                "appointments",
                "messages",
                "ops",
            },
            "overview",
        )
        data = {"generated_at": now.isoformat(), "section": section}

        if section in {"all", "overview", "users"}:
            data["users"] = _summary_users()

        if section in {"all", "executive"}:
            data["executive"] = _summary_executive(now)

        if section in {"all", "applications"}:
            data["funnel"] = {
                "mentee": _summary_funnel(MenteeApplication),
                "mentor": _summary_funnel(NewMentorApplication),
            }
            data["conversion"] = {
                "mentee": _summary_conversion(MenteeApplication, MenteeProfile),
                "mentor": _summary_conversion(NewMentorApplication, MentorProfile),
            }

        if section in {"all", "overview", "appointments"}:
            data["appointments"] = _summary_appointments(now)

        if section in {"all", "overview", "messages"}:
            data["messaging"] = _summary_messaging(now)

        if section in {"all", "overview", "ops"}:
            data["ops"] = _summary_ops(now)

        if section in {"all", "ops"}:
            data["oauth"] = _summary_oauth(now)
            data["hygiene"] = _summary_hygiene()

        return create_response(data={"summary": data})
    except Exception as e:
        logger.exception("dashboard /summary failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Applications by month (stacked bar)
# ---------------------------------------------------------------------------


def _applications_by_month_data(role, months):
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
    return _aggregate(model, pipeline)


def _top_partners_data(role, limit):
    model = MenteeApplication if role == "mentee" else NewMentorApplication
    pipeline = [
        {"$match": {"partner": {"$exists": True, "$nin": [None, ""]}}},
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
    return _aggregate(model, pipeline)


def _mentor_flags_data():
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
    rows = _aggregate(NewMentorApplication, pipeline)
    return rows[0] if rows else {"total": 0}


@admin_dashboard.route("/applications/overview", methods=["GET"])
@admin_only
def applications_overview():
    months = _int_arg("months", 12, lo=1, hi=36)
    try:
        mentee_identify_items, mentee_identify_total = _identity_breakdown(
            MenteeApplication, "identify"
        )
        return create_response(
            data={
                "summary": {
                    "funnel": {
                        "mentee": _summary_funnel(MenteeApplication),
                        "mentor": _summary_funnel(NewMentorApplication),
                    },
                    "conversion": {
                        "mentee": _summary_conversion(MenteeApplication, MenteeProfile),
                        "mentor": _summary_conversion(
                            NewMentorApplication, MentorProfile
                        ),
                    },
                },
                "mentee_by_month": _applications_by_month_data("mentee", months),
                "mentor_by_month": _applications_by_month_data("mentor", months),
                "countries": _top_n(
                    MenteeApplication,
                    "Country",
                    15,
                    match={
                        "Country": {
                            "$exists": True,
                            "$ne": None,
                            "$nin": ["", " "],
                        }
                    },
                ),
                "topics": _top_n(MenteeApplication, "topics", 15, unwind=True),
                "crisis_status": _top_n(
                    MenteeApplication, "immigrant_status", 10, unwind=True
                ),
                "mentee_identify": {
                    "items": mentee_identify_items,
                    "meta": {
                        "source": "mentee",
                        "population": "applications",
                        "field": "identify",
                        "scope": "all statuses",
                        "total": mentee_identify_total,
                    },
                },
                "mentor_flags": _mentor_flags_data(),
                "top_partners_mentee": _top_partners_data("mentee", 10),
                "top_partners_mentor": _top_partners_data("mentor", 10),
            }
        )
    except Exception as e:
        logger.exception("applications/overview failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/applications/by-month", methods=["GET"])
@admin_only
def applications_by_month():
    months = _int_arg("months", 12, lo=1, hi=36)
    role = _str_arg("role", {"mentee", "mentor"}, "mentee")
    try:
        return create_response(
            data={"buckets": _applications_by_month_data(role, months)}
        )
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
    try:
        return create_response(data={"buckets": _appointments_by_month_data(months)})
    except Exception as e:
        logger.exception("appointments/by-month failed")
        return create_response(status=500, message=str(e))


def _appointments_by_month_data(months):
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
    return _aggregate(AppointmentRequest, pipeline)


@admin_dashboard.route("/appointments/top-mentors", methods=["GET"])
@admin_only
def appointments_top_mentors():
    limit = _int_arg("limit", 10, lo=1, hi=50)
    try:
        return create_response(data={"mentors": _appointments_top_mentors_data(limit)})
    except Exception as e:
        logger.exception("appointments/top-mentors failed")
        return create_response(status=500, message=str(e))


def _appointments_top_mentors_data(limit):
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
    return _aggregate(AppointmentRequest, pipeline)


@admin_dashboard.route("/appointments/acceptance-rates", methods=["GET"])
@admin_only
def appointments_acceptance_rates():
    min_requests = _int_arg("min_requests", 3, lo=1, hi=100)
    limit = _int_arg("limit", 30, lo=1, hi=100)
    try:
        return create_response(
            data={"mentors": _appointments_acceptance_rates_data(min_requests, limit)}
        )
    except Exception as e:
        logger.exception("appointments/acceptance-rates failed")
        return create_response(status=500, message=str(e))


def _appointments_acceptance_rates_data(min_requests, limit):
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
    return _aggregate(AppointmentRequest, pipeline)


@admin_dashboard.route("/appointments/overview", methods=["GET"])
@admin_only
def appointments_overview():
    months = _int_arg("months", 12, lo=1, hi=36)
    min_requests = _int_arg("min_requests", 3, lo=1, hi=100)
    limit = _int_arg("limit", 20, lo=1, hi=100)
    try:
        return create_response(
            data={
                "summary": {"appointments": _summary_appointments(datetime.utcnow())},
                "by_month": _appointments_by_month_data(months),
                "top_mentors": _appointments_top_mentors_data(10),
                "acceptance_rates": _appointments_acceptance_rates_data(
                    min_requests, limit
                ),
            }
        )
    except Exception as e:
        logger.exception("appointments/overview failed")
        return create_response(status=500, message=str(e))


# ---------------------------------------------------------------------------
# Messaging
# ---------------------------------------------------------------------------


@admin_dashboard.route("/messages/by-day", methods=["GET"])
@admin_only
def messages_by_day():
    days = _int_arg("days", 90, lo=1, hi=365)
    try:
        return create_response(data={"buckets": _messages_by_day_data(days)})
    except Exception as e:
        logger.exception("messages/by-day failed")
        return create_response(status=500, message=str(e))


def _messages_by_day_data(days):
    since = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$type": "date", "$gte": since}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "messages": {"$sum": 1},
                "read": {"$sum": {"$cond": [{"$eq": ["$message_read", True]}, 1, 0]}},
                "unread": {
                    "$sum": {"$cond": [{"$eq": ["$message_read", False]}, 1, 0]}
                },
            }
        },
        {"$sort": {"_id": 1}},
        {
            "$project": {
                "_id": 0,
                "day": "$_id",
                "messages": 1,
                "read": 1,
                "unread": 1,
            }
        },
    ]
    return _aggregate(DirectMessage, pipeline)


@admin_dashboard.route("/messages/overview", methods=["GET"])
@admin_only
def messages_overview():
    days = _int_arg("days", 90, lo=1, hi=365)
    try:
        now = datetime.utcnow()
        return create_response(
            data={
                "summary": {"messaging": _summary_messaging(now)},
                "by_day": _messages_by_day_data(days),
            }
        )
    except Exception as e:
        logger.exception("messages/overview failed")
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


def _identity_normalization_project(field):
    return {
        "$project": {
            "norm": {
                "$let": {
                    "vars": {"lc": {"$toLower": {"$trim": {"input": f"${field}"}}}},
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
    }


def _identity_breakdown(model, field):
    pipeline = [
        {"$match": {field: {"$exists": True, "$nin": [None, "", " "]}}},
        _identity_normalization_project(field),
        {"$group": {"_id": "$norm", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$project": {"_id": 0, "value": "$_id", "count": 1}},
    ]
    items = _aggregate(model, pipeline)
    return items, sum(row["count"] for row in items)


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
    population = _str_arg("population", {"applications", "profiles"}, "applications")
    if population == "profiles" and source != "mentee":
        return create_response(
            status=400,
            message="Profile identity breakdown is only available for mentees",
        )

    if population == "profiles":
        model = MenteeProfile
        field = "gender"
        scope = "current profiles"
    else:
        model = MenteeApplication if source == "mentee" else NewMentorApplication
        field = "identify"
        scope = "all statuses"

    try:
        items, total = _identity_breakdown(model, field)
        meta = {
            "source": source,
            "population": population,
            "field": field,
            "scope": scope,
            "total": total,
        }
        return create_response(data={"items": items, "meta": meta})
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


@admin_dashboard.route("/users/overview", methods=["GET"])
@admin_only
def users_overview():
    try:
        profile_identify_items, profile_identify_total = _identity_breakdown(
            MenteeProfile, "gender"
        )
        return create_response(
            data={
                "summary": {"users": _summary_users()},
                "mentor_specializations": _top_n(
                    MentorProfile, "specializations", 15, unwind=True
                ),
                "mentee_profile_identify": {
                    "items": profile_identify_items,
                    "meta": {
                        "source": "mentee",
                        "population": "profiles",
                        "field": "gender",
                        "scope": "current profiles",
                        "total": profile_identify_total,
                    },
                },
            }
        )
    except Exception as e:
        logger.exception("users/overview failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/demographics/mentor-flags", methods=["GET"])
@admin_only
def demographics_mentor_flags():
    try:
        return create_response(data={"flags": _mentor_flags_data()})
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
    try:
        return create_response(data={"partners": _top_partners_data(role, limit)})
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
    try:
        return create_response(data={"buckets": _errors_by_day_data(days)})
    except Exception as e:
        logger.exception("errors/by-day failed")
        return create_response(status=500, message=str(e))


def _errors_by_day_data(days):
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
    return _aggregate(ErrorLog, pipeline)


@admin_dashboard.route("/ops/overview", methods=["GET"])
@admin_only
def ops_overview():
    error_days = _int_arg("error_days", 30, lo=1, hi=90)
    oauth_days = _int_arg("oauth_days", 60, lo=1, hi=365)
    try:
        now = datetime.utcnow()
        return create_response(
            data={
                "summary": {
                    "ops": _summary_ops(now),
                    "oauth": _summary_oauth(now),
                },
                "errors_by_day": _errors_by_day_data(error_days),
                "top_exceptions": _top_n(ErrorLog, "exception_type", 10),
                "top_error_endpoints": _top_n(ErrorLog, "endpoint", 10),
                "oauth_tokens_by_day": _oauth_tokens_by_day_data(oauth_days),
            }
        )
    except Exception as e:
        logger.exception("ops/overview failed")
        return create_response(status=500, message=str(e))


@admin_dashboard.route("/ops/hygiene", methods=["GET"])
@admin_only
def ops_hygiene():
    try:
        return create_response(data={"hygiene": _summary_hygiene()})
    except Exception as e:
        logger.exception("ops/hygiene failed")
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
    try:
        return create_response(data={"buckets": _oauth_tokens_by_day_data(days)})
    except Exception as e:
        logger.exception("oauth/tokens-by-day failed")
        return create_response(status=500, message=str(e))


def _oauth_tokens_by_day_data(days):
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
    return _aggregate(OAuthRefreshToken, pipeline)
