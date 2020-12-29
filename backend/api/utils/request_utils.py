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
from .constants import SENDER_EMAIL

wtforms_json.init()

imgur_key = os.environ.get("IMGUR_KEY")
imgur_client = Imgur(client_id=imgur_key)

sendgrid_key = os.environ.get("SENDGRID_API_KEY")


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
    uid = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    professional_title = StringField(validators=[InputRequired()])
    email = StringField(validators=[InputRequired()])
    languages = FieldList(StringField(), validators=[validators.required()])
    specializations = FieldList(StringField(), validators=[validators.required()])
    offers_in_person = BooleanField(
        validators=[InputRequired()], false_values=("false", "False")
    )
    offers_group_appointments = BooleanField(
        validators=[InputRequired()], false_values=("false", "False")
    )


class AvailabilityForm(Form):
    start_time = StringField(validators=[InputRequired()])
    end_time = StringField(validators=[InputRequired()])


class ApppointmentForm(Form):
    mentor_id = StringField(validators=[InputRequired()])
    timeslot = FormField(AvailabilityForm)
    name = StringField(validators=[InputRequired()])
    accepted = BooleanField(
        validators=[validators.required()], false_values=("false", "False")
    )
    email = StringField(validators=[InputRequired()])
    phone_number = StringField()
    languages = FieldList(StringField(), validators=[validators.required()])
    age = StringField(validators=[InputRequired()])
    gender = StringField(validators=[InputRequired()])
    ethnicity = StringField(validators=[InputRequired()])
    location = StringField()
    mentorship_goals = StringField(validators=[InputRequired()])
    specialist_categories = FieldList(StringField(), validators=[validators.required()])
    message = StringField()
    attendee_count = IntegerField(validators=[InputRequired()])
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
    recipient: str = "", subject: str = "", html: str = "<div/>", template_id: str = ""
) -> bool:
    """Sends an email to a specific email address from the official MENTEE email
    :param recipient - recipients email address
    :param subject - subject headline of the email
    :param html - content within the email
    :return boolean whether it successful sent an email
    """
    message = Mail(
        from_email=SENDER_EMAIL, to_emails=recipient, subject=subject, html_content=html
    )

    if template_id:
        message.template_id = template_id

    try:
        sg = SendGridAPIClient(sendgrid_key)
        response = sg.send(message)
    except Exception as e:
        return False
    return True
