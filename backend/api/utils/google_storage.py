from PIL import Image
from google.cloud import storage
from api.core import logger
from io import BytesIO

client = storage.Client()
BUCKET = "app-mentee-global-images"


def upload_image_to_storage(image, filename):
   
    bucket = client.get_bucket(BUCKET)
    blob = bucket.blob(filename)
    blob.upload_from_string(image.read(), content_type="application/jpg")
    return blob.public_url


def delete_image_from_storage(filename):
    
    bucket = client.get_bucket(BUCKET)
    blob = bucket.blob(filename)
    blob.delete()
    return True


def get_image_from_storage(filename):
    
    bucket = client.get_bucket(BUCKET)
    blob = bucket.blob(filename)
    url = blob.generate_signed_url(
        version="v4",
        
        expiration=datetime.timedelta(minutes=15),
        
        method="GET",
    )
    return url


def compress_image(image):
    
    image = Image.open(image)
    image = image.convert("RGB")
    image.thumbnail((500, 500))
    image_io = BytesIO()
    image.save(image_io, "JPEG", quality=70)
    image_io.seek(0)
    return image_io
