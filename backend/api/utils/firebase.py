import pyrebase
import os

client = pyrebase.initialize_app(
    {
        "apiKey": os.environ.get("FIREBASE_API_KEY"),
        "authDomain": "mentee-d0304.firebaseapp.com",
        "databaseURL": "",
        "storageBucket": "mentee-d0304.appspot.com",
        "serviceAccount": os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"),
        
    }
)
