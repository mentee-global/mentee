# Operations

## Local dev

### Generate the RSA key (once)

```bash
mkdir -p backend/keys
openssl genrsa -out backend/keys/oidc-private.pem 2048
```

Already gitignored.

### `.env`

```bash
OAUTH_ENABLED=true
OAUTH_ISSUER=http://localhost:8000
FLASK_SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(64))')
ENVIRONMENT=local
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### Register a client

```bash
cd backend && .venv/bin/python scripts/register_oauth_client.py \
  --client-id my-client-local \
  --name "My Client (local)" \
  --redirect-uri http://localhost:8001/oauth/callback \
  --scope "openid email profile mentee.role" \
  --first-party
```

(`--first-party` skips the consent screen entirely — scopes are auto-approved on every authorization. Use only for Mentee-owned clients. Omit for third-party clients so users see the consent prompt on first visit.)

The plaintext secret is printed **once**. Copy immediately.

### Grant an additional scope to a registered client

`mentee.api.*` scopes are reserved and not granted at registration. To grant
one (e.g. to enable `/oauth/profile` for the Bot):

```bash
cd backend && .venv/bin/python scripts/grant_oauth_scope.py \
  --client-id mentee-bot-local \
  --scope mentee.api.profile.read \
  --allow-reserved
```

### `/oauth/profile`

`GET /oauth/profile` returns the curated mentee DTO (`{"version": 1, "data": {...}}`).
Requires a bearer access token whose scope includes `mentee.api.profile.read`. The
DTO omits empty/null fields and never exposes Firebase UIDs, raw ObjectIds, phone
numbers, or internal settings.

### End-to-end smoke test (curl)

```bash
# 1. Discovery
curl -s localhost:8000/.well-known/openid-configuration | jq .issuer

# 2. Log in (installs mentee_web_session cookie)
curl -s -c jar.txt -X POST localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"...","role":2}'

# 3. Generate PKCE
python3 -c "
import secrets, hashlib, base64
v = secrets.token_urlsafe(64)[:96]
c = base64.urlsafe_b64encode(hashlib.sha256(v.encode()).digest()).rstrip(b'=').decode()
print('VERIFIER:', v)
print('CHALLENGE:', c)
"

# 4. Authorize (browser — cookie required; check Location header)
#    Paste this URL in a logged-in browser session:
#    http://localhost:8000/oauth/authorize?response_type=code
#    &client_id=my-client-local
#    &redirect_uri=http://localhost:8001/oauth/callback
#    &scope=openid+email+profile+mentee.role
#    &code_challenge=<CHALLENGE>&code_challenge_method=S256
#    &state=xyz&nonce=n1
#    First visit → consent page at FRONTEND_URL. Approve → 302 to redirect_uri?code=...

# 5. Exchange
curl -s -u my-client-local:<SECRET> -X POST localhost:8000/oauth/token \
  -d grant_type=authorization_code \
  -d code=<CODE> \
  -d redirect_uri=http://localhost:8001/oauth/callback \
  -d code_verifier=<VERIFIER> | jq

# 6. Userinfo
curl -s localhost:8000/oauth/userinfo -H "Authorization: Bearer <access_token>" | jq

# 7. Revoke
curl -s -u my-client-local:<SECRET> -X POST localhost:8000/oauth/revoke \
  -d "token=<access_token>" -d token_type_hint=access_token
```

### Inspect id_token

Paste the JWT at [jwt.io](https://jwt.io) + paste the JWKS response (`/.well-known/jwks.json`) into the verifier panel. Expected claims: `iss`, `sub`, `aud`, `exp`, `iat`, `nonce`, and scope-dependent identity claims.

### Negative tests (must all fail)

| Action | Expected |
|---|---|
| Replay a used `code` | `400 invalid_grant` + chain of tokens from that code marked `revoked=true` |
| Wrong `code_verifier` | `400 invalid_grant` |
| Wrong `client_secret` | `401 invalid_client` |
| `Bearer wrongtoken` on userinfo | `401 invalid_token` + `WWW-Authenticate` header |
| `code_challenge_method=plain` | `400 invalid_request` in-band |
| Missing `code_challenge` | `400 invalid_request` in-band |
| Unknown `client_id` | `400 invalid_client` in-band |
| `redirect_uri` not in client's list | `400 invalid_request` |
| Wait 10 min + exchange code | `400 invalid_grant` (or TTL reaper already removed it) |
| `POST /auth/forgotPassword` → reuse old access token | `401` (cascade revoked) |
| `OAUTH_ENABLED=false` + restart + hit discovery | `404` |

---

## Production deployment (Heroku)

### Stage 1 — deploy with flag OFF

```bash
heroku config:set \
  OAUTH_ENABLED=false \
  FLASK_SECRET_KEY="$(python3 -c 'import secrets; print(secrets.token_urlsafe(64))')" \
  OAUTH_ISSUER=https://app.menteeglobal.org \
  OIDC_KEY_ID=mentee-oidc-v1 \
  ENVIRONMENT=production \
  CORS_ORIGINS=https://app.menteeglobal.org,https://<client-origin> \
  FRONTEND_URL=https://app.menteeglobal.org \
  -a <app>

