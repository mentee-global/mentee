# OAuth Provider — Backend

Mentee is an OAuth 2.1 / OIDC **authorization server**. Registered client apps redirect users here to log in and receive `access_token` + `refresh_token` + signed `id_token`.

Entire surface is gated by `OAUTH_ENABLED`. With the flag off, no `/oauth/*` or `/.well-known/*` routes are registered and the codebase behaves exactly as before.

---

## Read these

- **[architecture.md](architecture.md)** — request flow, data model, security primitives, code map
- **[operations.md](operations.md)** — local setup, deployment, testing commands, known gaps

---

## Routes

| Route | Method | Auth | Notes |
|---|---|---|---|
| `/.well-known/openid-configuration` | GET | public | OIDC discovery |
| `/.well-known/jwks.json` | GET | public | Public signing key(s) |
| `/oauth/authorize` | GET | `mentee_web_session` cookie | Browser redirect — starts the flow |
| `/oauth/authorize` | POST | cookie + authorize_token | Consent decision (approve/deny) |
| `/oauth/consent-request` | GET | cookie + authorize_token | Metadata for the React consent page |
| `/oauth/token` | POST | `client_secret_basic` / `_post` | Code → tokens exchange |
| `/oauth/userinfo` | GET/POST | `Authorization: Bearer <access_token>` | Identity claims |
| `/oauth/revoke` | POST | client credentials | RFC 7009 |

---

## Key files

| File | Role |
|---|---|
| [`api/views/oauth.py`](../../api/views/oauth.py) | Route handlers + consent token mint/verify |
| [`api/utils/oauth_server.py`](../../api/utils/oauth_server.py) | Authlib wiring — grants, PKCE, token generator, id_token signing |
| [`api/utils/oidc_keys.py`](../../api/utils/oidc_keys.py) | RSA private key loader + JWKS builder |
| [`api/utils/web_session.py`](../../api/utils/web_session.py) | `install_session_for_user`, `require_web_session` decorator |
| [`api/views/auth.py`](../../api/views/auth.py) | `/auth/login` installs the session; `/auth/forgotPassword` cascades token revocation |
| [`api/models/OAuth*.py`](../../api/models/) | `OAuthClient`, `OAuthAuthorizationCode`, `OAuthAccessToken`, `OAuthRefreshToken`, `OAuthConsent` |
| [`scripts/register_oauth_client.py`](../../scripts/register_oauth_client.py) | CLI to register clients |

---

## Environment variables

| Var | Required when | Purpose |
|---|---|---|
| `OAUTH_ENABLED` | always | `true` registers the blueprints |
| `FLASK_SECRET_KEY` | `OAUTH_ENABLED=true` | Signs the `mentee_web_session` cookie. App refuses to boot without it when the flag is on |
| `OAUTH_ISSUER` | prod | `iss` claim + base URL in discovery (e.g. `https://app.menteeglobal.org`) |
| `OIDC_PRIVATE_KEY_PEM` | prod | RSA 2048 PEM string (never commit) |
| `OIDC_PRIVATE_KEY_PATH` | optional | Alternate PEM file path |
| `OIDC_KEY_ID` | optional | `kid` header; default `mentee-oidc-v1` |
| `ENVIRONMENT` | prod | `production` enables `Secure` cookies |
| `CORS_ORIGINS` | prod | Comma-separated allowed origins for cookie-bearing routes |
| `FRONTEND_URL` | always | Base URL for consent redirects (e.g. `http://localhost:3000`) |

---

## Triage

| Symptom | Check |
|---|---|
| 404 on `/.well-known/openid-configuration` | `OAUTH_ENABLED` is off → blueprints not registered |
| Boot fails with `FLASK_SECRET_KEY must be set` | Set the var or flip `OAUTH_ENABLED=false` |
| 500 on `/oauth/token` | PEM not loadable — check `OIDC_PRIVATE_KEY_PEM` or the file path |
| 302 → `/login?next=...` on `/oauth/authorize` | No session cookie — hit `POST /auth/login` first |
| 401 on `/oauth/userinfo` | Token expired (1h), revoked, or hash mismatch |
| Consent page stuck loading | `/oauth/consent-request` returned `invalid_token` or `user_mismatch` — token bound to a different session |
