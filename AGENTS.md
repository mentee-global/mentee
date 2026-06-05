# Mentee Project — Agent Guide

These are the working agreements for any coding agent (Claude Code, Codex, etc.) in this repository.

## App Overview

MENTEE is a mentorship web platform connecting immigrant and refugee youth with volunteer mentors (production: https://app.menteeglobal.org/). It is a **pnpm monorepo** with two workspaces:

- `frontend/`: React SPA (Create React App). Ant Design, Redux Toolkit, i18next (multi-language), socket.io-client. Source in `src/` (`app/`, `components/`, `features/`, `utils/`).
- `backend/`: Flask API managed as a **uv project** (Python 3.10). MongoDB via MongoEngine, Flask-SocketIO + eventlet for realtime chat, Firebase Admin for auth, OAuth, SendGrid for email, Twilio. App factory in `api/__init__.py` (`create_app`); HTTP endpoints in `api/views/`, data models in `api/models/`; CLI entry point `manage.py`. In production Flask also serves the built frontend from `frontend/artifacts`.

Core domains: mentors, mentees, and partner organizations with profiles and an Explore directory; multi-step applications with admin review; real-time messaging and video; events; an admin dashboard; and transactional email notifications.

## Running the App

Prerequisites: nvm (Node 22.21.0), pnpm 11.3.0, uv (Python 3.10). Running requires local env files that are **not** committed: `backend/.env`, `backend/firebase_service_key.json`, `frontend/.env`.

From the repo root:

- `pnpm setup`: install frontend (pnpm) and backend (`uv sync`) dependencies. Run once, or after dependency changes.
- `pnpm dev`: run both sides. Frontend at http://localhost:3000, backend at http://localhost:8000.
- `pnpm dev:frontend` / `pnpm dev:backend`: run a single side.
- `pnpm build`: build the production frontend assets (served by Flask).

The backend always runs through uv (`uv run python manage.py runserver`); do not invoke a global `python`/`pip` or create a separate venv. After changing backend dependencies, run `pnpm export:requirements` to regenerate `requirements.txt` (the Heroku Python buildpack input) from `uv.lock`.

## Format Check (Mandatory after any code change)

After completing ANY task that modifies backend or frontend code, ALWAYS run the format check before declaring the work done. This is the exact same command the GitHub Actions CI runs (the `format-check.yml` workflow runs `pnpm format:check`).

**Both sides** (run from repo root):
```bash
pnpm format:check
```
This fans out across the pnpm workspace: frontend `prettier --check` and backend `black --check` (via `uv run`). Requires `pnpm install` and the backend venv (`pnpm setup`) to have been run.

If the check fails, fix the formatting automatically before finishing:
```bash
pnpm format
```

Then re-run `pnpm format:check` to confirm it passes. Do not ask the user whether to fix; just fix and confirm.

## Code Style

Write **self-documenting code**: structure and naming should make intent clear on their own. Favor **readability and maintainability** (Clean Code). Good code explains itself.

Add comments only when the code cannot express something by itself, for example:
- The *why* behind a non-obvious decision, workaround, or trade-off.
- Context that isn't visible in the code (external constraints, gotchas, links to an issue).

Avoid comments that merely restate what the code already says.

### Avoid AI-generated slop

Match the conventions already present in the file you are editing. In particular, do not add:
- Extra comments a human wouldn't write, or that are inconsistent with the rest of the file.
- Extra defensive checks or `try`/`catch` blocks that are abnormal for that area of the codebase, especially on code paths already called by trusted or validated callers.
- Casts to `any` (or equivalent escape hatches) to work around type issues.
- Any other style that is inconsistent with the surrounding file.
