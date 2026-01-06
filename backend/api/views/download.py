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
    Hub,
    DirectMessage,
)
from flask import send_file, Blueprint, request
from api.utils.require_auth import admin_only
from api.utils.constants import Account, EDUCATION_LEVEL

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
    hub_user_id = data.get("hub_user_id")

    accounts = None

    try:
        admins = Admin.objects()
        admin_ids = [admin.firebase_uid for admin in admins]

        partner_object = {}

        if account_type == Account.MENTOR:
            accounts = MentorProfile.objects(firebase_uid__nin=admin_ids)
        elif account_type == Account.MENTEE:
            accounts = MenteeProfile.objects(firebase_uid__nin=admin_ids)
            partner_data = PartnerProfile.objects(firebase_uid__nin=admin_ids)
            for partner_item in partner_data:
                partner_object[str(partner_item.id)] = partner_item.organization
        elif account_type == Account.PARTNER:
            if hub_user_id is not None:
                accounts = PartnerProfile.objects.filter(
                    firebase_uid__nin=admin_ids, hub_id=hub_user_id
                )
            else:
                accounts = PartnerProfile.objects(firebase_uid__nin=admin_ids)

            Hub_users = Hub.objects()
            Hub_user_names_object = {}
            for hub_user in Hub_users:
                Hub_user_names_object[str(hub_user.id)] = hub_user.name
            temp = []
            for account in accounts:
                if account.hub_id is not None:
                    account.hub_user_name = Hub_user_names_object[str(account.hub_id)]
                temp.append(account)
            accounts = temp

    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if account_type == Account.MENTOR:
        return download_mentor_accounts(accounts)
    elif account_type == Account.MENTEE:
        return download_mentee_accounts(accounts, partner_object)
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

    partner_object = {}
    try:
        if account_type == Account.MENTOR:
            apps = NewMentorApplication.objects()
            partner_data = PartnerProfile.objects()
            for partner_item in partner_data:
                partner_object[str(partner_item.id)] = partner_item.organization
        elif account_type == Account.MENTEE:
            apps = MenteeApplication.objects()
            partner_data = PartnerProfile.objects()
            for partner_item in partner_data:
                partner_object[str(partner_item.id)] = partner_item.organization

    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if account_type == Account.MENTOR:
        return download_mentor_apps(apps, partner_object)
    elif account_type == Account.MENTEE:
        return download_mentee_apps(apps, partner_object)

    msg = "Invalid input"
    logger.info(msg)
    return create_response(status=422, message=msg)


def download_mentor_apps(apps, partner_object):
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
                (
                    partner_object[acct.partner]
                    if acct.partner and acct.partner in partner_object
                    else acct.organization
                    if acct.organization
                    else ""
                ),
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
        "Organization Affiliation",
    ]
    return generate_sheet("accounts", accts, columns)


def download_mentee_apps(apps, partner_object):
    accts = []

    for acct in apps:
        accts.append(
            [
                acct.name,
                acct.email,
                ",".join(acct.immigrant_status),
                acct.Country,
                acct.identify,
                (
                    acct.language
                    if isinstance(acct.language, str)
                    else ",".join(acct.language)
                ),
                ",".join(acct.topics),
                ",".join(acct.workstate),
                acct.isSocial,
                acct.questions,
                acct.application_state,
                acct.notes,
                (
                    partner_object[acct.partner]
                    if acct.partner in partner_object
                    else acct.partner
                ),
            ]
        )
    columns = [
        " Full Name",
        "email",
        # "age",
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
        "Organization Affiliation",
    ]
    return generate_sheet("accounts", accts, columns)


def download_mentor_accounts(accounts):
    messages = DirectMessage.objects()

    all_partners = PartnerProfile.objects()
    partners_by_assign_mentor = {}
    for partner_account in all_partners:
        if partner_account.assign_mentors:
            for mentor_item in partner_account.assign_mentors:
                partners_by_assign_mentor[str(mentor_item["id"])] = partner_account

    accts = []

    for acct in accounts:
        sent_messages = [
            message for message in messages if message.sender_id == acct.id
        ]
        receive_messages = [
            message for message in messages if message.recipient_id == acct.id
        ]
        partner = ""
        if str(acct.id) in partners_by_assign_mentor:
            partner = partners_by_assign_mentor[str(acct.id)].organization

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
                len(receive_messages),
                len(sent_messages),
                partner,
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
        "total_received_messages",
        "total_sent_messages",
        "Affiliated",
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
                acct.hub_user_name,
                acct.linkedin,
                acct.sdgs,
                acct.topics,
                acct.image.url if acct.image else "None",
                (
                    int(acct.text_notifications)
                    if acct.text_notifications != None
                    else "N/A"
                ),
                (
                    int(acct.email_notifications)
                    if acct.email_notifications != None
                    else "N/A"
                ),
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
        "Hub",
        "LinkedIn",
        "SDGS",
        "Project Topics",
        "Image Url",
        "text_notifications",
        "email_notifications",
    ]
    return generate_sheet("accounts", accts, columns)


