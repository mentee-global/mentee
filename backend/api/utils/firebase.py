import pyrebase
import os
from api.utils.secure_env import SecureEnvironmentManager

client = pyrebase.initialize_app(
    {
        "apiKey": SecureEnvironmentManager.get_required_env("FIREBASE_API_KEY"),
        "authDomain": "mentee-d0304.firebaseapp.com",
        "databaseURL": "",
        "storageBucket": "mentee-d0304.appspot.com",
        "serviceAccount": SecureEnvironmentManager.get_optional_env(
            "GOOGLE_APPLICATION_CREDENTIALS"
        ),
    }
)
