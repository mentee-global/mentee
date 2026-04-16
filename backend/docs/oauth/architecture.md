# Architecture

## Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client app
    participant UA as Browser
    participant FE as Mentee frontend (/oauth/consent)
    participant M as Mentee backend
    participant DB as MongoDB

    Note over C,UA: PKCE: client generates verifier + sha256 challenge
    C->>UA: 302 → /oauth/authorize?client_id&redirect_uri&code_challenge&state&nonce&scope

    UA->>M: GET /oauth/authorize (cookie: mentee_web_session)
    alt no session cookie
        M-->>UA: 302 /login?next=/oauth/authorize?...
        UA->>M: POST /auth/login
        M-->>UA: Set-Cookie mentee_web_session; 200
        UA->>M: GET /oauth/authorize (retry)
    end

    M->>DB: OAuthConsent.objects(user_id, client_id, revoked_at=None)
    alt consent exists and covers scopes
        M-->>UA: 302 redirect_uri?code=<authz_code>&state=...
    else first-run or new scopes
        M-->>UA: 302 FRONTEND_URL/oauth/consent?authorize_token=<itsdangerous>
        UA->>FE: GET /oauth/consent
        FE->>M: GET /oauth/consent-request?authorize_token=... (cookie)
        M-->>FE: {client_name, logo, scopes, user}
        UA->>M: POST /oauth/authorize (authorize_token, decision=approve)
        M->>DB: upsert OAuthConsent
        M-->>UA: 303 /oauth/authorize?... (replay GET)
        UA->>M: GET /oauth/authorize
        M-->>UA: 302 redirect_uri?code=<authz_code>&state=...
    end

    UA->>C: GET redirect_uri?code=...&state=...

    Note over C,M: server-to-server from here on
    C->>M: POST /oauth/token (client_secret_basic, code, code_verifier)
    M->>DB: verify client_secret (bcrypt), code unused + unexpired, sha256(verifier)==challenge
    M->>DB: mark code used_at, insert OAuthAccessToken + OAuthRefreshToken (SHA-256 hashed)
    M-->>C: {access_token, refresh_token, id_token (RS256), expires_in, scope}

    C->>M: GET /oauth/userinfo (Authorization: Bearer access_token)
    M->>DB: lookup by sha256(token); check revoked + not expired
    M-->>C: {sub, email, role, name, ...}  (claims filtered by scope)

    opt revocation
        C->>M: POST /oauth/revoke (client creds, token)
        M->>DB: set revoked=true; cascade access tokens if refresh
        M-->>C: 200
    end