def download_mentee_accounts(accounts, partner_object):
    messages = DirectMessage.objects()
    all_partners = PartnerProfile.objects()
    partners_by_assign_mentee = {}
    for partner_account in all_partners:
        if partner_account.assign_mentees:
            for mentee_item in partner_account.assign_mentees:
                partners_by_assign_mentee[str(mentee_item["id"])] = partner_account

    accts = []

    for acct in accounts:
        sent_messages = [
            message for message in messages if message.sender_id == acct.id
        ]
        receive_messages = [
            message for message in messages if message.recipient_id == acct.id
        ]
        partner = ""
        if str(acct.id) in partners_by_assign_mentee:
            partner = partners_by_assign_mentee[str(acct.id)].organization

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
        if acct.education_level is not None:
            educations.append(EDUCATION_LEVEL[acct.education_level])
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
                (
                    partner_object[acct.organization]
                    if acct.organization in partner_object
                    else acct.organization
                ),
                "Yes" if acct.image and acct.image.url else "No",
                "Yes" if acct.video else "No",
                (
                    int(acct.text_notifications)
                    if acct.text_notifications != None
                    else "N/A"
                ),
                (
                    int(acct.email_notifications)
                    if acct.email_notifications != None
                    else "N/A"
                ),
                int(acct.is_private) if acct.is_private != None else "N/A",
                acct.video.url if acct.video else "None",
                ",".join(acct.favorite_mentors_ids),
                len(receive_messages),
                len(sent_messages),
                partner,
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
        "total_received_messages",
        "total_sent_messages",
        "Affiliated",
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
    worksheet.set_column(0, len(row_data[0]) if row_data else 0, 28)

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


def generate_file(file_name, row_data, columns, file_format="xlsx"):
    """Generate either CSV or Excel file based on format parameter."""
    df = pd.DataFrame(row_data, columns=columns)
    output = BytesIO()

    if file_format == "csv":
        # Generate CSV
        csv_data = df.to_csv(index=False)
        output.write(csv_data.encode("utf-8"))
        output.seek(0)

        try:
            return send_file(
                output,
                mimetype="text/csv",
                download_name="{0}.csv".format(file_name),
                as_attachment=True,
            )
        except FileNotFoundError:
            msg = "Downloads failed"
            logger.info(msg)
            return create_response(status=422, message=msg)
    else:
        # Generate Excel (default)
        writer = pd.ExcelWriter(output, engine="xlsxwriter")

        df.to_excel(
            writer, startrow=0, merge_cells=False, sheet_name=file_name, index=False
        )
        workbook = writer.book
        worksheet = writer.sheets[file_name]
        format = workbook.add_format()
        format.set_bg_color("#eeeeee")
        worksheet.set_column(0, len(row_data[0]) if row_data else 0, 28)

        writer.close()
        output.seek(0)

        try:
            return send_file(
                output,
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                download_name="{0}.xlsx".format(file_name),
                as_attachment=True,
            )
        except FileNotFoundError:
            msg = "Downloads failed"
            logger.info(msg)
            return create_response(status=422, message=msg)


@download.route("/partner/<partner_id>/accounts", methods=["GET"])
@admin_only
def download_partner_accounts_data(partner_id):
    """Download mentors or mentees assigned to a specific partner with activity status."""
    data = request.args
    account_type = int(data.get("account_type", 0))
    file_format = data.get("format", "xlsx")  # 'xlsx' or 'csv'

    try:
        partner = PartnerProfile.objects.get(id=partner_id)
    except:
        msg = "Partner not found"
        logger.info(msg)
        return create_response(status=422, message=msg)

    messages = DirectMessage.objects()

    if account_type == Account.MENTOR:
        return download_partner_mentor_accounts(partner, messages, file_format)
    elif account_type == Account.MENTEE:
        return download_partner_mentee_accounts(partner, messages, file_format)

    msg = "Invalid account type"
    logger.info(msg)
    return create_response(status=422, message=msg)


