from wtforms import Form
from wtforms.fields import StringField, BooleanField, FieldList, IntegerField, FormField
from wtforms.validators import InputRequired
import wtforms_json
from typing import Tuple

# Needed in order to be able to transform from JSON to Form structure
# Also patches WTForms with supporting code for JSON
wtforms_json.init()


class MentorForm(Form):
    uid = StringField(validators=[InputRequired()])
    name = StringField(validators=[InputRequired()])
    professional_title = StringField(validators=[InputRequired()])
    linkedin = StringField(validators=[InputRequired()])
    website = StringField(validators=[InputRequired()])
    picture = StringField(validators=[InputRequired()])
    languages = FieldList(StringField(validators=[InputRequired()]))
    specializations = FieldList(StringField(validators=[InputRequired()]))
    offers_in_person = BooleanField(validators=[InputRequired()])
    offers_group_appointments = BooleanField(validators=[InputRequired()])


class EducationForm(Form):
    education_level = StringField(validators=[InputRequired()])
    majors = FieldList(StringField(validators=[InputRequired()]))
    school = StringField(validators=[InputRequired()])
    graduation_year = IntegerField(validators=[InputRequired()])


class VideoForm(Form):
    title = StringField(validators=[InputRequired()])
    url = StringField(validators=[InputRequired()])
    tag = StringField(validators=[InputRequired()])


# Needed in order to be able to verify a list of videos
class ListVideoForm(Form):
    videos = FieldList(FormField(VideoForm(validators=[InputRequired()])))
