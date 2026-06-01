"""Profile the live MongoDB structure for dashboard planning.

This script is intentionally read-only and redacts raw user data. It reports
collection counts, sampled field/type shapes, null/empty rates, safe categorical
value distributions, and dashboard-specific cross-checks.

Usage:
    python backend/scripts/profile_database.py --output db_profile.json
    python backend/scripts/profile_database.py --sample-size 500 --pretty
"""

import argparse
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date, datetime
from decimal import Decimal

try:
    from bson import ObjectId
except ImportError:  # Allows --help / syntax checks outside the backend env.
    ObjectId = ()

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.normpath(os.path.join(_HERE, os.pardir))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

SENSITIVE_HINTS = {
    "address",
    "authorization",
    "biography",
    "body",
    "cell",
    "email",
    "firebase",
    "hash",
    "image",
    "intro",
    "linkedin",
    "message",
    "name",
    "notes",
    "password",
    "phone",
    "pin",
    "question",
    "redirect",
    "secret",
    "token",
    "uid",
    "url",
    "video",
    "website",
}

SAFE_CATEGORICAL_FIELDS = {
    "__v",
    "accepted",
    "allow_calls",
    "allow_texts",
    "application_state",
    "client_id",
    "email_notifications",
    "exception_type",
    "isColorPerson",
    "isEconomically",
    "isFamilyNative",
    "isMarginalized",
    "isSocial",
    "is_active",
    "is_private",
    "message_read",
    "offer_donation",
    "open_grants",
    "open_projects",
    "paused_flag",
    "readed",
    "restricted",
    "revoked",
    "role",
    "source",
    "status",
    "taking_appointments",
    "text_notifications",
    "token_endpoint_auth_method",
    "verified",
}

SAFE_ARRAY_FIELDS = {
    "allowed_scopes",
    "country",
    "grant_types",
    "immigrant_status",
    "language",
    "languages",
    "regions",
    "response_types",
    "sdgs",
    "specialist_categories",
    "specializations",
    "topics",
    "workstate",
}


def is_sensitive_path(path):
    parts = path.lower().replace("-", "_").split(".")
    return any(any(hint in part for hint in SENSITIVE_HINTS) for part in parts)


def leaf_name(path):
    return path.split(".")[-1]


def type_name(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, int) and not isinstance(value, bool):
        return "int"
    if isinstance(value, float):
        return "float"
    if isinstance(value, Decimal):
        return "decimal"
    if isinstance(value, str):
        return "str"
    if isinstance(value, datetime):
        return "datetime"
    if isinstance(value, date):
        return "date"
    if isinstance(value, ObjectId):
        return "object_id"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return type(value).__name__


def jsonable(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: jsonable(item) for key, item in value.items()}
    return value


def redacted_hash(value):
    raw = str(value).encode("utf-8", errors="ignore")
    return hashlib.sha256(raw).hexdigest()[:12]


def safe_value_for_distribution(path, value):
    name = leaf_name(path)
    if is_sensitive_path(path):
        return None
    if name in SAFE_CATEGORICAL_FIELDS:
        return jsonable(value)
    if name in SAFE_ARRAY_FIELDS and isinstance(value, str):
        return value
    if isinstance(value, bool):
        return value
    return None


def flatten_document(value, prefix="", out=None):
    if out is None:
        out = []
    if isinstance(value, dict):
        if not value and prefix:
            out.append((prefix, value))
        for key, item in value.items():
            next_prefix = f"{prefix}.{key}" if prefix else str(key)
            flatten_document(item, next_prefix, out)
    elif isinstance(value, list):
        out.append((prefix, value))
        for item in value[:10]:
            if isinstance(item, dict):
                flatten_document(item, f"{prefix}[]", out)
            else:
                out.append((f"{prefix}[]", item))
    else:
        out.append((prefix, value))
    return out


def sample_documents(collection, count, sample_size):
    if count == 0:
        return []
    size = min(sample_size, count)
    if count <= sample_size:
        return list(collection.find({}, limit=size))
    return list(collection.aggregate([{"$sample": {"size": size}}], allowDiskUse=True))


def profile_collection(collection, sample_size, top_values):
    count = collection.count_documents({})
    docs = sample_documents(collection, count, sample_size)
    field_stats = defaultdict(
        lambda: {
            "present": 0,
            "null": 0,
            "empty": 0,
            "types": Counter(),
            "array_item_types": Counter(),
            "safe_values": Counter(),
            "sensitive": False,
        }
    )

    for doc in docs:
        seen = set()
        for path, value in flatten_document(doc):
            if not path:
                continue
            seen.add(path)
            stats = field_stats[path]
            stats["sensitive"] = stats["sensitive"] or is_sensitive_path(path)
            stats["types"][type_name(value)] += 1
            if value is None:
                stats["null"] += 1
            if value == "" or value == [] or value == {}:
                stats["empty"] += 1
            if isinstance(value, list):
                for item in value:
                    stats["array_item_types"][type_name(item)] += 1
                    safe_item = safe_value_for_distribution(path, item)
                    if safe_item is not None:
                        stats["safe_values"][
                            json.dumps(jsonable(safe_item), sort_keys=True)
                        ] += 1
            else:
                safe_value = safe_value_for_distribution(path, value)
                if safe_value is not None:
                    stats["safe_values"][
                        json.dumps(jsonable(safe_value), sort_keys=True)
                    ] += 1
        for path in seen:
            field_stats[path]["present"] += 1

    fields = {}
    for path, stats in sorted(field_stats.items()):
        value_counts = []
        for raw, n in stats["safe_values"].most_common(top_values):
            value_counts.append({"value": json.loads(raw), "count": n})
        fields[path] = {
            "present_in_sample": stats["present"],
            "missing_in_sample": len(docs) - stats["present"],
            "null_in_sample": stats["null"],
            "empty_in_sample": stats["empty"],
            "types": dict(stats["types"].most_common()),
            "array_item_types": dict(stats["array_item_types"].most_common()),
            "sensitive": stats["sensitive"],
            "top_safe_values": value_counts,
        }

    return {
        "count": count,
        "sampled": len(docs),
        "fields": fields,
    }


