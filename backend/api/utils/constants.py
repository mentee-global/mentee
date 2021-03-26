import os
from enum import Enum

AUTH_URL = (
    "https://h4i-mentee-auth.vercel.app"
    if os.environ.get("DEPLOYMENT") == "prod"
    else "https://mentee-auth-dev.vercel.app"
)

# Template ID that can be created through sendgrid's UI
# https://sendgrid.com/docs/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates/
MENTOR_APPT_TEMPLATE = "d-3a2b51466e6541ffa052a197ced08c18"
MENTEE_APPT_TEMPLATE = "d-2ce963b36c91457c89c916a111d658bd"
MENTOR_APP_OFFER = "d-3a7a5db2cf4e412e9e68e729a7b52813"

# This lacks timezone so you'll need to add that according to whatever code you're working with
APPT_TIME_FORMAT = "%m-%d-%Y at %I:%M%p"

# Account types
class Account(Enum):
    ADMIN = 0
    MENTOR = 1
    MENTEE = 2

    def __eq__(self, other):
        return self.value == other

# Mentor Application Status
MENTOR_APP_STATES = {
  "PENDING": "Pending",
  "REVIEWED": "Reviewed",
  "REJECTED": "Rejected",
  "OFFER_MADE": "Offer Made",
}
