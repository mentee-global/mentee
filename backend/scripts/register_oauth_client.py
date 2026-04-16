"""Register an OAuth client. Prints the generated client_secret once.

    python backend/scripts/register_oauth_client.py \
        --client-id mentee-bot-local \
        --name "Mentee Bot (local)" \
        --redirect-uri http://localhost:8001/api/auth/callback \
        --scope "openid email profile mentee.role" \
        --first-party
"""
import argparse
import os
import secrets
import sys

import bcrypt

_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.normpath(os.path.join(_HERE, os.pardir))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from api import create_app  # noqa: E402
from api.models import OAuthClient  # noqa: E402


RESERVED_SCOPE_PREFIX = "mentee.api"


def create_oauth_client(
    client_id: str,
    client_name: str,
    redirect_uris,
    allowed_scopes,
    is_first_party: bool = False,
    client_logo_url: str = None,
    allow_reserved: bool = False,
) -> str:
    if not allow_reserved:
        for s in allowed_scopes:
            if s.startswith(RESERVED_SCOPE_PREFIX):
                raise ValueError(
                    f"Scope '{s}' is reserved. Pass allow_reserved=True to override."
                )

    if OAuthClient.objects(client_id=client_id).first():
        raise ValueError(f"client_id '{client_id}' already exists")

    secret_plain = secrets.token_urlsafe(48)
    secret_hash = bcrypt.hashpw(secret_plain.encode("utf-8"), bcrypt.gensalt()).decode(
        "utf-8"
    )

    OAuthClient(
        client_id=client_id,
        client_secret_hash=secret_hash,
        client_name=client_name,
        client_logo_url=client_logo_url,
        redirect_uris=list(redirect_uris),
        allowed_scopes=list(allowed_scopes),
        response_types=["code"],
        grant_types=["authorization_code", "refresh_token"],
        token_endpoint_auth_method="client_secret_basic",
        is_first_party=bool(is_first_party),
        is_active=True,
    ).save()

    return secret_plain


def main(argv=None):
    parser = argparse.ArgumentParser(description="Register a new OAuth client")
    parser.add_argument("--client-id", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument(
        "--redirect-uri",
        action="append",
        required=True,
        help="Can be passed multiple times",
    )
    parser.add_argument(
        "--scope",
        default="openid email profile mentee.role",
        help="Space-separated allowed scopes",
    )
    parser.add_argument("--logo-url")
    parser.add_argument("--first-party", action="store_true")
    parser.add_argument("--allow-reserved", action="store_true")
    args = parser.parse_args(argv)

    app = create_app()
    with app.app_context():
        try:
            secret = create_oauth_client(
                client_id=args.client_id,
                client_name=args.name,
                redirect_uris=args.redirect_uri,
                allowed_scopes=args.scope.split(),
                is_first_party=args.first_party,
                client_logo_url=args.logo_url,
                allow_reserved=args.allow_reserved,
            )
        except ValueError as e:
            print(f"error: {e}", file=sys.stderr)
            sys.exit(2)

    print("Client registered.")
    print(f"  client_id:     {args.client_id}")
    print(f"  client_secret: {secret}")
    print("Store this secret NOW — it will not be shown again.")


if __name__ == "__main__":
    main()
