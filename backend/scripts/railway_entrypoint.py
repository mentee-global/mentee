import json
import os
import sys
import tempfile
from urllib.parse import urlsplit


def validate_preview_database():
    mongo_url = urlsplit(os.environ.get("MONGO_URI", ""))
    mongo_host = mongo_url.hostname or ""
    if mongo_url.scheme not in ("mongodb", "mongodb+srv"):
        raise RuntimeError("Preview requires a MongoDB connection URI")
    if "," in mongo_url.netloc.rsplit("@", 1)[-1]:
        raise RuntimeError("Preview requires a single verified MongoDB host")
    if mongo_host == "cluster0.bjvbg.mongodb.net":
        database = "mentee"
    elif mongo_host.endswith(".railway.internal"):
        database = "mentee_preview"
    else:
        raise RuntimeError(
            "Preview permits only the verified development Atlas cluster "
            "or a private Railway MongoDB connection"
        )
    if os.environ.get("MONGO_DB") != database:
        raise RuntimeError(f"Preview requires MONGO_DB={database} for this host")
    if mongo_url.path not in ("", "/", f"/{database}"):
        raise RuntimeError(f"Preview MongoDB URI must use {database}")


def validate_production_database():
    mongo_url = urlsplit(os.environ.get("MONGO_URI", ""))
    if mongo_url.scheme != "mongodb":
        raise RuntimeError("Railway production requires a MongoDB connection URI")
    if mongo_url.hostname != "mongodb-prod.railway.internal":
        raise RuntimeError("Railway production requires its private MongoDB service")
    if os.environ.get("MONGO_DB") != "mentee" or mongo_url.path != "/mentee":
        raise RuntimeError("Railway production requires the mentee database")


def prepare_environment():
    credentials_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
    if os.environ.get("RAILWAY_PREVIEW", "false").lower() == "true":
        validate_preview_database()
        credentials = json.loads(credentials_json or "{}")
        project_id = credentials.get("project_id")
        if not project_id:
            raise RuntimeError("Preview requires Google/Firebase project credentials")
        firebase_config = json.loads(os.environ.get("REACT_APP_FIREBASE_CONFIG", "{}"))
        if firebase_config.get("projectId") != project_id:
            raise RuntimeError(
                "Preview Firebase configuration must match Google credentials"
            )
        for field, variable in (
            ("apiKey", "FIREBASE_API_KEY"),
            ("authDomain", "FIREBASE_AUTH_DOMAIN"),
            ("storageBucket", "FIREBASE_STORAGE_BUCKET"),
        ):
            if not firebase_config.get(field):
                raise RuntimeError(f"Preview Firebase configuration requires {field}")
            os.environ[variable] = firebase_config[field]
        if os.environ.get("AWS_S3_BUCKET_NAME"):
            for variable in (
                "AWS_ENDPOINT_URL",
                "AWS_ACCESS_KEY_ID",
                "AWS_SECRET_ACCESS_KEY",
                "RAILWAY_PUBLIC_DOMAIN",
            ):
                if not os.environ.get(variable):
                    raise RuntimeError(f"Preview storage requires {variable}")
        else:
            bucket = os.environ.get("GCS_BUCKET")
            if not bucket or bucket == "app-mentee-global-images":
                raise RuntimeError("Preview requires separate object storage")
        os.environ["EMAIL_DELIVERY_ENABLED"] = "false"
        os.environ["SMS_DELIVERY_ENABLED"] = "false"

    if os.environ.get("RAILWAY_ENVIRONMENT_NAME") == "production":
        if os.environ.get("RAILWAY_PREVIEW", "false").lower() == "true":
            raise RuntimeError("Railway production cannot use preview mode")
        validate_production_database()
        if not os.environ.get("AWS_S3_BUCKET_NAME"):
            raise RuntimeError("Railway production requires its object storage bucket")
        if not os.environ.get("RAILWAY_PUBLIC_DOMAIN"):
            raise RuntimeError("Railway production requires a public domain")

    if credentials_json:
        with tempfile.NamedTemporaryFile(
            mode="w", prefix="mentee-google-", suffix=".json", delete=False
        ) as credentials_file:
            credentials_file.write(credentials_json)
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_file.name


def main():
    service = sys.argv[1] if len(sys.argv) > 1 else "web"
    commands = {
        "web": [
            "gunicorn",
            "--bind",
            f"0.0.0.0:{os.environ.get('PORT', '8000')}",
            "--workers",
            "1",
            "--threads",
            "256",
            "--worker-class",
            "eventlet",
            "manage:app",
        ],
    }
    if service not in commands:
        raise SystemExit("Choose web")
    prepare_environment()
    command = commands[service]
    os.execvp(command[0], command)


if __name__ == "__main__":
    main()