```

All tokens are opaque + SHA-256 hashed at rest. `id_token` is the only JWT and is only returned in the token response body (never stored server-side).

---

## `/oauth/authorize` GET — [`oauth.py:174`](../../api/views/oauth.py)

1. No `session["user_id"]` → `302 /login?next=<original>`.
2. `authorization.get_consent_grant()` runs Authlib validation (client, redirect_uri, PKCE S256 required).
3. Errors: `invalid_client` and any PKCE error → `400 JSON` in-band (never hand details to an attacker-controlled `redirect_uri`). Other errors → redirect to `redirect_uri` with `error=...&error_description=...&state=...` only if the uri is registered.
4. Scope must be a subset of `OAuthClient.allowed_scopes` → otherwise `400 invalid_scope`.
5. Consent lookup: `OAuthConsent` keyed on `(user_id, client_id, revoked_at=None)`. If requested scopes ⊆ granted scopes → call `create_authorization_response`.
6. Otherwise mint an itsdangerous-signed **authorize_token** (5-min TTL, jti replay guard, bound to `user_id`) and `302` to `${FRONTEND_URL}/oauth/consent?authorize_token=...`.

## `/oauth/consent-request` GET — [`oauth.py:299`](../../api/views/oauth.py)

XHR from the React consent page. Verifies the authorize_token matches the current session; returns `{client_name, client_logo_url, is_first_party, scopes, user: {name, email}}`.

## `/oauth/authorize` POST — [`oauth.py:242`](../../api/views/oauth.py)

Receives `authorize_token` + `decision` from the consent form. Validates token signature + user match + unique jti. On **approve**, persists `OAuthConsent` then `303`-replays the original GET so Authlib's grant pipeline picks up the consent and issues the code. On **deny**, redirects to `redirect_uri?error=access_denied&state=...`.

## `/oauth/token` POST — [`oauth.py:352`](../../api/views/oauth.py)

Delegated to `authorization.create_token_response()`. Authlib:
1. Authenticates client via `client_secret_basic|_post` → `OAuthClient.verify_secret` (bcrypt).
2. Looks up `OAuthAuthorizationCode` — rejects if `used_at != None` (replay — triggers `_revoke_chain_for_code`) or expired.
3. Verifies `sha256(code_verifier) == code_challenge` (PKCE).
4. Marks code used. Calls our `BearerTokenGenerator` for opaque access/refresh strings.
5. `MenteeOpenIDCode.get_jwt_config` signs the id_token RS256 with the PEM from `oidc_keys.py`.
6. `_save_token` hashes the plaintexts (SHA-256) and persists `OAuthAccessToken` + `OAuthRefreshToken` with `parent_refresh_token_id=code:<code>` / `rotated_from=code:<code>`.

Plaintext tokens exist only in the HTTP response body.

## `/oauth/userinfo` — [`oauth.py:381`](../../api/views/oauth.py)

`@require_oauth("openid")` runs `MenteeBearerTokenValidator`: SHA-256s the bearer, looks up `OAuthAccessToken`, rejects on `revoked` or `is_expired()`. Handler assembles claims by scope:

- `openid` → `sub`
- `email` → `email`, `email_verified`
- `profile` → `name`, `picture`, `preferred_language`, `timezone` (from role-specific profile model)
- `mentee.role` → `role`, `role_id`

Missing fields are **omitted** (OIDC §5.3.2), not returned as `null`.

## `/oauth/revoke` — [`oauth.py:427`](../../api/views/oauth.py)

RFC 7009. Returns `200` regardless of whether the token existed. Revoking a refresh token cascades to any access tokens whose `parent_refresh_token_id` matches.

---

## Session cookie — `mentee_web_session`

OAuth's cross-domain browser redirect can only carry cookies — not `Authorization` headers or `localStorage`. So `POST /auth/login` additionally calls `install_session_for_user()` ([`web_session.py:29`](../../api/utils/web_session.py)) to install:

```python
session["user_id"]        # Mongo user id — the OAuth flow's identity
session["firebase_uid"]   # continuity with legacy Firebase calls
session["role"]
session["token_version"]  # global logout hook
```

Configured in [`api/__init__.py:48`](../../api/__init__.py):

- `HttpOnly` — no JS access
- `SameSite=Lax` — blocks cross-site CSRF; same-site form POSTs still work
- `Secure` when `ENVIRONMENT=production`
- 14-day lifetime
- Signed with `FLASK_SECRET_KEY` — app **refuses to boot** if that env var is missing and `OAUTH_ENABLED=true` ([`api/__init__.py:49`](../../api/__init__.py))

Existing `Authorization: Bearer <firebase-token>` API calls are untouched; the cookie is read only by `/oauth/*`.

---

## Data model

| Collection | Purpose | TTL |
|---|---|---|
| `oauth_clients` | Registered clients; `client_secret_hash` bcrypt; `redirect_uris`, `allowed_scopes`, `is_first_party`, `is_active` | — |
| `oauth_authorization_codes` | One-shot codes; stores `code_challenge`, `nonce`, `used_at` | 10 min (TTL index on `expires_at`) |
| `oauth_access_tokens` | `token_hash` (SHA-256), `parent_refresh_token_id`, `revoked` | 1 h |
| `oauth_refresh_tokens` | `token_hash`, `rotated_from`, `revoked`, `last_used_at` | 30 d |
| `oauth_consents` | `(user_id, client_id)` unique; `granted_scopes`, `revoked_at` | — |
| `users.token_version` | Bumped on password reset; invalidates sessions + can invalidate tokens | — |

TTL indexes (`expireAfterSeconds: 0`) are created by MongoEngine on first write. Verify in Atlas after the first production token issuance.

---

## Security primitives

- **PKCE S256 required.** Our `S256OnlyCodeChallenge` ([`oauth_server.py:203`](../../api/utils/oauth_server.py)) overrides Authlib's loose default — missing `code_challenge` or `method != S256` → `400` in-band.
- **Tokens hashed at rest (SHA-256).** Only `OAuthClient.client_secret_hash` is bcrypt because secrets are human-scale and benefit from brute-force resistance; access/refresh tokens are high-entropy (32+ bytes from `secrets.token_urlsafe`) so SHA-256 is sufficient and fast.
- **RS256 id_token.** Private key loaded once via `@lru_cache` ([`oidc_keys.py`](../../api/utils/oidc_keys.py)); public key published at `/.well-known/jwks.json` with `kid`.
- **Code replay defense.** `query_authorization_code` returns `None` if `used_at` is already set and calls `_revoke_chain_for_code` to cascade-revoke every token traceable to that code.
- **`nonce`** is stored on the code and echoed into the id_token — client verifies to defeat id_token replay.
- **`state`** is echoed unchanged — client is responsible for generating + verifying it to defeat CSRF on its callback.
- **Session cookie** is HMAC-signed with `FLASK_SECRET_KEY` — users cannot tamper with `user_id`.
- **Password-reset cascade.** `POST /auth/forgotPassword` ([`auth.py:350`](../../api/views/auth.py)) bumps `user.token_version` and sets `revoked=True` on every `OAuthAccessToken` + `OAuthRefreshToken` for that user. Next session check via `require_web_session` sees a stale `token_version` and clears the cookie.
- **Pre-redirect errors stay in-band.** `invalid_client` and PKCE failures return JSON `400`s — never redirect error details to an unvalidated `redirect_uri`.
- **CORS is per-route** ([`api/__init__.py:62`](../../api/__init__.py)). `/api/*`, `/auth/*`, `/oauth/consent-request` → configured origins + credentials. `/oauth/{token,userinfo,revoke}` + `/.well-known/*` → wildcard (bearer auth, no cookies).

---

## Boot

[`api/__init__.py:174`](../../api/__init__.py):

```python
if _oauth_enabled():
    from api.views import oauth as oauth_views
    from api.utils.oauth_server import init_authorization_server
    app.register_blueprint(oauth_views.oauth_bp, url_prefix="/oauth")
    app.register_blueprint(oauth_views.wellknown_bp)
    init_authorization_server(app)
```

`init_authorization_server` ([`oauth_server.py:242`](../../api/utils/oauth_server.py)) registers `MenteeAuthorizationCodeGrant` (with `S256OnlyCodeChallenge` + `MenteeOpenIDCode`) and `MenteeRevocationEndpoint`, and installs a `BearerTokenGenerator` that returns opaque URL-safe strings.
