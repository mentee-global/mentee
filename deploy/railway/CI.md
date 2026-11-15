# Railway deployment flow

Railway deploys `mentee-global/mentee` directly from GitHub. The repository no
longer deploys applications to Heroku.

| Branch | Environment | Services | URL |
| --- | --- | --- | --- |
| `dev` | `development` | `web`, `worker` | https://dev.menteeglobal.org |
| `main` | `production` | `web-prod`, `worker-prod`, `clock-prod` | https://app.menteeglobal.org |

Both branches run Code Format Check and Railway Validation on pushes and pull
requests. Railway Validation builds `Dockerfile.railway` with synthetic Firebase
configuration and runs the deployment configuration and health-check tests.
The image built in GitHub is a validation artifact; Railway builds the deployed
image with the environment's real configuration.

Wait for CI is enabled on all five GitHub deployment triggers in Railway. After
a merge, Railway waits for the GitHub Actions workflows on that commit to finish
successfully before building and deploying. A failed workflow skips deployment;
the previous deployment remains active. MongoDB services use the official Docker
image and are not deployed by GitHub pushes.

The web, worker, clock, and MongoDB services in both environments run in US East
(Virginia), `us-east4-eqdc4a`. Keep each environment's database and application
services in the same region. Moving a MongoDB service also migrates its persistent
volume and causes a temporary database interruption. Create a volume backup
before moving it, and verify collection counts and database health afterward.
