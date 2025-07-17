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
from flask import send_file, Blueprint, request, g
from api.utils.require_auth import admin_only
from api.utils.constants import Account, EDUCATION_LEVEL
from api.utils.secure_access_control import (
    require_data_access_level, require_export_permission, log_sensitive_data_access,
    DataAccessLevel, secure_access_control, data_export_controller
)
from api.utils.data_protection import data_protection_manager

download = Blueprint("download", __name__)


@download.route("/appointments/all", methods=["GET"])
@admin_only
@require_data_access_level(DataAccessLevel.RESTRICTED)
@require_export_permission("basic")
@log_sensitive_data_access("appointments", ["email", "name", "phone_number"])
def download_appointments():
    try:
        headers = request.headers
        token = headers.get("Authorization")
        if token and token.startswith('Bearer '):
            token = token[7:]
            from firebase_admin import auth as firebase_admin_auth
            claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)
            g.user_role = int(claims.get("role", Account.MENTEE))
            g.user_id = claims.get("uid")
        
        user_role = getattr(g, 'user_role', Account.ADMIN)
        
        appointments = AppointmentRequest.objects()
        
        is_valid, message = secure_access_control.validate_bulk_access(user_role, len(appointments))
        if not is_valid:
            return create_response(status=403, message=message)
        
        data_protection_manager.access_logger.log_bulk_export(
            export_type="appointments",
            record_count=len(appointments),
            export_level="basic",
            user_id=getattr(g, 'user_id', 'unknown')
        )
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
@require_data_access_level(DataAccessLevel.CONFIDENTIAL)
@require_export_permission("full")
@log_sensitive_data_access("user_accounts", ["email", "phone_number", "address", "personal_info"])
def download_accounts_info():
    try:
        headers = request.headers
        token = headers.get("Authorization")
        if token and token.startswith('Bearer '):
            token = token[7:]
            from firebase_admin import auth as firebase_admin_auth
            claims = firebase_admin_auth.verify_id_token(token, check_revoked=True)
            g.user_role = int(claims.get("role", Account.ADMIN))
            g.user_id = claims.get("uid")
        
        user_role = getattr(g, 'user_role', Account.ADMIN)
        
        data = request.args
        account_type = int(data.get("account_type", 0))
        hub_user_id = data.get("hub_user_id")
        export_level = data.get("export_level", "basic")

        if not secure_access_control.can_export_data(user_role, export_level):
            return create_response(status=403, message="Export not permitted for your role")

        accounts = None

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
        
        is_valid, message = secure_access_control.validate_bulk_access(user_role, len(accounts))
        if not is_valid:
            return create_response(status=403, message=message)
        
        data_protection_manager.access_logger.log_bulk_export(
            export_type=f"accounts_{account_type}",
            record_count=len(accounts),
            export_level=export_level,
            user_id=getattr(g, 'user_id', 'unknown')
        )

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
            apps = NewMentorApplication.objects
        elif account_type == Account.MENTEE:
            apps = MenteeApplication.objects
            partner_data = PartnerProfile.objects
            for partner_item in partner_data:
                partner_object[str(partner_item.id)] = partner_item.organization

    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    if account_type == Account.MENTOR:
        return download_mentor_apps(apps)
    elif account_type == Account.MENTEE:
        return download_mentee_apps(apps, partner_object)

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
