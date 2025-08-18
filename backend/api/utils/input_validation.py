import re
import html
import magic
import os
from email_validator import validate_email, EmailNotValidError
from api.utils.constants import Account


def validate_email_format(email):
    if not email or not isinstance(email, str):
        return False, "Email is required"

    email = sanitize_text(email)
    if "<" in email or ">" in email or "script" in email.lower():
        return False, "Invalid email format"

    try:
        validate_email(email)
        return True, None
    except EmailNotValidError:
        return False, "Invalid email format"


def validate_password(password):
    if not password or not isinstance(password, str):
        return False, "Password is required"
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    if len(password) > 128:
        return False, "Password too long"
    return True, None


def validate_role(role):
    if role is None:
        return False, "Role is required"
    try:
        role_int = int(role)
        valid_roles = [
            Account.ADMIN.value,
            Account.MENTOR.value,
            Account.MENTEE.value,
            Account.PARTNER.value,
            Account.GUEST.value,
            Account.SUPPORT.value,
            Account.HUB.value,
            Account.MODERATOR.value,
        ]
        if role_int not in valid_roles:
            return False, "Invalid role"
        return True, None
    except (ValueError, TypeError):
        return False, "Role must be a number"


def sanitize_text(text):
    if not text:
        return ""
    if not isinstance(text, str):
        text = str(text)
    text = html.escape(text)
    text = text.strip()
    return text[:1000]


def validate_string_length(text, max_length=1000, field_name="Field"):
    if text and len(str(text)) > max_length:
        return False, f"{field_name} too long (max {max_length} characters)"
    return True, None


def validate_object_id(obj_id):
    if not obj_id or not isinstance(obj_id, str):
        return False, "Invalid ID format"
    if not re.match(r"^[a-fA-F0-9]{24}$", obj_id):
        return False, "Invalid ID format"
    return True, None


def validate_json_data(data, required_fields=None):
    if not data or not isinstance(data, dict):
        return False, "Invalid JSON data"

    if required_fields:
        for field in required_fields:
            if field not in data:
                return False, f"Missing required field: {field}"

    return True, None


def validate_file_upload(file, allowed_extensions=None, max_size_mb=50):
    if not file:
        return False, "No file provided"

    if not file.filename:
        return False, "Missing filename"

    if allowed_extensions is None:
        allowed_extensions = {
            ".pdf",
            ".doc",
            ".docx",
            ".txt",
            ".csv",
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
        }
    else:
        allowed_extensions = {"." + ext.lstrip(".") for ext in allowed_extensions}

    file_ext = (
        "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    )

    if file_ext not in allowed_extensions:
        return False, "File type not allowed"

    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)

    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        return False, f"File too large (max {max_size_mb}MB)"

    if file_size == 0:
        return False, "Empty file not allowed"

    try:
        file_content = file.read(8192)
        file.seek(0)

        mime_type = magic.from_buffer(file_content, mime=True)

        allowed_mimes = {
            ".pdf": "application/pdf",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".csv": "text/csv",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
        }

        expected_mime = allowed_mimes.get(file_ext)
        if (
            expected_mime
            and not mime_type.startswith(expected_mime.split("/")[0])
            and mime_type != expected_mime
        ):
            if not (
                file_ext in [".csv", ".txt"]
                and mime_type in ["text/plain", "text/csv", "application/csv"]
            ):
                return False, "File content does not match extension"

        suspicious_patterns = [
            b"<script",
            b"javascript:",
            b"vbscript:",
            b"<?php",
            b"<%",
            b"\x4d\x5a",
        ]
        for pattern in suspicious_patterns:
            if pattern in file_content:
                return False, "Suspicious file content detected"

        safe, safety_msg = validate_file_content_safety(file)
        if not safe:
            return False, safety_msg

    except Exception:
        return False, "Unable to verify file content"

    return True, None


def secure_filename_enhanced(filename):
    if not filename:
        return "unnamed_file"

    filename = os.path.basename(filename)
    filename = re.sub(r'[<>:"/\\|?*]', "", filename)
    filename = re.sub(r"[^\w\s.-]", "", filename)
    filename = re.sub(r"\.\.+", ".", filename)
    filename = re.sub(r"\s+", "_", filename)
    filename = filename.strip("._")

    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:200] + ext

    if not filename or filename.startswith("."):
        filename = "file_" + filename

    return filename


def validate_file_content_safety(file):
    try:
        file.seek(0)
        content = file.read(16384)
        file.seek(0)

        malicious_signatures = [
            b"\x4d\x5a",
            b"\x50\x4b\x03\x04",
            b"\x7f\x45\x4c\x46",
            b"\xfe\xed\xfa",
            b"exec(",
            b"eval(",
            b"import os",
            b"import subprocess",
            b"__import__",
            b"<script",
            b"javascript:",
            b"vbscript:",
            b"<?php",
            b"<%",
            b"onload=",
            b"onerror=",
        ]

        for signature in malicious_signatures:
            if signature in content.lower():
                return False, "Potentially malicious content detected"

        return True, None
    except Exception:
        return False, "Unable to scan file content"
