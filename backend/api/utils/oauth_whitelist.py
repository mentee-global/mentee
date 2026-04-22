"""Shared OAuth-client whitelist check.

Lives in its own module so both the authorize flow (`api/views/oauth.py`) and
the grant pipeline (`api/utils/oauth_server.py`) can import it without pulling
in their mutual dependencies.

Semantics:
- Both lists empty => open client, anyone logged in is allowed.
- Non-empty => user passes iff role OR user-id matches (union).
- When the client has `bypass_admin=True`, admins pass regardless of the
  whitelist contents.
- `is_active=false` and missing users are handled by callers.
"""

import logging

from api.utils.constants import Account

logger = logging.getLogger(__name__)

_ADMIN_ROLE = str(Account.ADMIN.value)


def user_is_whitelisted(client, user_doc) -> bool:
    roles = list(client.whitelist_roles or []) if client else []
    user_ids = list(client.whitelist_user_ids or []) if client else []
    if not roles and not user_ids:
        return True
    if user_doc is None:
        return False
    role_val = getattr(user_doc, "role", None)
    if (
        getattr(client, "bypass_admin", False)
        and role_val is not None
        and str(role_val) == _ADMIN_ROLE
    ):
        logger.info(
            "oauth.whitelist_admin_bypass client_id=%s user_id=%s",
            getattr(client, "client_id", None),
            getattr(user_doc, "id", None),
        )
        return True
    if str(user_doc.id) in user_ids:
        return True
    if role_val is not None and str(role_val) in roles:
        return True
    return False
