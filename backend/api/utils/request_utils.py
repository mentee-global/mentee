import os
from typing import List, Optional, Union
from wtforms import Form
from wtforms.fields import StringField, BooleanField, FieldList, IntegerField, FormField

# from wtforms.fields.core import DateField, DateTimeField
from wtforms.validators import InputRequired
from wtforms import validators
import wtforms_json
from typing import Tuple
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client as TwilioClient
from .flask_imgur import Imgur
from api.models import (
    MentorProfile,
    MenteeProfile,
    Admin,
    Guest,
    PartnerProfile,
    MenteeApplication,
    NewMentorApplication,
    PartnerApplication,
)
from api.utils.constants import Account, TARGET_LANGS

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
    majors = FieldList(StringField(), validators=[validators.DataRequired()])
    school = StringField(validators=[InputRequired()])
    graduation_year = IntegerField(validators=[InputRequired()])


class VideoForm(Form):
    title = StringField(validators=[InputRequired()])
    url = StringField(validators=[InputRequired()])
    tag = StringField(validators=[InputRequired()])
    date_uploaded = StringField(validators=[InputRequired()])


class MentorForm(Form):
    firebase_uid = StringField(validators=[InputRequired()])
    email = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    professional_title = StringField(validators=[InputRequired()])
    languages = FieldList(StringField(), validators=[validators.DataRequired()])
    specializations = FieldList(StringField(), validators=[validators.DataRequired()])


class MenteeForm(Form):
    firebase_uid = StringField(validators=[InputRequired()])
    email = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    age = StringField(validators=[InputRequired()])
    gender = StringField(validators=[InputRequired()])
    languages = FieldList(StringField(), validators=[validators.DataRequired()])
    organization = StringField(validators=[InputRequired()])


class PartnerForm(Form):
    firebase_uid = StringField(validators=[InputRequired()])
    email = StringField(validators=[InputRequired()])
    organization = StringField(validators=[InputRequired()])
    location = StringField(validators=[InputRequired()])
    intro = StringField(validators=[InputRequired()])
    regions = FieldList(StringField(), validators=[validators.DataRequired()])
    sdgs = FieldList(StringField(), validators=[validators.DataRequired()])


class AvailabilityForm(Form):
    start_time = StringField(validators=[InputRequired()])
    end_time = StringField(validators=[InputRequired()])


class MessageForm(Form):
    message = StringField(validators=[InputRequired()])
    user_name = StringField(validators=[InputRequired()])
    user_id = StringField(validators=[InputRequired()])
    recipient_name = StringField(validators=[InputRequired()])
    recipient_id = StringField(validators=[InputRequired()])
    email = StringField()
    link = StringField()
    time = StringField(validators=[InputRequired()])


class DirectMessageForm(Form):
    body = StringField(validators=[InputRequired()])
    message_read = BooleanField(validators=[InputRequired()])
    recipient_id = StringField(validators=[InputRequired()])
    sender_id = StringField(validators=[InputRequired()])
    created_at = StringField(validators=[InputRequired()])


class ApppointmentForm(Form):
    mentor_id = StringField(validators=[InputRequired()])
    mentee_id = StringField(validators=[InputRequired()])
    timeslot = FormField(AvailabilityForm)
    topic = StringField(validators=[InputRequired()])
    status = StringField(validators=[InputRequired()])


class MentorApplicationForm(Form):
    email = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    cell_number = StringField(validators=[InputRequired()])
    hear_about_us = StringField(validators=[InputRequired()])
    offer_donation = StringField(validators=[InputRequired()])
    employer_name = StringField(validators=[InputRequired()])
    role_description = StringField(validators=[InputRequired()])
    languages = StringField(validators=[InputRequired()])
    referral = StringField()
    knowledge_location = StringField(validators=[InputRequired()])
    identify = StringField(validators=[InputRequired()])
    pastLiveLocation = StringField(validators=[InputRequired()])
    role = StringField(validators=[InputRequired()])


class MenteeApplicationForm(Form):
    email = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    age = StringField(validators=[InputRequired()])
    immigrant_status = FieldList(StringField(), validators=[validators.DataRequired()])
    identify = StringField(validators=[InputRequired()])
    language = StringField(validators=[InputRequired()])
    topics = FieldList(StringField(), validators=[validators.DataRequired()])
    workstate = FieldList(StringField(), validators=[validators.DataRequired()])
    isSocial = StringField(validators=[InputRequired()])
    role = StringField(validators=[InputRequired()])


class PartnerApplicationForm(Form):
    email = StringField(validators=[InputRequired()])
    organization = StringField(validators=[InputRequired()])
    contanctPerson = StringField(validators=[InputRequired()])
    personEmail = StringField(validators=[InputRequired()])
    relationShip = FieldList(StringField(), validators=[validators.DataRequired()])
    SDGS = FieldList(StringField(), validators=[validators.DataRequired()])
    howBuild = StringField(validators=[InputRequired()])
    role = StringField(validators=[InputRequired()])


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
    recipient: Optional[Union[str, List[str]]],
    subject: str = "",
    data: dict = None,
    template_id: str = "",
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
        # Set default language to English if no language is specified
        if len(TARGET_LANGS.intersection(data.keys())) == 0:
            data["en-US"] = True
        message.dynamic_template_data = data
    else:
        message.dynamic_template_data = {"en-US": True}

    try:
        sg = SendGridAPIClient(sendgrid_key)
        sg.send(message)
    except Exception as e:
        return False, str(e)

    return True, ""


def send_email_html(
    recipient: str = "", subject: str = "", html_content: str = ""
) -> Tuple[bool, str]:
    if not recipient:
        return False, "Missing recipient email"

    message = Mail(
        from_email=sender_email,
        to_emails=recipient,
        subject=subject,
        html_content=html_content,
    )
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


def get_profile_model(role):
    if role == Account.MENTOR:
        return MentorProfile
    elif role == Account.MENTEE:
        return MenteeProfile
    elif role == Account.ADMIN:
        return Admin
    elif role == Account.PARTNER:
        return PartnerProfile
    elif role == Account.GUEST:
        return Guest


def application_model(role):
    if role == Account.MENTOR:
        return NewMentorApplication
    elif role == Account.MENTEE:
        return MenteeApplication
    elif role == Account.ADMIN:
        return Admin
    elif role == Account.PARTNER:
        return PartnerApplication
    elif role == Account.GUEST:
        return Guest
