# Railway environments for MENTEE

This setup prepares a Railway preview of MENTEE with an isolated copy of the
development database. It does not change Heroku, Atlas, or production DNS.
Keep SendGrid as the email provider throughout the infrastructure migration.

## Preview resources

The `MENTEE` project in the Mentee workspace has separate `development` and
`production` environments. `development` contains the web service, notification
worker, private MongoDB service, and `mentee-dev-files` storage bucket.
`production` has a separate MongoDB service, a rehearsal copy of the Atlas
production database, the `mentee-prod-files` bucket, and a deployed web service.
Heroku still serves the public domain and Atlas remains the live database.
On 2026-11-08, the `mentee` database
from the development Atlas M0 cluster was copied to `mentee_preview` in Railway.
The source and destination matched at 38 collections, 5,335 documents and 56
indexes. The Railway web service uses a database user limited to read and write
access on `mentee_preview`. Heroku development continues to use Atlas, so writes
made to either database after the copy are independent. The Atlas source has not
been changed or deleted. The production rehearsal copy is described below.

Railway project: https://railway.com/project/90a8e55e-1ff1-4d68-a8e6-7205dcaa6b90
Development URL: https://web-preview-0c1a.up.railway.app
The web and worker services follow `dev`, so merges to `dev` deploy automatically
to `development`. Configure the production service separately from
the production branch when that migration is ready; do not duplicate the
development environment's database or secrets into production.
The deployed `/health` endpoint and web root returned HTTP 200 after the copy.
The MongoDB volume has a daily backup schedule with six-day retention, and an
initial manual backup named `Post-Atlas development copy` was created. A restore
has not yet been tested.

Reuse the existing Firebase project `mentee-d0304` for authentication. Use
dedicated test accounts: Firebase identities are shared with production, so
deleting accounts, changing passwords or email addresses, and revoking sessions
also affects those accounts in production. Do not run these tests on real users,
even if their profiles appear in the development database.
The preview domain was added to that project's authorized domains without
removing the existing domains.

The preview uses the development Firebase service account. Google Cloud's billing
account is closed, so a separate GCS bucket could not be created. Profile photos
and bug report attachments instead use the private Railway bucket through the
web service. Existing GridFS files remain in the copied MongoDB database. The
`GCS_BUCKET` variable points to a nonexistent name as a fallback guard; preview
uploads must never write to the production GCS bucket. Railway bucket storage is
billed by usage, currently $0.015 per GB-month, with free S3 operations and bucket
egress. Web service egress still applies when serving files through the API.

Use the repository root as the build context and `Dockerfile.railway` as the
Dockerfile. The web service's Dockerfile path and `/health` check are set in
Railway service settings. Railway no longer accepts the repository's
`deploy/railway/web.json` as a Config as Code file.

The existing `backend/Dockerfile` and Heroku `Procfile` are not changed.

## Configuration

The following variables are required for the preview. Store secret values in
Railway variables, not in source files or build arguments.

| Variable | Preview value |
| --- | --- |
| `RAILWAY_PREVIEW` | `true` (the image default) |
| `MONGO_URI` | Private Railway MongoDB URI for the `mentee_preview` scoped user; stored only in Railway variables |
| `MONGO_DB` | `mentee_preview` |
| `GOOGLE_CREDENTIALS_JSON` | Existing development Firebase service-account JSON for `mentee-d0304` |
| `GCS_BUCKET` | Nonexistent preview bucket name, retained as a fallback guard |
| `AWS_S3_BUCKET_NAME`, `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION` | References to the `mentee-dev-files` Railway bucket |
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
`mentee_preview`. The deployed web service uses Railway. It rejects the production
Atlas cluster
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
2. Test preview authentication, profiles and chat with dedicated synthetic
   accounts in the shared Firebase project. Exercise image upload and retrieval
   through the Railway bucket without modifying copied user profiles.
3. Verify that email and SMS attempts are blocked and that no weekly cron exists.
4. Measure response times, memory, CPU and cost under representative load.
5. Confirm whether a separate worker is needed. The current `Procfile` invokes
   `python manage.py runworker`, but `manage.py` has no `runworker` command and
   the application defines no shared job queue. Socket.IO background tasks run
   in the web process. Do not run a Railway worker until it has a defined job.
6. Restore a Railway volume backup into an isolated test service, then rehearse
   the final write-freeze migration separately. This setup does not migrate
   production data.

Do not set `RAILWAY_PREVIEW=false` on this environment to bypass its checks. A
production rollout needs its own configuration, migration plan and cutover.

## Production preparation

The initial production database copy on 2026-11-08 contained 41 collections,
16,330 documents, and 127 indexes. It is a rehearsal snapshot: Heroku continues
to write to Atlas. Before changing DNS, repeat the copy during a write freeze
and verify the counts and application flows again. The Railway database uses a
separate `mentee_app` user with access to the `mentee` database.

The production bucket is empty while the Google Cloud billing account remains
closed. Google Cloud permits listing the 1,332 existing objects but returns 403
when their contents are downloaded. Keep existing image URLs intact until the
account is active, then copy and verify the objects before rewriting URLs.

The production web uses `RAILWAY_PREVIEW=false`, the private
`mongodb-prod.railway.internal` host, and the `mentee-prod-files` bucket.
At runtime Railway exposes that bucket as `mentee-prod-files-wciuvo4`; the
entrypoint checks the exact name and Firebase project `mentee-d0304`.
The `worker-prod` service is reserved but has no source or running deployment:
its inherited `runworker` command failed because that command no longer exists.
The Heroku worker is still running an older deployed slug; its purpose must be
verified before giving Railway a replacement process.
Email and SMS delivery stay disabled during rehearsal. The Heroku `clock`
process calls the public weekly email endpoint and must remain the only active
clock until cutover; enable its Railway replacement only after disabling it on
Heroku. No production domain or DNS change is part of this preparation.
