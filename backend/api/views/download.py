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
    MentorApplication,
    MenteeApplication,
    Hub,
    DirectMessage,
    Guest,
    Support,
    Moderator,
    Users,
)
from flask import send_file, Blueprint, request
from mongoengine.queryset.visitor import Q
from api.utils.require_auth import admin_only
from api.utils.constants import Account, EDUCATION_LEVEL

download = Blueprint("download", __name__)


def _verified_email_set(user_role):
    """Lowercased emails of Firebase-verified users for the given role."""
    return {
        (u.email or "").lower()
        for u in Users.objects(role=user_role, verified=True).only("email")
        if u.email
    }


def _profile_stage_label(email, verified_emails):
    """Profile rows are always past COMPLETED, so the only remaining signal
    is whether the Firebase email verification link was ever clicked."""
    normalized = (email or "").lower()
    if normalized and normalized in verified_emails:
        return "Active"
    return "Profile — email unverified"


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

    # Optional CSV list of profile IDs. When set, only those rows are exported
    # — this is how /account-data's client-side filters flow into the export.
    raw_ids = (data.get("ids") or "").strip()
    filter_ids = [s for s in raw_ids.split(",") if s]

    accounts = None

    try:
        admins = Admin.objects()
        admin_ids = [admin.firebase_uid for admin in admins]

        partner_object = {}

        if account_type == Account.MENTOR:
            qs = MentorProfile.objects(firebase_uid__nin=admin_ids)
            if filter_ids:
                qs = qs.filter(id__in=filter_ids)
            accounts = qs
        elif account_type == Account.MENTEE:
            qs = MenteeProfile.objects(firebase_uid__nin=admin_ids)
            if filter_ids:
                qs = qs.filter(id__in=filter_ids)
            accounts = qs
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


@download.route("/partner/<string:partner_id>/accounts", methods=["GET"])
@admin_only
def download_partner_member_accounts(partner_id):
    """Download accounts (mentors or mentees) assigned to a specific partner.

    Honors the same filter knobs exposed on /partner-data:
      - include_applicants (bool, default true): mid-funnel applicants who
        named this partner, in addition to completed profiles.
      - effective_stage (optional): keep only rows matching this stage id.
      - format (xlsx|csv): output format.
    """
    data = request.args
    account_type = int(data.get("account_type", 0))
    file_format = (data.get("format") or "xlsx").lower()
    if file_format not in ("xlsx", "csv"):
        file_format = "xlsx"
    include_applicants = (data.get("include_applicants") or "true").lower() == "true"
    effective_stage_filter = (data.get("effective_stage") or "").strip()

    try:
        partner = PartnerProfile.objects.get(id=partner_id)
    except Exception:
        msg = "Partner not found"
        logger.info(msg)
        return create_response(status=422, message=msg)

    from api.views.apply import (
        _compute_effective_stage,
        _STAGE_LABELS,
        _days_since,
    )

    partner_id_str = str(partner.id)
    partner_org = partner.organization or ""

    def _build_applicants(app_model, role_key, dedup_emails):
        """Build applicant rows for the export, skipping any whose email
        already appears in this partner's completed profile roster. Matches
        the dedup that /api/accounts/<partner_id> does so UI row count and
        export row count agree.
        """
        if not include_applicants:
            return []
        from api.views.apply import _build_lookup_sets

        profile_emails, verified_emails = _build_lookup_sets(role_key)
        out = []
        for app in app_model.objects(
            partner=partner_id_str,
            application_state__ne="COMPLETED",
        ):
            email_lower = (app.email or "").lower()
            if email_lower and email_lower in dedup_emails:
                continue
            stage_id = _compute_effective_stage(
                app.application_state,
                email_lower,
                profile_emails,
                verified_emails,
            )
            if effective_stage_filter and stage_id != effective_stage_filter:
                continue
            out.append(
                {
                    "name": app.name,
                    "email": app.email,
                    "organization": partner_org,
                    "stage_label": _STAGE_LABELS[stage_id],
                    "days_since_submit": _days_since(app.date_submitted),
                    "application_state": app.application_state,
                }
            )
        return out

    if account_type == Account.MENTOR:
        mentor_ids = [m["id"] for m in (partner.assign_mentors or []) if "id" in m]
        accounts = list(MentorProfile.objects.filter(id__in=mentor_ids))
        if effective_stage_filter:
            verified_emails = _verified_email_set("1")
            accounts = [
                a
                for a in accounts
                if (
                    (
                        "active"
                        if (a.email or "").lower() in verified_emails
                        else "active_unverified"
                    )
                    == effective_stage_filter
                )
            ]
        dedup = {(a.email or "").lower() for a in accounts if a.email}
        applicants = _build_applicants(NewMentorApplication, "mentor", dedup)
        if not accounts and not applicants:
            return create_response(
                status=422,
                message="No mentors match this partner + filter combination",
            )
        return download_mentor_accounts(accounts, file_format, applicants)

    elif account_type == Account.MENTEE:
        mentee_ids = [m["id"] for m in (partner.assign_mentees or []) if "id" in m]
        accounts = list(MenteeProfile.objects.filter(id__in=mentee_ids))
        if effective_stage_filter:
            verified_emails = _verified_email_set("2")
            accounts = [
                a
                for a in accounts
                if (
                    (
                        "active"
                        if (a.email or "").lower() in verified_emails
                        else "active_unverified"
                    )
                    == effective_stage_filter
                )
            ]
        dedup = {(a.email or "").lower() for a in accounts if a.email}
        applicants = _build_applicants(MenteeApplication, "mentee", dedup)
        if not accounts and not applicants:
            return create_response(
                status=422,
                message="No mentees match this partner + filter combination",
            )
        partner_object = {str(partner.id): partner.organization}
        return download_mentee_accounts(
            accounts, partner_object, file_format, applicants
        )

    msg = "Invalid account_type for partner download"
    logger.info(msg)
    return create_response(status=422, message=msg)


