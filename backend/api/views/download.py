import pandas as pd
import xlsxwriter
from datetime import datetime
from io import BytesIO
from api.core import create_response, logger
from api.models import AppointmentRequest, Admin, MentorProfile, MenteeProfile
from flask import send_file, Blueprint
from api.utils.require_auth import admin_only
from firebase_admin import auth as firebase_admin_auth
from api.utils.constants import Account

download = Blueprint("download", __name__)


@download.route("/appointments/all", methods=["GET"])
@admin_only
def download_appointments():
    try:
        appointments = AppointmentRequest.objects()
    except:
        msg = "Failed to get appointments"
        logger.info(msg)
        return create_response(status=422, message=msg)

    appts = []
    for appt in appointments:
        mentor = MentorProfile.objects(id=appt.mentor_id).first()
        mentee = None
        if (appt.mentee_id):
            mentee = MenteeProfile.objects(id=appt.mentee_id).first()
        appts.append(
            [
                mentor.name if mentor else "Deleted Account",
                mentor.email if mentor else "Deleted Account",
                appt.timeslot.start_time.strftime("UTC: %m/%d/%Y, %H:%M:%S"),
                appt.timeslot.end_time.strftime("UTC: %m/%d/%Y, %H:%M:%S"),
                int(appt.accepted) if appt.accepted != None else "N/A",
                mentee.name if mentee else appt.name,
                mentee.email if mentee else appt.email,
                mentee.phone_number if mentee else appt.phone_number,
                ",".join(mentee.languages if mentee else appt.languages),
                mentee.age if mentee else appt.age,
                mentee.gender if mentee else appt.gender,
                mentee.location if mentee else appt.location,
                appt.topic if appt.topic else ",".join(appt.specialist_categories),
                appt.message,
                mentee.organization if mentee else appt.organization,
                int(appt.allow_calls) if appt.allow_calls != None else "N/A",
                int(appt.allow_texts) if appt.allow_texts != None else "N/A",
            ]
        )
    columns = [
        "mentor name",
        "mentor email",
        "timeslot.start_time",
        "timeslot.end_time",
        "accepted",
        "name",
        "email",
        "phone_number",
        "languages",
        "age",
        "gender",
        "location",
        "topic",
        "message",
        "organization",
        "allow_calls",
        "allow_texts",
    ]
    return generate_sheet("appointments", appts, columns)


@download.route("/accounts/all", methods=["GET"])
@admin_only
def download_accounts_info():
    try:
        admins = Admin.objects()
        admin_ids = [admin.firebase_uid for admin in admins]

        accounts = MentorProfile.objects(firebase_uid__nin=admin_ids)
    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    accts = []

    for acct in accounts:
        educations = []
        for edu in acct.education:
            educations.append(
                "{0} in {1} from {2}, graduated in {3}".format(
                    edu.education_level,
                    " and ".join(edu.majors),
                    edu.school,
                    edu.graduation_year,
                )
            )
        accts.append(
            [
                acct.name,
                acct.location,
                acct.email,
                acct.phone_number,
                acct.professional_title,
                acct.linkedin,
                acct.website,
                "Yes" if acct.image and acct.image.url else "No",
                acct.image.url if acct.image else "None",
                "Yes" if len(acct.videos) >= 0 else "No",
                "|".join(educations),
                ",".join(acct.languages),
                ",".join(acct.specializations),
                acct.biography,
                int(acct.offers_in_person) if acct.offers_in_person != None else "N/A",
                int(acct.offers_group_appointments)
                if acct.offers_group_appointments != None
                else "N/A",
                ",".join(
                    [
                        avail.start_time.strftime("UTC: %m/%d/%Y, %H:%M:%S")
                        + "---"
                        + avail.end_time.strftime("UTC: %m/%d/%Y, %H:%M:%S")
                        for avail in acct.availability
                    ]
                ),
                int(acct.text_notifications)
                if acct.text_notifications != None
                else "N/A",
                int(acct.email_notifications)
                if acct.email_notifications != None
                else "N/A",
            ]
        )
    columns = [
        "mentor name",
        "location",
        "email",
        "phone_number",
        "professional_title",
        "linkedin",
        "website",
        "profile pic up",
        "image url",
        "video(s) up",
        "educations",
        "languages",
        "specializations",
        "biography",
        "offers_in_person",
        "offers_group_appointments",
        "available times",
        "text_notifications",
        "email_notifications",
    ]
    return generate_sheet("accounts", accts, columns)


def generate_sheet(sheet_name, row_data, columns):
    df = pd.DataFrame(row_data, columns=columns)
    output = BytesIO()
    writer = pd.ExcelWriter(output, engine="xlsxwriter")

    df.to_excel(
        writer, startrow=0, merge_cells=False, sheet_name=sheet_name, index=False
    )
    workbook = writer.book
    worksheet = writer.sheets[sheet_name]
    format = workbook.add_format()
    format.set_bg_color("#eeeeee")
    worksheet.set_column(0, len(row_data[0]), 28)

    writer.close()
    output.seek(0)

    try:
        return send_file(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            attachment_filename="{0}.xlsx".format(sheet_name),
            as_attachment=True,
        )
    except FileNotFoundError:
        msg = "Download failed"
        logger.info(msg)
        return create_response(status=422, message=msg)
