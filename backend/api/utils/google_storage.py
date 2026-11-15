from PIL import Image
from google.cloud import storage
import boto3
from botocore.config import Config
from api.core import logger
from io import BytesIO
import base64
import datetime
from uuid import uuid4
import os
from urllib.parse import quote

client = storage.Client()
BUCKET = os.environ.get("GCS_BUCKET", "app-mentee-global-images")


def _railway_bucket():
    return os.environ.get("AWS_S3_BUCKET_NAME")


def _railway_client():
    return boto3.client(
        "s3",
        endpoint_url=os.environ["AWS_ENDPOINT_URL"],
        region_name=os.environ.get("AWS_DEFAULT_REGION", "auto"),
        config=Config(s3={"addressing_style": "virtual"}),
    )


def _railway_file_url(filename):
    domain = os.environ["RAILWAY_PUBLIC_DOMAIN"]
    return f"https://{domain}/api/storage/{quote(filename, safe='/')}"


def read_railway_file(filename):
    response = _railway_client().get_object(Bucket=_railway_bucket(), Key=filename)
    return response["Body"].read(), response.get(
        "ContentType", "application/octet-stream"
    )


def upload_image_to_storage(image, filename):
    """Upload an image to the configured object store."""
    if _railway_bucket():
        key = f"images/{filename}"
        _railway_client().put_object(
            Bucket=_railway_bucket(),
            Key=key,
            Body=image.read(),
            ContentType="image/jpeg",
        )
        return _railway_file_url(key)
    bucket = client.get_bucket(BUCKET)
    blob = bucket.blob(filename)
    blob.upload_from_string(image.read(), content_type="application/jpg")
    return blob.public_url


def upload_bug_report_attachment(file_content_base64, original_filename, content_type):
    """
    Upload a bug report attachment to the configured object store.

    :param file_content_base64: Base64 encoded file content
    :param original_filename: Original filename
    :param content_type: MIME type of the file
    :return: tuple (public_url, gcs_filename)
    """
    try:
        # Decode base64 content
        file_data = base64.b64decode(file_content_base64)

        # Generate unique filename: bug-reports/timestamp_uuid_originalname
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid4())[:8]
        # Sanitize filename
        safe_filename = "".join(
            c for c in original_filename if c.isalnum() or c in "._- "
        )
        gcs_filename = f"bug-reports/{timestamp}_{unique_id}_{safe_filename}"

        if _railway_bucket():
            gcs_filename = f"bug-reports/{timestamp}_{uuid4().hex}_{safe_filename}"
            _railway_client().put_object(
                Bucket=_railway_bucket(),
                Key=gcs_filename,
                Body=file_data,
                ContentType=content_type,
            )
            return _railway_file_url(gcs_filename), gcs_filename

        # Upload to GCS
        bucket = client.get_bucket(BUCKET)
        blob = bucket.blob(gcs_filename)
        blob.upload_from_string(file_data, content_type=content_type)

        # Note: Bucket has uniform bucket-level access enabled
        # Public access is controlled at bucket level, not per-object

        logger.info(f"Uploaded bug report attachment: {gcs_filename}")
        return blob.public_url, gcs_filename

    except Exception as e:
        logger.error(f"Failed to upload bug report attachment {original_filename}: {e}")
        raise


def delete_image_from_storage(filename):
    """Delete an image from the configured object store."""
    if _railway_bucket():
        _railway_client().delete_object(
            Bucket=_railway_bucket(), Key=f"images/{filename}"
        )
        return True
    bucket = client.get_bucket(BUCKET)
    blob = bucket.blob(filename)
    blob.delete()
    return True


def get_image_from_storage(filename):
    """Get image from Google Cloud Storage and use it to create a signed URL"""
    bucket = client.get_bucket(BUCKET)
    blob = bucket.blob(filename)
    url = blob.generate_signed_url(
        version="v4",
        # This URL is valid for 15 minutes
        expiration=datetime.timedelta(minutes=15),
        # Allow GET requests using this URL.
        method="GET",
    )
    return url


def compress_image(image):
    """Compress image to reduce size"""
    image = Image.open(image)
    image = image.convert("RGB")
    image.thumbnail((500, 500))
    image_io = BytesIO()
    image.save(image_io, "JPEG", quality=70)
    image_io.seek(0)
    return image_io
