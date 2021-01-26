import os

AUTH_URL = (
    "h4i-mentee-auth.vercel.app"
    if os.environ.get("DEPLOYMENT") == "prod"
    else "https://mentee-auth-dev.vercel.app"
)

# Follow this to see how to change the email
# https://sendgrid.com/docs/ui/sending-email/sender-verification/

# Template ID that can be created through sendgrid's UI
# https://sendgrid.com/docs/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates/
APPT_NOTIFICATION_TEMPLATE = "d-3a2b51466e6541ffa052a197ced08c18"
