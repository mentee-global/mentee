"""Add an allowed scope to an existing OAuthClient.

    python backend/scripts/grant_oauth_scope.py \
        --client-id mentee-bot-local \
        --scope mentee.api.profile.read

Reserved `mentee.api.*` scopes require --allow-reserved, matching the
guard in register_oauth_client.py.
"""

import argparse
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.normpath(os.path.join(_HERE, os.pardir))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from api import create_app  # noqa: E402
from api.models import OAuthClient  # noqa: E402


RESERVED_SCOPE_PREFIX = "mentee.api"


def grant_scope(client_id: str, scope: str, allow_reserved: bool = False) -> bool:
    if scope.startswith(RESERVED_SCOPE_PREFIX) and not allow_reserved:
        raise ValueError(
            f"Scope '{scope}' is reserved. Pass --allow-reserved to override."
        )
    client = OAuthClient.objects(client_id=client_id).first()
    if not client:
        raise ValueError(f"client_id '{client_id}' not found")

    existing = list(client.allowed_scopes or [])
    if scope in existing:
        return False
    existing.append(scope)
    client.allowed_scopes = existing
    client.save()
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description="Grant a scope to an OAuth client")
    parser.add_argument("--client-id", required=True)
    parser.add_argument("--scope", required=True)
    parser.add_argument("--allow-reserved", action="store_true")
    args = parser.parse_args(argv)

    app = create_app()
    with app.app_context():
        try:
            added = grant_scope(
                client_id=args.client_id,
                scope=args.scope,
                allow_reserved=args.allow_reserved,
            )
        except ValueError as e:
            print(f"error: {e}", file=sys.stderr)
            sys.exit(2)

    if added:
        print(f"Granted scope '{args.scope}' to client '{args.client_id}'.")
    else:
        print(f"Client '{args.client_id}' already has scope '{args.scope}'.")


if __name__ == "__main__":
    main()
