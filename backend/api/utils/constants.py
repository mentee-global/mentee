from enum import Enum

# Template ID that can be created through sendgrid's UI
# https://sendgrid.com/docs/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates/
MENTOR_APPT_TEMPLATE = "d-3a2b51466e6541ffa052a197ced08c18"
MENTEE_APPT_TEMPLATE = "d-2ce963b36c91457c89c916a111d658bd"
USER_VERIFICATION_TEMPLATE = "d-7bd09ab8f8484cee9227a9a25ad527ec"
USER_FORGOT_PASSWORD_TEMPLATE = "d-df1adcced8ab461ca72ceae5eecfc566"
MENTOR_APP_OFFER = "d-3a7a5db2cf4e412e9e68e729a7b52813"
MENTOR_CONTACT_ME = "d-d6c6d8f33c3b4970937a9dbd85f97d1a"
WEEKLY_NOTIF_REMINDER = "d-9155757f51f14d538a613881bf0211d6"
MENTOR_APP_SUBMITTED = "d-753727e2c7df4509b251a576645d829a"
MENTEE_APP_SUBMITTED = "d-e4106f84494a44a58c81916c509b351c"
MENTOR_APP_REJECTED = "d-5158980fcf9a4247b018ef0d832d796c"
APP_APROVED = "d-0948fea82e3c4f9981ded9a27103fb62"
TRAINING_COMPLETED = "d-acf4c50c1e454fb0adc33b5c41800650"
PROFILE_COMPLETED = "d-45980b6e8f3441d29c71a5b2e6d67fe6"
UNREAD_MESSAGE_TEMPLATE = "d-7c75b1b696bb49a7850430d6a1b81ad4"
NEW_TRAINING_TEMPLATE = "d-0716a65e079843b59eef281809e07f5b"
SEND_INVITE_TEMPLATE = "d-f6405bbbafd144efa76a58814ac2f8f3"
# This lacks timezone so you'll need to add that according to whatever code you're working with
APPT_TIME_FORMAT = "%m-%d-%Y at %I:%M%p"

# legacy roles (moved to Account Enum)
MENTOR_ROLE = "mentor"
MENTEE_ROLE = "mentee"
ADMIN_ROLE = "admin"
PARTNER_ROLE = "partner"

# Account types
NEW_APPLICATION_STATUS = {
    "PENDING": "PENDING",
    "APPROVED": "APPROVED",
    "BUILDPROFILE": "BuildProfile",
    "COMPLETED": "COMPLETED",
    "REJECTED": "REJECTED",
}


class Account(Enum):
    ADMIN = 0
    MENTOR = 1
    MENTEE = 2
    PARTNER = 3

    def __eq__(self, other):
        return self.value == other


# Mentor Application Status
MENTOR_APP_STATES = {
    "PENDING": "Pending",
    "REVIEWED": "Reviewed",
    "REJECTED": "Rejected",
    "OFFER_MADE": "Offer Made",
}
TRAINING_TYPE = {"LINK": "LINK", "VIDEO": "VIDEO", "DOCUMENT": "DOCUMENT"}
# Appointment Status
APPT_STATUS = {
    "PENDING": "pending",
    "DENIED": "denied",
    "ACCEPTED": "accepted",
    "REJECTED": "Rejected",
}

I18N_LANGUAGES = {
    "es-US",
    "pt-BR",
    "ar",
    "fa-AF",
}
