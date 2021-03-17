import pandas as pd
import xlsxwriter
from io import BytesIO
from api.core import create_response
from api.models import AppointmentRequest, Users, MentorProfile
from flask import send_file, Blueprint

download = Blueprint("download", __name__)


@download.route("/appointments/all", methods=["GET"])
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
        appts.append(
            [
                mentor.name,
                mentor.email,
                appt.timeslot.start_time.strftime("UTC: %m/%d/%Y, %H:%M:%S"),
                appt.timeslot.end_time.strftime("UTC: %m/%d/%Y, %H:%M:%S"),
                int(appt.accepted) if apt.accepted != None else "N/A",
                appt.name,
                appt.email,
                appt.phone_number,
                ",".join(appt.languages),
                appt.age,
                appt.gender,
                appt.location,
                ",".join(appt.specialist_categories),
                appt.message,
                appt.organization,
                int(appt.allow_calls) if apt.allow_calls != None else "N/A",
                int(appt.allow_texts) if apt.allow_texts != None else "N/A",
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
        "specialist_categories",
        "message",
        "organization",
        "allow_calls",
        "allow_texts",
    ]
    return generate_sheet("appointments", appts, columns)


@download.route("/accounts/all", methods=["GET"])
def download_accounts_info():
    try:
        admin_ids = Users.objects(role="admin").scalar("id")
        accounts = MentorProfile.objects(user_id__nin=admin_ids)
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
            attachment_filename="{0}.xlsx".format(sheet_name),
            as_attachment=True,
        )
    except FileNotFoundError:
        msg = "Download failed"
        logger.info(msg)
        return create_response(status=422, message=msg)