# Generate a fresh RSA key (never reuse dev):
openssl genrsa 2048 > /tmp/prod.pem
heroku config:set OIDC_PRIVATE_KEY_PEM="$(cat /tmp/prod.pem)" -a <app>
rm /tmp/prod.pem

git push heroku main
```

With `OAUTH_ENABLED=false`: no `/oauth/*` or `/.well-known/*` routes, no Authlib wiring, no session cookie installed on `/auth/login`. Existing flows are byte-identical. Smoke-test regular Mentee features and confirm `curl https://app.menteeglobal.org/.well-known/openid-configuration` returns `404`.

### Stage 2 — flip the flag

```bash
heroku config:set OAUTH_ENABLED=true -a <app>
```

Dyno restarts automatically. Verify:

```bash
curl https://app.menteeglobal.org/.well-known/openid-configuration | jq .issuer
# → "https://app.menteeglobal.org"

curl https://app.menteeglobal.org/.well-known/jwks.json | jq '.keys[0].kid'
# → "mentee-oidc-v1"
```

Register each production client with `heroku run python backend/scripts/register_oauth_client.py ...`. Deliver the plaintext secret through a secure channel (1Password share, Signal) — **never plaintext Slack**.

### Rollback

```bash
heroku config:set OAUTH_ENABLED=false -a <app>
```

Auto-restart. `/oauth/*` routes vanish. No code deploy, no downtime.

### TTL indexes

After the first production token issuance, confirm in Atlas → Browse Collections → Indexes:

- `oauth_authorization_codes` → TTL badge on `expires_at`
- `oauth_access_tokens` → same

If missing, create manually:

```javascript
db.oauth_authorization_codes.createIndex({"expires_at":1},{"expireAfterSeconds":0})
db.oauth_access_tokens.createIndex({"expires_at":1},{"expireAfterSeconds":0})
```

### Multi-dyno

Session cookie is client-side and signed with `FLASK_SECRET_KEY` — shared via Heroku config, any dyno can verify any cookie. Private signing key is in `OIDC_PRIVATE_KEY_PEM` — all dynos load the same key via `@lru_cache`. No sticky sessions or Redis required.

The in-process authorize-token replay set ([`oauth.py:38`](../../api/views/oauth.py) `_AUTHORIZE_JTI_SEEN`) is best-effort per-dyno; the 5-min TTL + user_id binding keeps the window narrow. Swap for Redis or a TTL Mongo collection before scaling beyond a handful of dynos.

### Rotating `FLASK_SECRET_KEY`

Invalidates every `mentee_web_session` cookie — all active OAuth sessions require re-login. Rotate only on suspected compromise or yearly hygiene. Rotate the OIDC signing key independently.

---

## Known gaps

- **Admin REST API** — client CRUD + secret rotation currently only via `scripts/register_oauth_client.py`. Plan calls for `/api/admin/oauth-clients` + admin React UI.
- **Connected Apps API** — `/api/user/connected-apps` (list + revoke) not yet implemented.
- **Rate limiting** — no `flask-limiter` yet. Budget: `/oauth/token` 20/min/IP, `/oauth/authorize` 60/min/IP, `/oauth/userinfo` 120/min/token, `/oauth/revoke` 20/min/IP.
- **Multi-key JWKS** — `public_jwks()` publishes a single key. Safe key rotation needs old + new keys served simultaneously for the duration of clients' cache TTLs.
- **Replay store** — authorize-token jti replay guard is in-process. Single-dyno only without changes.
- **Profile claims** — `profile` scope reads from `MentorProfile` / `MenteeProfile` / `PartnerProfile`. Admin / guest / support / hub / moderator roles get `sub`+`email` only.

---

## Format check

Per root `CLAUDE.md`:

```bash
cd backend && .venv/bin/black . --check
```

Fix with `cd backend && .venv/bin/black .` and re-run.