@download.route("/apps/all", methods=["GET"])
@admin_only
def download_apps_info():
    """Export applications. Mirrors the /menteeOrganizer UI filters so the
    file matches what the admin has on screen."""
    from mongoengine.queryset.visitor import Q

    data = request.args
    account_type = int(data.get("account_type", 0))
    partner_id = (data.get("partner_id") or "").strip()
    search = (data.get("search") or "").strip()
    application_state = (data.get("application_state") or "").strip()
    effective_stage = (data.get("effective_stage") or "").strip()
    apps = None

    query = Q()
    if search:
        query &= Q(name__icontains=search) | Q(email__icontains=search)
    if application_state and application_state != "all":
        query &= Q(application_state=application_state)
    if partner_id:
        query &= Q(partner=partner_id)

    partner_object = {}
    try:
        if account_type == Account.MENTOR:
            apps = list(NewMentorApplication.objects.filter(query))
            # The admin search endpoint unions the legacy MentorApplication
            # collection too; keep parity so UI row count == export row count.
            # Legacy rows have no `partner` field, so skip them when that
            # filter is active.
            if not partner_id:
                # Legacy-collection row filters (reuse the same query but
                # without the partner clause, which doesn't exist on this
                # model).
                legacy_query = Q()
                if search:
                    legacy_query &= Q(name__icontains=search) | Q(
                        email__icontains=search
                    )
                if application_state and application_state != "all":
                    legacy_query &= Q(application_state=application_state)
                apps += list(MentorApplication.objects.filter(legacy_query))
            partner_data = PartnerProfile.objects()
            for partner_item in partner_data:
                partner_object[str(partner_item.id)] = partner_item.organization
        elif account_type == Account.MENTEE:
            apps = list(MenteeApplication.objects.filter(query))
            partner_data = PartnerProfile.objects()
            for partner_item in partner_data:
                partner_object[str(partner_item.id)] = partner_item.organization

    except:
        msg = "Failed to get accounts"
        logger.info(msg)
        return create_response(status=422, message=msg)

    # Stage lookup sets mirror apply.py — compute once per export.
    from api.views.apply import (
        _build_lookup_sets,
        _compute_effective_stage,
        _STAGE_LABELS,
        _days_since,
    )

    role = "mentor" if account_type == Account.MENTOR else "mentee"
    profile_emails, verified_emails = _build_lookup_sets(role)

    if effective_stage and effective_stage != "all":
        apps = [
            a
            for a in apps
            if _compute_effective_stage(
                getattr(a, "application_state", None),
                (getattr(a, "email", "") or "").lower(),
                profile_emails,
                verified_emails,
            )
            == effective_stage
        ]

    def stage_info(acct):
        email = (getattr(acct, "email", "") or "").lower()
        stage_id = _compute_effective_stage(
            getattr(acct, "application_state", None),
            email,
            profile_emails,
            verified_emails,
        )
        return (
            _STAGE_LABELS.get(stage_id, stage_id),
            _days_since(getattr(acct, "date_submitted", None)),
        )

    if account_type == Account.MENTOR:
        return download_mentor_apps(apps, partner_object, stage_info)
    elif account_type == Account.MENTEE:
        return download_mentee_apps(apps, partner_object, stage_info)

    msg = "Invalid input"
    logger.info(msg)
    return create_response(status=422, message=msg)


