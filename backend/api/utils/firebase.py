import pyrebase
import os

client = pyrebase.initialize_app(
    {
        "apiKey": os.environ.get("FIREBASE_API_KEY"),
        "authDomain": "mentee-d0304.firebaseapp.com",
        "databaseURL": "",
        "storageBucket": "mentee-d0304.appspot.com",
        "serviceAccount": {
            "type": "service_account",
            "project_id": "mentee-d0304",
            "private_key_id": os.environ.get('FIREBASE_PRIVATE_KEY_ID'),
            "private_key": os.environ.get('FIREBASE_PRIVATE_KEY'),
            "client_email": os.environ.get('FIREBASE_CLIENT_EMAIL'),
            "client_id": os.environ.get('FIREBASE_CLIENT_ID'),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.environ.get('FIREBASE_CLIENT_X509_CERT_URL')
        },
    }
)
