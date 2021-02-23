from bson import ObjectId
from api.models import (
    db,
    Education,
    Video,
    MentorProfile,
    MenteeProfile,
    AppointmentRequest,
    Users,
    Image,
)
from api.utils.request_utils import imgur_client


def new_profile(data: dict = {}, profile_type: str = ""):
    if not data or not profile_type:
        return None

    new_profile = None

    if profile_type == "mentor":
        new_profile = MentorProfile(
            user_id=ObjectId(data["user_id"]),
            name=data["name"],
            email=data["email"],
            professional_title=data["professional_title"],
            specializations=data["specializations"],
            offers_in_person=data["offers_in_person"],
            offers_group_appointments=data["offers_group_appointments"],
            email_notifications=data.get("email_notifications", True),
            text_notifications=data.get("text_notifications", True),
        )

        if "videos" in data:
            videos_data = data["videos"]

            for video in videos_data:
                validate_video = VideoForm.from_json(video)

                msg, is_invalid = is_invalid_form(validate_video)
                if is_invalid:
                    return create_response(status=422, message=msg)

                new_video = Video(
                    title=video["title"],
                    url=video["url"],
                    tag=video["tag"],
                    date_uploaded=video["date_uploaded"],
                )
                new_profile.videos.append(new_video)
    elif profile_type == "mentee":
        new_profile = MenteeProfile(
            name=data["name"],
            # TODO: Change this to the actual email and remove default
            email=data.get("email", "email@gmail.com"),
            specialist_categories=data["specialist_categories"],
            email_notifications=data.get("email_notifications", True),
            text_notifications=data.get("text_notifications", True),
            organization=data["organization"],
            age=data["age"],
            gender=data["gender"],
        )
    else:
        return None

    new_profile.languages = data["languages"]
    new_profile.website = data.get("website")
    new_profile.linkedin = data.get("linkedin")
    new_profile.biography = data.get("biography")
    new_profile.phone_number = data.get("phone_number")
    new_profile.location = data.get("location")

    if "education" in data:
        new_profile.education = []
        education_data = data["education"]

        for education in education_data:
            validate_education = EducationForm.from_json(education)

            msg, is_invalid = is_invalid_form(validate_education)
            if is_invalid:
                return create_response(status=422, message=msg)

            new_education = Education(
                education_level=education["education_level"],
                majors=education["majors"],
                school=education["school"],
                graduation_year=education["graduation_year"],
            )
            new_profile.education.append(new_education)

    return new_profile


def edit_profile(data: dict = {}, profile: object = None):
    if not data or not profile:
        return None

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

        # Create video objects for each item in list
        if "videos" in data:
            video_data = data.get("videos")
            profile.videos = [
                Video(
                    title=video.get("title"),
                    url=video.get("url"),
                    tag=video.get("tag"),
                    date_uploaded=video.get("date_uploaded"),
                )
                for video in video_data
            ]
    elif isinstance(profile, MenteeProfile):
        profile.age = data.get("age", profile.age)
        profile.gender = data.get("gender", profile.gender)
        profile.organization = data.get("organization", profile.organization)
        profile.specialist_categories = data.get(
            "specialist_categories", profile.specialist_categories
        )

    profile.name = data.get("name", profile.name)
    profile.location = data.get("location", profile.location)
    profile.email = data.get("email", profile.email)
    profile.phone_number = data.get("phone_number", profile.phone_number)
    profile.languages = data.get("languages", profile.languages)
    profile.biography = data.get("biography", profile.biography)
    profile.linkedin = data.get("linkedin", profile.linkedin)
    profile.website = data.get("website", profile.website)
    profile.text_notifications = data.get(
        "text_notifications", profile.text_notifications
    )
    profile.email_notifications = data.get(
        "email_notifications", profile.email_notifications
    )

    # Create education object
    if "education" in data:
        education_data = data.get("education")
        profile.education = [
            Education(
                education_level=education.get("education_level"),
                majors=education.get("majors"),
                school=education.get("school"),
                graduation_year=education.get("graduation_year"),
            )
            for education in education_data
        ]

    return profile