def download_mentor_apps(apps, partner_object, stage_info):
    """Emit one row per application. Uses getattr because legacy
    MentorApplication docs don't share the same schema as NewMentorApplication
    — missing fields just come out as empty cells.
    """
    accts = []

    def _yn(v):
        """Render booleans as Yes/No; pass strings through unchanged so
        legacy MentorApplication's string immigrant_status still makes sense
        in the sheet."""
        if v is None or v == "":
            return ""
        if isinstance(v, bool):
            return "Yes" if v else "No"
        return str(v)

    for acct in apps:
        stage_label, days = stage_info(acct)
        partner_field = getattr(acct, "partner", None)
        org_field = getattr(acct, "organization", None)
        affiliated = (
            partner_object[partner_field]
            if partner_field and partner_field in partner_object
            else org_field or ""
        )
        specs = getattr(acct, "specializations", None)
        accts.append(
            [
                getattr(acct, "name", ""),
                getattr(acct, "email", ""),
                getattr(acct, "cell_number", ""),
                getattr(acct, "hear_about_us", ""),
                getattr(acct, "offer_donation", ""),
                getattr(acct, "employer_name", ""),
                getattr(acct, "role_description", ""),
                _yn(getattr(acct, "immigrant_status", None)),
                getattr(acct, "languages", ""),
                ",".join(specs) if specs else "",
                getattr(acct, "referral", ""),
                getattr(acct, "companyTime", ""),
                getattr(acct, "specialistTime", ""),
                getattr(acct, "knowledge_location", ""),
                _yn(getattr(acct, "isColorPerson", None)),
                _yn(getattr(acct, "isMarginalized", None)),
                _yn(getattr(acct, "isFamilyNative", None)),
                _yn(getattr(acct, "isEconomically", None)),
                getattr(acct, "identify", ""),
                getattr(acct, "pastLiveLocation", ""),
                getattr(acct, "application_state", ""),
                stage_label,
                days,
                getattr(acct, "notes", ""),
                affiliated,
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
        "effective stage",
        "days since submit",
        "notes",
        "Organization Affiliation",
    ]
    return generate_sheet("mentor_applications", accts, columns)


def download_mentee_apps(apps, partner_object, stage_info):
    accts = []

    for acct in apps:
        stage_label, days = stage_info(acct)
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
                stage_label,
                days,
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
        "effective stage",
        "days since submit",
        "notes",
        "Organization Affiliation",
    ]
    return generate_sheet("mentee_applications", accts, columns)


