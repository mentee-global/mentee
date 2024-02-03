from api.models.PartnerProfile import PartnerProfile
from api.models import Education, Video, MentorProfile, MenteeProfile
from api.utils.constants import Account


def new_profile(data: dict = {}, profile_type: int = -1):
    """Parses data given by POST request

    Args:
        data (dict): POST Data. Defaults to {}.
        profile_type (int): Type of account parsing. Defaults to -1

    Returns:
        MongoDB Model: Depending on type it returns the respective model object
    """
    if not data or profile_type == -1:
        return None

    new_profile = None
    if profile_type == Account.PARTNER:
        new_profile = PartnerProfile(
            firebase_uid=data["firebase_uid"],
            email=data["email"],
            organization=data["organization"],
            location=data["location"],
            regions=data["regions"],
            intro=data["intro"],
            open_grants=data.get("open_grants"),
            open_projects=data.get("open_projects"),
            topics=data.get("topics"),
            sdgs=data.get("sdgs"),
            email_notifications=data.get("email_notifications", True),
            text_notifications=data.get("text_notifications", False),
        )
        new_profile.website = data.get("website")
        new_profile.linkedin = data.get("linkedin")
        new_profile.person_name = data.get("person_name")
        return new_profile

    elif profile_type == Account.MENTOR:
        new_profile = MentorProfile(
            firebase_uid=data["firebase_uid"],
            name=data["name"],
            email=data["email"],
            professional_title=data["professional_title"],
            specializations=data["specializations"],
            offers_in_person=data.get("offers_in_person", False),
            offers_group_appointments=data.get("offers_group_appointments", False),
            email_notifications=data.get("email_notifications", True),
            text_notifications=data.get("text_notifications", False),
            taking_appointments=data.get("taking_appointments", False),
        )

        new_profile.website = data.get("website")
        new_profile.linkedin = data.get("linkedin")
        new_profile.video = data.get("video")

        if "videos" in data:
            video_data = data.get("videos")
            new_profile.videos = [
                Video(
                    title=video["title"],
                    url=video["url"],
                    tag=video["tag"],
                    date_uploaded=video["date_uploaded"],
                )
                for video in video_data
            ]
    elif profile_type == Account.MENTEE:
        new_profile = MenteeProfile(
            firebase_uid=data["firebase_uid"],
            name=data["name"],
            # TODO: Change this to the actual email and remove default
            email=data.get("email", "email@gmail.com"),
            email_notifications=data.get("email_notifications", True),
            text_notifications=data.get("text_notifications", False),
            organization=data["organization"],
            specializations=data.get("specializations", None),
            age=data["age"],
            gender=data["gender"],
            is_private=data.get("is_private", False),
        )

        if "video" in data and data.get("video") is not None:
            video_data = data.get("video")
            new_profile.video = Video(
                title=video_data["title"],
                url=video_data["url"],
                tag=video_data["tag"],
                date_uploaded=video_data["date_uploaded"],
            )
    else:
        # There is not match with mentee/mentor
        return None

    new_profile.languages = data["languages"]
    new_profile.biography = data.get("biography")
    new_profile.phone_number = data.get("phone_number")
    new_profile.location = data.get("location")

    if "education" in data:
        education_data = data.get("education")
        if education_data is not None:
            new_profile.education = [
                Education(
                    education_level=education.get("education_level"),
                    majors=education.get("majors"),
                    school=education.get("school"),
                    graduation_year=education.get("graduation_year"),
                )
                for education in education_data
            ]

    return new_profile


