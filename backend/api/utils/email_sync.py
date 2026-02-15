from api.core import logger
from api.models import (
    Admin,
    Guest,
    Hub,
    MentorProfile,
    MenteeProfile,
    MentorApplication,
    MenteeApplication,
    NewMentorApplication,
    PartnerApplication,
    PartnerProfile,
    Support,
    Moderator,
    Users,
    VerifiedEmail,
)


def update_email_across_models(old_email: str, new_email: str) -> None:
    if not old_email or not new_email:
        return
    old_email_normalized = old_email.strip()
    new_email_normalized = new_email.strip().lower()
    if old_email_normalized.lower() == new_email_normalized:
        return

    models = [
        MenteeApplication,
        MentorApplication,
        NewMentorApplication,
        PartnerApplication,
        MenteeProfile,
        MentorProfile,
        PartnerProfile,
        Users,
        VerifiedEmail,
        Guest,
        Support,
        Moderator,
        Admin,
        Hub,
    ]

    for model in models:
        try:
            model.objects(email__iexact=old_email_normalized).update(
                set__email=new_email_normalized
            )
        except Exception as exc:
            logger.error(
                f"Failed updating email for {model.__name__} {old_email_normalized} -> {new_email_normalized}: {exc}"
            )