def download_mentor_accounts(accounts, file_format="xlsx", applicants=None):
    """Export completed mentor profiles, optionally augmented with mid-funnel
    applicants. Each applicant dict should have: name, email, stage_label,
    organization, days_since_submit, application_state.
    """
    accounts = list(accounts)
    account_ids = [acct.id for acct in accounts]

    # Count sent/received messages per account in one pass,
    # only loading messages that involve these accounts.
    sent_count = {}
    received_count = {}
    for msg in DirectMessage.objects.filter(
        Q(sender_id__in=account_ids) | Q(recipient_id__in=account_ids)
    ).only("sender_id", "recipient_id"):
        sid, rid = str(msg.sender_id), str(msg.recipient_id)
        sent_count[sid] = sent_count.get(sid, 0) + 1
        received_count[rid] = received_count.get(rid, 0) + 1

    all_partners = PartnerProfile.objects()
    partners_by_assign_mentor = {}
    for partner_account in all_partners:
        if partner_account.assign_mentors:
            for mentor_item in partner_account.assign_mentors:
                partners_by_assign_mentor[str(mentor_item["id"])] = partner_account

    verified_emails = _verified_email_set("1")

    accts = []

    for acct in accounts:
        acct_id = str(acct.id)
        partner = ""
        if acct_id in partners_by_assign_mentor:
            partner = partners_by_assign_mentor[acct_id].organization

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
                received_count.get(acct_id, 0),
                sent_count.get(acct_id, 0),
                partner,
                _profile_stage_label(acct.email, verified_emails),
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
        "effective stage",
        "days since submit",
        "application state",
    ]

    # Profile rows don't have application-lifecycle timestamps; the last two
    # columns are blank for them. Applicant rows below invert that shape.
    for i, row in enumerate(accts):
        row.extend(["", ""])

    for ap in applicants or []:
        blanks = [""] * 18  # everything before total_received_messages
        accts.append(
            blanks
            + [
                "",  # total_received_messages
                "",  # total_sent_messages
                ap.get("organization") or "",  # Affiliated
                ap.get("stage_label") or "",  # effective stage
                ap.get("days_since_submit")
                if ap.get("days_since_submit") is not None
                else "",
                ap.get("application_state") or "",
            ]
        )
        # Override the name + email + professional_title with applicant data.
        accts[-1][0] = ap.get("name") or ""
        accts[-1][1] = ap.get("email") or ""

    return generate_sheet("mentor_accounts", accts, columns, file_format)


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


def download_mentee_accounts(
    accounts, partner_object, file_format="xlsx", applicants=None
):
    """Export completed mentee profiles, optionally augmented with mid-funnel
    applicants. Each applicant dict should have: name, email, stage_label,
    organization, days_since_submit, application_state.
    """
    accounts = list(accounts)
    account_ids = [acct.id for acct in accounts]

    # Count sent/received messages per account in one pass,
    # only loading messages that involve these accounts.
    sent_count = {}
    received_count = {}
    for msg in DirectMessage.objects.filter(
        Q(sender_id__in=account_ids) | Q(recipient_id__in=account_ids)
    ).only("sender_id", "recipient_id"):
        sid, rid = str(msg.sender_id), str(msg.recipient_id)
        sent_count[sid] = sent_count.get(sid, 0) + 1
        received_count[rid] = received_count.get(rid, 0) + 1

    all_partners = PartnerProfile.objects()
    partners_by_assign_mentee = {}
    for partner_account in all_partners:
        if partner_account.assign_mentees:
            for mentee_item in partner_account.assign_mentees:
                partners_by_assign_mentee[str(mentee_item["id"])] = partner_account

    verified_emails = _verified_email_set("2")

    accts = []

    for acct in accounts:
        acct_id = str(acct.id)
        partner = ""
        if acct_id in partners_by_assign_mentee:
            partner = partners_by_assign_mentee[acct_id].organization

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
                received_count.get(acct_id, 0),
                sent_count.get(acct_id, 0),
                partner,
                _profile_stage_label(acct.email, verified_emails),
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
        "effective stage",
        "days since submit",
        "application state",
    ]

    for row in accts:
        row.extend(["", ""])

    for ap in applicants or []:
        # 21 blanks cover columns 0..20 (name through total_sent_messages).
        # The 4 real values then land in the last 4 columns: Affiliated,
        # effective stage, days since submit, application state.
        blanks = [""] * 21
        accts.append(
            blanks
            + [
                ap.get("organization") or "",  # Affiliated
                ap.get("stage_label") or "",  # effective stage
                ap.get("days_since_submit")
                if ap.get("days_since_submit") is not None
                else "",
                ap.get("application_state") or "",
            ]
        )
        accts[-1][0] = ap.get("name") or ""  # mentee name
        accts[-1][4] = ap.get("email") or ""  # email

    return generate_sheet("mentee_accounts", accts, columns, file_format)


def generate_sheet(sheet_name, row_data, columns, file_format="xlsx"):
    """Serialize row_data to XLSX (default) or CSV and return as a Flask file.

    `file_format`: "xlsx" | "csv". Anything else falls back to XLSX.
    """
    df = pd.DataFrame(row_data, columns=columns)

    if file_format == "csv":
        output = BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        try:
            return send_file(
                output,
                mimetype="text/csv",
                download_name="{0}.csv".format(sheet_name),
                as_attachment=True,
            )
        except FileNotFoundError:
            msg = "Downloads failed"
            logger.info(msg)
            return create_response(status=422, message=msg)

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
