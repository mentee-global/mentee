import os


def email_delivery_enabled():
    return os.environ.get("EMAIL_DELIVERY_ENABLED", "true").lower() == "true"


def sms_delivery_enabled():
    return os.environ.get("SMS_DELIVERY_ENABLED", "true").lower() == "true"
