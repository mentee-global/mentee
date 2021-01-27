import os

AUTH_URL = (
    "h4i-mentee-auth.vercel.app"
    if os.environ.get("DEPLOYMENT") == "prod"
    else "https://mentee-auth-dev.vercel.app"
)

# Template ID that can be created through sendgrid's UI
# https://sendgrid.com/docs/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates/
MENTOR_APPT_TEMPLATE = "d-3a2b51466e6541ffa052a197ced08c18"
MENTEE_APPT_TEMPLATE = "d-2ce963b36c91457c89c916a111d658bd"

APPT_TIME_FORMAT = "%m-%d-%Y at %I:%M%p GMT"
