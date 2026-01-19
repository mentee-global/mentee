from PIL import Image
from google.cloud import storage
from api.core import logger
from io import BytesIO
import base64
import datetime
from uuid import uuid4

client = storage.Client()
BUCKET = "app-mentee-global-images"


def upload_image_to_storage(image, filename):
    """Upload image to Google Cloud Storage"""
    bucket = client.get_bucket(BUCKET)
    blob = bucket.blob(filename)
    blob.upload_from_string(image.read(), content_type="application/jpg")
    return blob.public_url


def upload_bug_report_attachment(file_content_base64, original_filename, content_type):
    """
    Upload bug report attachment to Google Cloud Storage
    
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
        safe_filename = "".join(c for c in original_filename if c.isalnum() or c in "._- ")
        gcs_filename = f"bug-reports/{timestamp}_{unique_id}_{safe_filename}"
        
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
    """Delete image from Google Cloud Storage"""
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
