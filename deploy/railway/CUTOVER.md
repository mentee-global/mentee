# Production cutover: Heroku and Atlas to Railway

The public application is `app.menteeglobal.org`. Until this checklist is
completed, Heroku and Atlas remain the source of truth. The Railway production
database is a rehearsal copy and must not be treated as current user data.

## Before the maintenance window

- Merge PR #1394 into `main` after its checks and required review. Confirm that
  Railway `web-prod` and `worker-prod` deploy the merged commit.
- Restore Google Cloud billing. Read a sample object from
  `gs://app-mentee-global-images` and copy the 1,332 existing objects into
  `mentee-prod-files`. Compare object count, size and sample hashes. Keep
  existing image URLs until each stored reference is migrated and verified.
- Test Railway bucket uploads and downloads with a disposable file. Test login
  for Admin, Mentor and Mentee, direct messages, events and appointments.
- Restore a MongoDB volume backup into an isolated service, then verify a
  representative collection. Do not use the live Railway database for this
  restore test.
- Confirm Railway has a custom domain entry for `app.menteeglobal.org` on
  `web-prod`. Add its ownership-verification TXT record if Railway requests it;
  leave the traffic CNAME pointing to Heroku until the cutover.
- Set `WEEKLY_EMAILS_URL` for `clock-prod` to the Railway web URL, not the public
  domain. Prepare `clock-prod` using `deploy/railway/clock.json`, but keep it
  stopped. Set its `TZ` to match the current Heroku clock (`EST`). Keep
  `EMAIL_DELIVERY_ENABLED=false` and
  `SMS_DELIVERY_ENABLED=false` in Railway until the final checks.
- Keep OAuth disabled on Railway during rehearsal. Its issuer, key ID and
  signing key are prepared from Heroku, but production clients need a separate
  test before enabling `OAUTH_ENABLED=true` at cutover.
- Prepare the DNS change at the provider for `app.menteeglobal.org`: change the
  `app` CNAME from Heroku to the value returned by `railway domain status`.
  Do not apply it yet. Confirm access to the DNS account and a short TTL.

## Maintenance window

1. Announce a maintenance window and stop all application writes to Heroku.
   Keep the Heroku app available for a rollback, but do not allow users to
   continue writing to Atlas during the copy.
2. Record Atlas collection counts and the latest document timestamps. Take a
   final Atlas backup. Copy the full `mentee` database, including indexes, to
   the Railway production MongoDB. Replace the rehearsal data, including the
   two test messages, only after confirming the write freeze. Never run
   `mongorestore --drop` against Atlas.
3. Compare collection names, document counts and indexes between Atlas and
   Railway. Verify key Admin, Mentor and Mentee accounts and recent messages.
4. Confirm `web-prod`, `worker-prod` and MongoDB are healthy. Set `FRONTEND_URL`
   and `CORS_ORIGINS` to include `https://app.menteeglobal.org`. Rebuild the
   frontend if `REACT_APP_BASE_URL` changes; its value is baked into the build.
5. Enable email and SMS delivery on Railway and verify one controlled message
   of each type. Disable the Heroku `clock` dyno before starting `clock-prod`.
   Do not let both clocks run simultaneously.
6. Change the `app` CNAME to Railway's current target. Wait for Railway's
   certificate to become active, then test login, messages, uploads, events,
   appointments, OAuth clients, email links and the public `/health` route.
7. Monitor Railway errors, response times and MongoDB. Keep Heroku and Atlas
   intact through the observation period. Only then remove the Heroku domain
   and scale down its dynos; remove Atlas after a verified backup and a separate
   retention decision.

## Rollback

If validation fails, stop Railway writes and outbound delivery, stop its clock,
restore the CNAME to Heroku, then resume Heroku writes. Any user data written to
Railway after the DNS switch must be reconciled before Atlas becomes writable
again; DNS reversal alone does not copy those writes. Retain the final Atlas
backup and the Railway backup until reconciliation is complete.
