import pandas as pd
from api.models.PartnerProfile import PartnerProfile
from io import BytesIO
from api.core import create_response, logger
from api.models import (
    AppointmentRequest,
    Admin,
    MentorProfile,
    MenteeProfile,
    NewMentorApplication,
    MenteeApplication,
)
from flask import send_file, Blueprint, request
from api.utils.require_auth import admin_only
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
        if appt.mentee_id:
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
    data = request.args
    account_type = int(data.get("account_type", 0))
    accounts = None

    try:
        admins = Admin.objects()
        admin_ids = [admin.firebase_uid for admin in admins]

        if account_type == Account.MENTOR:
            accounts = MentorProfile.objects(firebase_uid__nin=admin_ids)
        elif account_type == Account.MENTEE:
            accounts = MenteeProfile.objects(firebase_uid__nin=admin_ids)
        elif account_type == Account.PARTNER:
            accounts = PartnerProfile.objects(firebase_uid__nin=admin_ids)

    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if account_type == Account.MENTOR:
        return download_mentor_accounts(accounts)
    elif account_type == Account.MENTEE:
        return download_mentee_accounts(accounts)
    elif account_type == Account.PARTNER:
        return download_partner_accounts(accounts)

    msg = "Invalid input"
    logger.info(msg)
    return create_response(status=422, message=msg)


@download.route("/apps/all", methods=["GET"])
@admin_only
def download_apps_info():
    data = request.args
    account_type = int(data.get("account_type", 0))
    apps = None

    try:
        if account_type == Account.MENTOR:
            apps = NewMentorApplication.objects
        elif account_type == Account.MENTEE:
            apps = MenteeApplication.objects

    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if account_type == Account.MENTOR:
        return download_mentor_apps(apps)
    elif account_type == Account.MENTEE:
        return download_mentee_apps(apps)

    msg = "Invalid input"
    logger.info(msg)
    return create_response(status=422, message=msg)


def download_mentor_apps(apps):
    accts = []

    for acct in apps:
        accts.append(
            [
                acct.name,
                acct.email,
                acct.cell_number,
                acct.hear_about_us,
                acct.offer_donation,
                acct.employer_name,
                acct.role_description,
                "Yes" if acct.immigrant_status else "No",
                acct.languages,
                ",".join(acct.specializations) if acct.specializations else "",
                acct.referral,
                acct.companyTime,
                acct.specialistTime,
                acct.knowledge_location,
                "Yes" if acct.isColorPerson else "No",
                "Yes" if acct.isMarginalized else "No",
                "Yes" if acct.isFamilyNative else "No",
                "Yes" if acct.isEconomically else "No",
                acct.identify,
                acct.pastLiveLocation,
                acct.application_state,
                acct.notes,
            ]
        )
    columns = [
        " Full Name",
        "email",
        "cell number",
        "hear about us",
        "offer donation",
        "company/employer",
        "role description",
        "immigrant status",
        "Languages",
        "Specializations",
        "referral",
        "company experience years",
        "commit as special period",
        "regions knowledge based in",
        "is color person",
        "is marginalized",
        "is family native",
        "is economically",
        "identify",
        "past live location",
        "application state",
        "notes",
    ]
    return generate_sheet("accounts", accts, columns)


def download_mentee_apps(apps):
    accts = []

    for acct in apps:
        accts.append(
            [
                acct.name,
                acct.email,
                acct.age,
                ",".join(acct.immigrant_status),
                acct.Country,
                acct.identify,
                acct.language,
                ",".join(acct.topics),
                ",".join(acct.workstate),
                acct.isSocial,
                acct.questions,
                acct.application_state,
                acct.notes,
            ]
        )
    columns = [
        " Full Name",
        "email",
        "age",
        "immigrant status",
        "Country",
        "identify",
        "language",
        "Topics",
        "work state",
        "is social ",
        "questions",
        "application state",
        "notes",
    ]
    return generate_sheet("accounts", accts, columns)


def download_mentor_accounts(accounts):
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
                acct.email,
                acct.professional_title,
                acct.linkedin,
                acct.website,
                "Yes" if acct.image and acct.image.url else "No",
                acct.image.url if acct.image else "No",
                acct.video.url if acct.video else "No",
                "Yes" if len(acct.videos) >= 0 else "No",
                "|".join(educations),
                ",".join(acct.languages),
                ",".join(acct.specializations),
                acct.biography,
                "Yes" if acct.taking_appointments else "No",
                "Yes" if acct.offers_in_person else "No",
                "Yes" if acct.offers_group_appointments else "No",
                "Yes" if acct.text_notifications else "No",
                "Yes" if acct.email_notifications else "No",
            ]
        )
    columns = [
        "mentor Full Name",
        "email",
        "professional_title",
        "linkedin",
        "website",
        "profile pic up",
        "image url",
        "video url",
        "video(s) up",
        "educations",
        "languages",
        "specializations",
        "biography",
        "taking_appointments",
        "offers_in_person",
        "offers_group_appointments",
        "text_notifications",
        "email_notifications",
    ]
    return generate_sheet("accounts", accts, columns)


def download_partner_accounts(accounts):
    accts = []

    for acct in accounts:
        accts.append(
            [
                acct.email,
                acct.organization,
                acct.location,
                acct.person_name,
                ",".join(acct.regions),
                acct.intro,
                acct.website,
                acct.linkedin,
                acct.sdgs,
                acct.topics,
                acct.image.url if acct.image else "None",
                int(acct.text_notifications)
                if acct.text_notifications != None
                else "N/A",
                int(acct.email_notifications)
                if acct.email_notifications != None
                else "N/A",
            ]
        )
    columns = [
        "Email",
        "Organization/Institution/Corporation Full Name",
        "Headquarters Location",
        "Contact Person's Full Name",
        "Regions Work In",
        "Brief Introduction",
        "Website",
        "LinkedIn",
        "SDGS",
        "Project Topics",
        "Image Url",
        "text_notifications",
        "email_notifications",
    ]
    return generate_sheet("accounts", accts, columns)


def download_mentee_accounts(accounts):
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
                acct.gender,
                acct.location,
                acct.age,
                acct.email,
                acct.phone_number,
                acct.image.url if acct.image else "None",
                "|".join(educations),
                ",".join(acct.languages),
                "|".join(acct.specializations),
                acct.biography,
                acct.organization,
                "Yes" if acct.image and acct.image.url else "No",
                "Yes" if acct.video else "No",
                int(acct.text_notifications)
                if acct.text_notifications != None
                else "N/A",
                int(acct.email_notifications)
                if acct.email_notifications != None
                else "N/A",
                int(acct.is_private) if acct.is_private != None else "N/A",
                acct.video.url if acct.video else "None",
                ",".join(acct.favorite_mentors_ids),
            ]
        )
    columns = [
        "mentee name",
        "gender",
        "location",
        "age",
        "email",
        "phone number",
        "image url",
        "educations",
        "languages",
        "Areas of interest",
        "biography",
        "Organization Affiliation",
        "profile pic up",
        "video(s) up",
        "text_notifications",
        "email_notifications",
        "private account",
        "video url",
        "favorite_mentor_ids",
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
            download_name="{0}.xlsx".format(sheet_name),
            as_attachment=True,
        )
    except FileNotFoundError:
        msg = "Downloads failed"
        logger.info(msg)
        return create_response(status=422, message=msg)
