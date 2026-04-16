from functools import wraps
from urllib.parse import quote_plus

from flask import session, redirect, request

from api.models import Users


def current_user_id():
    return session.get("user_id")


def require_web_session(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return redirect(f"/login?next={quote_plus(request.full_path)}")

        user = Users.objects(id=user_id).first()
        if not user or session.get("token_version", 0) != (user.token_version or 0):
            session.clear()
            return redirect(f"/login?next={quote_plus(request.full_path)}")
        return f(*args, **kwargs)

    return wrapper


def install_session_for_user(user_doc):
    session.permanent = True
    session["firebase_uid"] = user_doc.firebase_uid
    session["user_id"] = str(user_doc.id)
    session["role"] = user_doc.role
    session["token_version"] = user_doc.token_version or 0
