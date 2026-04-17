"""Shared OAuth-client whitelist check.

Lives in its own module so both the authorize flow (`api/views/oauth.py`) and
the grant pipeline (`api/utils/oauth_server.py`) can import it without pulling
in their mutual dependencies.

Semantics:
- Both lists empty => open client, anyone logged in is allowed.
- Non-empty => user passes iff role OR user-id matches (union).
- `is_active=false` and missing users are handled by callers.
"""


def user_is_whitelisted(client, user_doc) -> bool:
    roles = list(client.whitelist_roles or []) if client else []
    user_ids = list(client.whitelist_user_ids or []) if client else []
    if not roles and not user_ids:
        return True
    if user_doc is None:
        return False
    if str(user_doc.id) in user_ids:
        return True
    role_val = getattr(user_doc, "role", None)
    if role_val is not None and str(role_val) in roles:
        return True
    return False
