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
    Guest,
    Support,
    Moderator,
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
            # Check if we should include Hub accounts in Partners view
            include_hubs = data.get("include_hubs", "false").lower() == "true"

            if hub_user_id is not None:
                accounts = PartnerProfile.objects.filter(
                    firebase_uid__nin=admin_ids, hub_id=hub_user_id
                )
            else:
                # Filter by include_hubs parameter
                if include_hubs:
                    accounts = PartnerProfile.objects(firebase_uid__nin=admin_ids)
                else:
                    # Only get Partners WITHOUT a hub_id (pure partners, not hubs)
                    accounts = PartnerProfile.objects(
                        firebase_uid__nin=admin_ids, hub_id=None
                    )

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
        elif account_type == Account.HUB:
            # Get only Hub accounts (represented as PartnerProfile with hub_id)
            if hub_user_id is not None:
                accounts = PartnerProfile.objects.filter(
                    firebase_uid__nin=admin_ids, hub_id=hub_user_id
                )
            else:
                accounts = PartnerProfile.objects(
                    firebase_uid__nin=admin_ids, hub_id__ne=None
                )

            # Get Hub user details for enrichment
            Hub_users = Hub.objects()
            Hub_user_names_object = {}
            Hub_user_details_object = {}
            for hub_user in Hub_users:
                Hub_user_names_object[str(hub_user.id)] = hub_user.name
                Hub_user_details_object[str(hub_user.id)] = hub_user
            temp = []
            for account in accounts:
                if account.hub_id is not None:
                    account.hub_user_name = Hub_user_names_object.get(
                        str(account.hub_id), ""
                    )
                    hub_details = Hub_user_details_object.get(str(account.hub_id))
                    if hub_details:
                        account.hub_email = hub_details.email
                        account.hub_url = hub_details.url
                temp.append(account)
            accounts = temp
        elif account_type == Account.GUEST:
            accounts = Guest.objects(firebase_uid__nin=admin_ids)
        elif account_type == Account.SUPPORT:
            accounts = Support.objects(firebase_uid__nin=admin_ids)
        elif account_type == Account.MODERATOR:
            accounts = Moderator.objects(firebase_uid__nin=admin_ids)

    except Exception as e:
        msg = f"Failed to get accounts: {str(e)}"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if account_type == Account.MENTOR:
        return download_mentor_accounts(accounts)
    elif account_type == Account.MENTEE:
        return download_mentee_accounts(accounts, partner_object)
    elif account_type == Account.PARTNER:
        return download_partner_accounts(accounts)
    elif account_type == Account.HUB:
        return download_hub_accounts(accounts)
    elif account_type == Account.GUEST:
        return download_guest_accounts(accounts)
    elif account_type == Account.SUPPORT:
        return download_support_accounts(accounts)
    elif account_type == Account.MODERATOR:
        return download_moderator_accounts(accounts)

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
    return generate_sheet("mentor_applications", accts, columns)


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
    return generate_sheet("mentee_applications", accts, columns)


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
    return generate_sheet("mentor_accounts", accts, columns)


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
                acct.hub_user_name if hasattr(acct, "hub_user_name") else "",
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
    return generate_sheet("partner_accounts", accts, columns)


def download_hub_accounts(accounts):
    """Download Hub accounts separately from Partners.

    Hubs are represented as PartnerProfile documents with a hub_id field.
    This function exports Hub-specific data.
    """
    accts = []

    for acct in accounts:
        accts.append(
            [
                acct.email,
                acct.organization,
                acct.location,
                acct.person_name,
                (
                    ",".join(acct.regions)
                    if hasattr(acct, "regions") and acct.regions
                    else ""
                ),
                acct.intro if hasattr(acct, "intro") else "",
                acct.website,
                acct.hub_user_name if hasattr(acct, "hub_user_name") else "",
                acct.hub_email if hasattr(acct, "hub_email") else "",
                acct.hub_url if hasattr(acct, "hub_url") else "",
                acct.linkedin if hasattr(acct, "linkedin") else "",
                acct.sdgs if hasattr(acct, "sdgs") else "",
                acct.topics if hasattr(acct, "topics") else "",
                acct.image.url if acct.image else "None",
                (
                    len(acct.assign_mentors)
                    if hasattr(acct, "assign_mentors") and acct.assign_mentors
                    else 0
                ),
                (
                    len(acct.assign_mentees)
                    if hasattr(acct, "assign_mentees") and acct.assign_mentees
                    else 0
                ),
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
        "Hub Name",
        "Hub Email",
        "Hub URL",
        "LinkedIn",
        "SDGS",
        "Project Topics",
        "Image Url",
        "Number of Assigned Mentors",
        "Number of Assigned Mentees",
        "text_notifications",
        "email_notifications",
    ]
    return generate_sheet("hub_accounts", accts, columns)


def download_guest_accounts(accounts):
    """Download Guest accounts.

    Guests have basic information: firebase_uid, email, name, and roomName.
    """
    accts = []

    for acct in accounts:
        accts.append(
            [
                acct.name,
                acct.email,
                acct.firebase_uid,
                acct.roomName if hasattr(acct, "roomName") and acct.roomName else "",
            ]
        )
    columns = [
        "Name",
        "Email",
        "Firebase UID",
        "Room Name",
    ]
    return generate_sheet("guest_accounts", accts, columns)


def download_support_accounts(accounts):
    """Download Support accounts.

    Support accounts have basic information: firebase_uid, email, name, and roomName.
    """
    accts = []

    for acct in accounts:
        accts.append(
            [
                acct.name,
                acct.email,
                acct.firebase_uid,
                acct.roomName if hasattr(acct, "roomName") and acct.roomName else "",
            ]
        )
    columns = [
        "Name",
        "Email",
        "Firebase UID",
        "Room Name",
    ]
    return generate_sheet("support_accounts", accts, columns)


def download_moderator_accounts(accounts):
    """Download Moderator accounts.

    Moderator accounts have basic information: firebase_uid, email, name, and roomName.
    """
    accts = []

    for acct in accounts:
        accts.append(
            [
                acct.name,
                acct.email,
                acct.firebase_uid,
                acct.roomName if hasattr(acct, "roomName") and acct.roomName else "",
            ]
        )
    columns = [
        "Name",
        "Email",
        "Firebase UID",
        "Room Name",
    ]
    return generate_sheet("moderator_accounts", accts, columns)


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
    return generate_sheet("mentee_accounts", accts, columns)


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
        df.to_csv(output, index=False)
        mimetype = "text/csv"
        download_name = f"{file_name}.csv"
    else:
        writer = pd.ExcelWriter(output, engine="xlsxwriter")
        df.to_excel(
            writer, startrow=0, merge_cells=False, sheet_name=file_name, index=False
        )
        workbook = writer.book
        worksheet = writer.sheets[file_name]
        format = workbook.add_format()
        format.set_bg_color("#eeeeee")
        worksheet.set_column(0, len(columns), 28)
        writer.close()
        mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        download_name = f"{file_name}.xlsx"

    output.seek(0)

    try:
        return send_file(
            output,
            mimetype=mimetype,
            download_name=download_name,
            as_attachment=True,
        )
    except FileNotFoundError:
        msg = "Downloads failed"
        logger.info(msg)
        return create_response(status=422, message=msg)