def value_counts(collection, field, limit=20, match=None, unwind=False):
    pipeline = []
    if match:
        pipeline.append({"$match": match})
    if unwind:
        pipeline.append({"$unwind": f"${field}"})
    pipeline.extend(
        [
            {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit},
            {"$project": {"_id": 0, "value": "$_id", "count": 1}},
        ]
    )
    return [jsonable(row) for row in collection.aggregate(pipeline, allowDiskUse=True)]


def build_dashboard_cross_checks(db):
    collections = db.list_collection_names()
    checks = {}

    if "users" in collections:
        users = db["users"]
        checks["users_by_role"] = value_counts(users, "role")

    if "mentee_application" in collections:
        mentees = db["mentee_application"]
        checks["mentee_applications"] = {
            "by_state": value_counts(mentees, "application_state"),
            "top_countries": value_counts(
                mentees,
                "Country",
                match={"Country": {"$exists": True, "$nin": [None, "", " "]}},
            ),
            "top_topics": value_counts(mentees, "topics", unwind=True),
            "top_immigrant_status": value_counts(
                mentees, "immigrant_status", unwind=True
            ),
        }

    if "new_mentor_application" in collections:
        mentors = db["new_mentor_application"]
        checks["mentor_applications"] = {
            "by_state": value_counts(mentors, "application_state"),
            "demographic_flag_counts": list(
                mentors.aggregate(
                    [
                        {
                            "$group": {
                                "_id": None,
                                "total": {"$sum": 1},
                                "color": {
                                    "$sum": {
                                        "$cond": [
                                            {"$eq": ["$isColorPerson", True]},
                                            1,
                                            0,
                                        ]
                                    }
                                },
                                "marginalized": {
                                    "$sum": {
                                        "$cond": [
                                            {"$eq": ["$isMarginalized", True]},
                                            1,
                                            0,
                                        ]
                                    }
                                },
                                "native": {
                                    "$sum": {
                                        "$cond": [
                                            {"$eq": ["$isFamilyNative", True]},
                                            1,
                                            0,
                                        ]
                                    }
                                },
                                "economically": {
                                    "$sum": {
                                        "$cond": [
                                            {"$eq": ["$isEconomically", True]},
                                            1,
                                            0,
                                        ]
                                    }
                                },
                                "immigrant": {
                                    "$sum": {
                                        "$cond": [
                                            {"$eq": ["$immigrant_status", True]},
                                            1,
                                            0,
                                        ]
                                    }
                                },
                            }
                        },
                        {"$project": {"_id": 0}},
                    ],
                    allowDiskUse=True,
                )
            ),
        }

    if "appointment_request" in collections:
        appointments = db["appointment_request"]
        checks["appointments"] = {
            "by_status": value_counts(appointments, "status"),
            "legacy_accepted": value_counts(appointments, "accepted"),
        }

    if "direct_message" in collections:
        messages = db["direct_message"]
        checks["messages"] = {
            "read_state": value_counts(messages, "message_read"),
        }

    profile_counts = {}
    for collection_name in [
        "mentee_profile",
        "mentor_profile",
        "partner_profile",
        "hub",
    ]:
        if collection_name in collections:
            profile_counts[collection_name] = db[collection_name].count_documents({})
    checks["profile_counts"] = profile_counts
    return checks


def run(sample_size, top_values):
    from dotenv import load_dotenv
    from pymongo import MongoClient

    load_dotenv(os.path.join(_BACKEND, ".env"))
    load_dotenv()

    user = os.environ.get("MONGO_USER")
    password = os.environ.get("MONGO_PASSWORD")
    db_name = os.environ.get("MONGO_DB")
    host_template = os.environ.get("MONGO_HOST")
    if not db_name or not host_template:
        raise RuntimeError("MONGO_DB and MONGO_HOST must be set.")

    host = host_template
    if "%" in host_template:
        host = host_template % (user, password, db_name)

    client = MongoClient(host)
    try:
        db = client[db_name]
        collection_names = sorted(db.list_collection_names())
        report = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "database": db.name,
            "redaction": {
                "raw_sensitive_values": "omitted",
                "sensitive_field_detection": sorted(SENSITIVE_HINTS),
                "safe_value_fields": sorted(
                    SAFE_CATEGORICAL_FIELDS | SAFE_ARRAY_FIELDS
                ),
            },
            "collections": {},
            "dashboard_cross_checks": build_dashboard_cross_checks(db),
        }
        for collection_name in collection_names:
            if collection_name.startswith("system."):
                continue
            report["collections"][collection_name] = profile_collection(
                db[collection_name], sample_size, top_values
            )
        return report
    finally:
        client.close()


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Generate a redacted structure profile of the live MongoDB."
    )
    parser.add_argument("--sample-size", type=int, default=1000)
    parser.add_argument("--top-values", type=int, default=20)
    parser.add_argument("--output", help="Write report JSON to this path.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON.")
    args = parser.parse_args(argv)

    report = run(
        sample_size=max(1, args.sample_size), top_values=max(1, args.top_values)
    )
    payload = json.dumps(
        report,
        indent=2 if args.pretty else None,
        sort_keys=True,
        default=jsonable,
    )
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(payload)
            f.write("\n")
    else:
        print(payload)


if __name__ == "__main__":
    main()