def edit_profile(data: dict = {}, profile: object = None):
    """PUT Request Parsing

    Args:
        data (dict, optional): PUT Request data. Defaults to {}.
        profile (MongoDB Model, optional): Edits the model in place. Defaults to None.

    Returns:
        Boolean: True if successful otherwise false
    """
    if not data or not profile:
        return False
    if isinstance(profile, PartnerProfile):
        # Edit fields or keep original data if no added data
        profile.organization = data.get("organization", profile.organization)
        profile.location = data.get("location", profile.location)
        profile.email = data.get("email", profile.email)
        profile.regions = data.get("regions", profile.regions)
        profile.open_grants = data.get("open_grants", profile.open_grants)
        profile.open_projects = data.get("open_projects", profile.open_projects)
        profile.linkedin = data.get("linkedin", profile.linkedin)
        profile.topics = data.get("topics", profile.topics)
        profile.sdgs = data.get("sdgs", profile.sdgs)
        profile.intro = data.get("intro", profile.intro)
        profile.person_name = data.get("person_name", profile.person_name)

        profile.website = data.get("website", profile.website)
        profile.text_notifications = data.get(
            "text_notifications", profile.text_notifications
        )
        profile.email_notifications = data.get(
            "email_notifications", profile.email_notifications
        )
        profile.restricted = data.get("restricted", profile.restricted)
        profile.assign_mentors = data.get("assign_mentors", profile.assign_mentors)
        profile.assign_mentees = data.get("assign_mentees", profile.assign_mentees)
        profile.preferred_language = data.get(
            "preferred_language", profile.preferred_language
        )
        return True

    if isinstance(profile, MentorProfile):
        # Edit fields or keep original data if no added data
        profile.professional_title = data.get(
            "professional_title", profile.professional_title
        )
        profile.specializations = data.get("specializations", profile.specializations)
        profile.offers_group_appointments = data.get(
            "offers_group_appointments", profile.offers_group_appointments
        )
        profile.offers_in_person = data.get(
            "offers_in_person", profile.offers_in_person
        )
        profile.taking_appointments = data.get(
            "taking_appointments", profile.taking_appointments
        )
        profile.linkedin = data.get("linkedin", profile.linkedin)
        profile.website = data.get("website", profile.website)
        if "video" in data and data.get("video") is not None:
            video_data = data.get("video")
            if video_data:
                profile.video = Video(
                    title=video_data.get("title"),
                    url=video_data.get("url"),
                    tag=video_data.get("tag"),
                    date_uploaded=video_data.get("date_uploaded"),
                )
                if profile.videos:
                    profile.videos[0] = profile.video
                else:
                    profile.videos = [profile.video]
            else:
                profile.video = None
                if profile.videos:
                    profile.videos = profile.videos[1:]
        # Create video objects for each item in list
        if "videos" in data:
            video_data = data.get("videos")
            if video_data:
                profile.videos = [
                    Video(
                        title=video.get("title"),
                        url=video.get("url"),
                        tag=video.get("tag"),
                        date_uploaded=video.get("date_uploaded"),
                    )
                    for video in video_data
                ]
                profile.video = profile.videos[0]
            else:
                profile.videos = []
                profile.video = None
    elif isinstance(profile, MenteeProfile):
        profile.age = data.get("age", profile.age)
        profile.gender = data.get("gender", profile.gender)
        profile.organization = data.get("organization", profile.organization)
        profile.is_private = data.get("is_private", profile.is_private)
        profile.specializations = data.get("specializations", profile.specializations)

        if "video" in data and data.get("video") is not None:
            video_data = data.get("video")

            if video_data:
                profile.video = Video(
                    title=video_data.get("title"),
                    url=video_data.get("url"),
                    tag=video_data.get("tag"),
                    date_uploaded=video_data.get("date_uploaded"),
                )
            else:
                profile.video = None

    profile.name = data.get("name", profile.name)
    profile.location = data.get("location", profile.location)
    profile.email = data.get("email", profile.email)
    profile.phone_number = data.get("phone_number", profile.phone_number)
    profile.languages = data.get("languages", profile.languages)
    profile.biography = data.get("biography", profile.biography)
    profile.text_notifications = data.get(
        "text_notifications", profile.text_notifications
    )
    profile.email_notifications = data.get(
        "email_notifications", profile.email_notifications
    )
    profile.preferred_language = data.get(
        "preferred_language", profile.preferred_language
    )

    # Create education object
    if "education" in data:
        education_data = data.get("education")
        if education_data is not None:
            profile.education = [
                Education(
                    education_level=education.get("education_level"),
                    majors=education.get("majors"),
                    school=education.get("school"),
                    graduation_year=education.get("graduation_year"),
                )
                for education in education_data
            ]

    return True
