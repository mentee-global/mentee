# Parallel Railway preview

This setup prepares a Railway preview of MENTEE using the existing development
Atlas database. It does not change Heroku,
Atlas, production DNS, or the Railway projects already running in this workspace.
Keep SendGrid as the email provider throughout the infrastructure migration.

## Preview resources

Create a new project in the Mentee workspace with a `preview` environment.
Reuse the development database already used by `mentee-dev`: project `MENTEE`,
M0 cluster `cluster0.bjvbg.mongodb.net`, database `mentee`. No new database or
production data export is needed for this first phase. Test writes are shared
with the existing Heroku development app, so use dedicated test records and
do not run destructive cleanup jobs against this shared database.

Use development database credentials scoped to this cluster and database. Keep
Atlas network access limited to the preview's required egress addresses; do not
open the production cluster or broaden its network access for the preview.

The later database-migration rehearsal can use a private Railway MongoDB service
with an independent `mentee_preview` database. Do not switch production data as
part of this initial application preview.

Reuse the existing Firebase project `mentee-d0304` for authentication. Use
dedicated test accounts: Firebase identities are shared with production, so
deleting accounts, changing passwords or email addresses, and revoking sessions
also affects those accounts in production. Do not run these tests on real users,
even if their profiles appear in the development database.

Use a separate GCS bucket in the same Google Cloud project for preview files.
Use a service account for the preview with only the Firebase permissions needed
for the tests and file access scoped to the preview bucket. A separate Firebase
project is still supported but is not required.

Use the repository root as the build context and `Dockerfile.railway` as the
Dockerfile. Configure the web service with `/deploy/railway/web.json` as its
Railway config file. Do not create the notification worker until the web preview
has been verified. Its config file is `/deploy/railway/worker.json`.

The existing `backend/Dockerfile` and Heroku `Procfile` are not changed.

## Configuration

The following variables are required for the preview. Store secret values in
Railway variables, not in source files or build arguments.

| Variable | Preview value |
| --- | --- |
| `RAILWAY_PREVIEW` | `true` (the image default) |
| `MONGO_URI` | Development Atlas SRV URI for `cluster0.bjvbg.mongodb.net`, with no database path or `/mentee` |
| `MONGO_DB` | `mentee` for development Atlas; `mentee_preview` only for a later private Railway database |
| `GOOGLE_CREDENTIALS_JSON` | Preview service-account JSON for the existing Firebase project `mentee-d0304` |
| `GCS_BUCKET` | Separate preview bucket, accessible only by preview credentials |
| `FLASK_SECRET_KEY` | A new secret used only by the preview |
| `CORS_ORIGINS` | The preview web origin |
| `ENVIRONMENT` | `production`, to enable secure cookies on the HTTPS preview |
| `REACT_APP_FIREBASE_CONFIG` | Existing Firebase web configuration JSON for `mentee-d0304`; required at build time and runtime, matching the service-account project |
| `REACT_APP_BASE_URL` | `auto` (default), to use the current browser origin |
| `REACT_APP_ENV` | `development` (default) |
| `EMAIL_DELIVERY_ENABLED` | Forced to `false` by the preview entrypoint |
| `SMS_DELIVERY_ENABLED` | Forced to `false` by the preview entrypoint |
| `IMGUR_KEY` | Dedicated preview Imgur client ID; required by the existing app initialization |

Add only the temporary preview domain to the existing Firebase project's
authorized domains when deploying; keep all existing domains.
Do not copy production SendGrid, Twilio, Imgur or AI keys for the first preview.
Populate any required credentials with dedicated preview credentials as each
integration is tested. Shared production integrations must be reviewed separately.

At startup, the preview entrypoint allows only the verified development Atlas
hostname with database `mentee`, or a private Railway hostname with database
`mentee_preview`. It rejects the production Atlas cluster
`cluster0.vr5uq.mongodb.net`, other hosts, mismatched database paths and legacy
connection fallback. Firebase authentication can use the existing project, but
the web configuration and service-account project must match. The production
file bucket is still rejected. It materializes Google credentials in a private
temporary file for Firebase and Google Cloud's default authentication. The image excludes local
environment files and service-account files from its build context.

The frontend uses the configured Firebase project and its current origin for
HTTP requests, links and Socket.IO. Heroku keeps its existing URL and Firebase
defaults when the new frontend variables are absent.

## Local verification

Run backend tests and the mandatory workspace formatting check:

```sh
cd backend
uv run pytest tests/test_railway_preview.py
cd ..
pnpm format:check
```

Build the preview image with the existing project's public Firebase configuration:

```sh
docker build -f Dockerfile.railway \
  --build-arg REACT_APP_FIREBASE_CONFIG="$PREVIEW_FIREBASE_CONFIG" \
  -t mentee-railway-preview .
```

Do not pass private Google service-account JSON as a build argument.

## Verification before production migration

1. Confirm `/health` reports database readiness on the temporary Railway domain.
2. Test preview authentication, profiles, chat and files with dedicated synthetic
   accounts in the shared Firebase project and files in the separate GCS bucket.
3. Verify that email and SMS attempts are blocked and that no weekly cron exists.
4. Measure response times, memory, CPU and cost under representative load.
5. Introduce the preview worker only after reviewing pending development jobs:
   it shares its queue with `mentee-dev`. Coordinate worker ownership for the
   test or use an independent Railway test database for worker rehearsals.
6. Rehearse MongoDB HA, backup restoration and the final write-freeze migration
   separately. This setup does not provision MongoDB HA or migrate production data.

Do not set `RAILWAY_PREVIEW=false` on this environment to bypass its checks. A
production rollout needs its own configuration, migration plan and cutover.