def download_partner_mentor_accounts(partner, messages, file_format="xlsx"):
    """Download mentors assigned to a partner with activity status."""
    if not partner.assign_mentors:
        return generate_file("partner_mentors", [], get_mentor_columns_with_activity(), file_format)

    accts = []

    for mentor_ref in partner.assign_mentors:
        mentor_id = mentor_ref.get("id")
        if not mentor_id:
            continue

        try:
            mentor = MentorProfile.objects.get(id=mentor_id)
        except:
            continue

        # Count messages
        sent_messages = [msg for msg in messages if str(msg.sender_id) == str(mentor.id)]
        received_messages = [msg for msg in messages if str(msg.recipient_id) == str(mentor.id)]

        # Determine activity status
        total_sent = len(sent_messages)
        total_received = len(received_messages)
        has_messages = total_sent > 0 or total_received > 0

        if has_messages:
            is_active = "Yes"
            activity_reason = f"Sent: {total_sent}, Received: {total_received} messages"
        else:
            is_active = "No"
            activity_reason = "No messages sent or received"

        # Format educations
        educations = []
        for edu in mentor.education:
            educations.append(
                "{0} from {1} ({2})".format(
                    edu.education_level if edu.education_level else "",
                    edu.school if edu.school else "",
                    edu.graduation_year if edu.graduation_year else "",
                )
            )

        accts.append(
            [
                mentor.name,
                mentor.email,
                mentor.professional_title,
                mentor.linkedin,
                mentor.website,
                "Yes" if mentor.image and mentor.image.url else "No",
                mentor.image.url if mentor.image else "",
                mentor.videos[0].url if mentor.videos and len(mentor.videos) > 0 else "",
                "Yes" if mentor.videos and len(mentor.videos) > 0 else "No",
                "|".join(educations),
                ",".join(mentor.languages) if mentor.languages else "",
                ",".join(mentor.specializations) if mentor.specializations else "",
                mentor.biography,
                "Yes" if mentor.taking_appointments else "No",
                "Yes" if mentor.offers_in_person else "No",
                "Yes" if mentor.offers_group_appointments else "No",
                "Yes" if mentor.text_notifications else "No",
                "Yes" if mentor.email_notifications else "No",
                total_received,
                total_sent,
                partner.organization if partner.organization else "",
                is_active,
                activity_reason,
            ]
        )

    return generate_file("partner_mentors", accts, get_mentor_columns_with_activity(), file_format)


def download_partner_mentee_accounts(partner, messages, file_format="xlsx"):
    """Download mentees assigned to a partner with activity status."""
    if not partner.assign_mentees:
        return generate_file("partner_mentees", [], get_mentee_columns_with_activity(), file_format)

    accts = []

    for mentee_ref in partner.assign_mentees:
        mentee_id = mentee_ref.get("id")
        if not mentee_id:
            continue

        try:
            mentee = MenteeProfile.objects.get(id=mentee_id)
        except:
            continue

        # Count messages
        sent_messages = [msg for msg in messages if str(msg.sender_id) == str(mentee.id)]
        received_messages = [msg for msg in messages if str(msg.recipient_id) == str(mentee.id)]

        # Determine activity status
        total_sent = len(sent_messages)
        total_received = len(received_messages)
        has_messages = total_sent > 0 or total_received > 0

        if has_messages:
            is_active = "Yes"
            activity_reason = f"Sent: {total_sent}, Received: {total_received} messages"
        else:
            is_active = "No"
            activity_reason = "No messages sent or received"

        # Format educations
        educations = []
        for edu in mentee.education:
            educations.append(
                "{0} from {1} ({2})".format(
                    edu.education_level if edu.education_level else "",
                    edu.school if edu.school else "",
                    edu.graduation_year if edu.graduation_year else "",
                )
            )
        if mentee.education_level and not educations:
            educations.append(EDUCATION_LEVEL.get(mentee.education_level, mentee.education_level))

        accts.append(
            [
                mentee.name,
                mentee.gender,
                mentee.location,
                mentee.age,
                mentee.email,
                mentee.phone_number,
                mentee.image.url if mentee.image else "",
                "|".join(educations),
                ",".join(mentee.languages) if mentee.languages else "",
                "|".join(mentee.specializations) if mentee.specializations else "",
                mentee.biography,
                partner.organization if partner.organization else "",
                "Yes" if mentee.image and mentee.image.url else "No",
                "Yes" if mentee.video and mentee.video.url else "No",
                1 if mentee.text_notifications else 0,
                1 if mentee.email_notifications else 0,
                1 if mentee.is_private else 0,
                mentee.video.url if mentee.video else "",
                ",".join(mentee.favorite_mentors_ids) if mentee.favorite_mentors_ids else "",
                total_sent,
                total_received,
                partner.organization if partner.organization else "",
                is_active,
                activity_reason,
            ]
        )

    return generate_file("partner_mentees", accts, get_mentee_columns_with_activity(), file_format)


def get_mentor_columns_with_activity():
    return [
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
        "total_received_messages",
        "total_sent_messages",
        "Affiliated",
        "is_active",
        "activity_reason",
    ]


def get_mentee_columns_with_activity():
    return [
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
        "total_sent_messages",
        "total_received_messages",
        "Affiliated",
        "is_active",
        "activity_reason",
    ]
