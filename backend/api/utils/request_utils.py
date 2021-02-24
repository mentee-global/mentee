import os
from wtforms import Form
from wtforms.fields import StringField, BooleanField, FieldList, IntegerField, FormField
from wtforms.validators import InputRequired
from wtforms import validators
import wtforms_json
from typing import Tuple
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from .flask_imgur import Imgur

wtforms_json.init()

imgur_key = os.environ.get("IMGUR_KEY")
imgur_client = Imgur(client_id=imgur_key)

sendgrid_key = os.environ.get("SENDGRID_API_KEY")

sender_email = os.environ.get("SENDER_EMAIL")


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
    age = IntegerField(validators=[InputRequired()])
    gender = StringField(validators=[InputRequired()])
    languages = FieldList(StringField(), validators=[validators.required()])
    specialist_categories = FieldList(StringField(), validators=[validators.required()])
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
) -> bool:
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
        return False
    return True
