import pyrebase
import os

client = pyrebase.initialize_app(
    {
        "apiKey": os.environ.get("FIREBASE_API_KEY"),
        "authDomain": os.environ.get(
            "FIREBASE_AUTH_DOMAIN", "mentee-d0304.firebaseapp.com"
        ),
        "databaseURL": "",
        "storageBucket": os.environ.get(
            "FIREBASE_STORAGE_BUCKET", "mentee-d0304.appspot.com"
        ),
        "serviceAccount": os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
    }
)
