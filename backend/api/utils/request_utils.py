import os
from wtforms import Form
from wtforms.fields import StringField, BooleanField, FieldList, IntegerField, FormField
from wtforms.validators import InputRequired
from wtforms import validators
import wtforms_json
from typing import Tuple
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client as TwilioClient
from .flask_imgur import Imgur

wtforms_json.init()

imgur_key = os.environ.get("IMGUR_KEY")
imgur_client = Imgur(client_id=imgur_key)

sendgrid_key = os.environ.get("SENDGRID_API_KEY")
sender_email = os.environ.get("SENDER_EMAIL")

twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
twilio_token = os.environ.get("TWILIO_AUTH_TOKEN")
twilio_phone = os.environ.get("TWILIO_PHONE")
twilio_client = TwilioClient(twilio_sid, twilio_token)


class EducationForm(Form):
    education_level = StringField(validators=[InputRequired()])
    majors = FieldList(StringField(), validators=[validators.required()])
    school = StringField(validators=[InputRequired()])
    graduation_year = IntegerField(validators=[InputRequired()])


class VideoForm(Form):
    title = StringField(validators=[InputRequired()])
    url = StringField(validators=[InputRequired()])
    tag = StringField(validators=[InputRequired()])
    date_uploaded = StringField(validators=[InputRequired()])


class MentorForm(Form):
    user_id = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    professional_title = StringField(validators=[InputRequired()])
    languages = FieldList(StringField(), validators=[validators.required()])
    specializations = FieldList(StringField(), validators=[validators.required()])


class MenteeForm(Form):
    user_id = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    age = StringField(validators=[InputRequired()])
    gender = StringField(validators=[InputRequired()])
    languages = FieldList(StringField(), validators=[validators.required()])
    organization = StringField(validators=[InputRequired()])


class AvailabilityForm(Form):
    start_time = StringField(validators=[InputRequired()])
    end_time = StringField(validators=[InputRequired()])


class ApppointmentForm(Form):
    mentor_id = StringField(validators=[InputRequired()])
    timeslot = FormField(AvailabilityForm)
    name = StringField(validators=[InputRequired()])
    email = StringField(validators=[InputRequired()])
    phone_number = StringField()
    languages = FieldList(StringField(), validators=[validators.required()])
    age = StringField(validators=[InputRequired()])
    gender = StringField(validators=[InputRequired()])
    location = StringField()
    specialist_categories = FieldList(StringField(), validators=[validators.required()])
    message = StringField()
    organization = StringField(validators=[InputRequired()])


def is_invalid_form(form_data) -> Tuple[str, bool]:
    """Using WTForms, validates the inputed form based on above schemas
    :param form_data - From the POST Request converted from JSON
    :return Tuple of an error message and if it is invalid or not
    """
    if not form_data.validate():
        msg = ", ".join(form_data.errors.keys())
        return "Missing fields " + msg, True
    return "", False


def send_email(
    recipient: str = "", subject: str = "", data: dict = None, template_id: str = ""
) -> Tuple[bool, str]:
    """Sends an email to a specific email address from the official MENTEE email
    :param recipient - a single recipient's email address
    :param subject - subject headline of the email
    :param data - data params within the email
    :return boolean whether it successfully sent an email

    When you want to send a personalized email you'll need to define the keys of such dictionary (the data param)
     - First make sure the name matches exactly as the handlebar name you created within the UI of SendGrid.
     - {{ date }} in handlebar syntax (which is in the template) should have the key 'date' in the data dictionary

    IMPORTANT:
     - Make sure you have the template-id within the `utils/const.py`
     - This only supports a single recipient it cannot be sent it to multiple emails
        - https://www.twilio.com/blog/sending-bulk-email-sendgrid-python

    This uses Dynamic Templates along with handlebars which allows the ability of personalizing emails through variables.
     - Handlebar Syntax
        - https://sendgrid.com/docs/for-developers/sending-email/using-handlebars/#use-cases
     - Dynamic Templates
        - https://sendgrid.com/docs/ui/sending-email/how-to-send-an-email-with-dynamic-transactional-templates/
     - Changing Sender Email
        - https://sendgrid.com/docs/ui/sending-email/sender-verification/
    """
    if not recipient:
        return False, "Missing recipient email"

    message = Mail(
        from_email=sender_email,
        to_emails=recipient,
        subject=subject,
    )

    if template_id:
        message.template_id = template_id

    if data:
        message.dynamic_template_data = data

    try:
        sg = SendGridAPIClient(sendgrid_key)
        sg.send(message)
    except Exception as e:
        return False, str(e)

    return True, ""


def send_sms(text: str = "", recipient: str = "") -> Tuple[bool, str]:
    """Send an SMS using Twilio from the provided phone number in .env
    :param text - this is the body of the text message
    :param recipient - so far this is only limited to US/CA phone numbers
    :returns boolean if successfully send a message

    Check out here to see the account details of Twilio
    https://www.twilio.com/console
    """
    if not recipient or not text:
        return False, "Empty recipient number or text"
    try:
        res = twilio_client.messages.create(body=text, from_=twilio_phone, to=recipient)
    except Exception as e:
        return False, str(e)

    return True, ""
