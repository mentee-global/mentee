from typing import Tuple


def mentor_post_verify(
    data: dict = None, field: str = ""
) -> Tuple[str, bool]:
    # TODO: Possibly include WTForms instead in order to simplify this type of checking
    msg = ""
    error = False
    if field == "main_body":
        if "name" not in data:
            msg = "No name provided for mentor profile."
            error = True
        elif "professional_title" not in data:
            msg = "No professional title provided for mentor profile."
            error = True
        elif "linkedin" not in data:
            msg = "No linkedin provided for mentor profile."
            error = True
        elif "website" not in data:
            msg = "No website provided for mentor profile."
            error = True
        elif "picture" not in data:
            msg = "No picture provided for mentor profile."
            error = True
        elif "languages" not in data:
            msg = "No languages provided for mentor profile."
            error = True
        elif "specializations" not in data:
            msg = "No specializations provided for mentor profile."
            error = True
        elif "offers_in_person" not in data:
            msg = "No offers in person provided for mentor profile."
            error = True
        elif "offers_group_appointments" not in data:
            msg = "No offers group appointments provided for mentor profile."
            error = True

    elif field == "education":
        if "education_level" not in data:
            msg = "No education_level provided for mentor education"
            error = True
        elif "majors" not in data:
            msg = "No majors provided for mentor education"
            error = True
        elif "school" not in data:
            msg = "No school provided for mentor education"
            error = True
        elif "graduation_year" not in data:
            msg = "No graduation year provided for mentor education"
            error = True

    elif field == "video":
        if "title" not in data:
            msg = "No title provided for mentor video"
            error = True
        if "url" not in data:
            msg = "No URL provided for mentor video"
            error = True
        if "tag" not in data:
            msg = "No tag provided for mentor video"
            error = True

    return msg, error