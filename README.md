<h1 align="center">
  <a href="https://www.menteeglobal.org/"><img src="https://i.imgur.com/DSHhzX9.png" alt="MENTEE Logo" width="150"></a>
  <br/>
  MENTEE
  </br>
</h1>

<p align="center">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
</p>

<h4 align="center">A mentorship platform connecting immigrant and refugee youth with a global network of mentors.</h4>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#common-commands">Commands</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#license">License</a>
</p>

> **Note:** Currently maintained by Juan Velasquez, Director of IT at MENTEE ([LinkedIn](https://www.linkedin.com/in/juanvelasquezacevedo/)).

## Overview

MENTEE is a web platform that connects immigrant and refugee youth with a global
network of volunteer mentors.

- Live app: https://app.menteeglobal.org/
- Official site: https://menteeglobal.org/

It supports the full mentorship lifecycle:

- **Profiles & discovery:** mentors, mentees, and partner organizations create
  profiles and find one another through the Explore directory.
- **Applications & onboarding:** guided, multi-step applications for mentors and
  mentees, with an admin review flow.
- **Messaging & video:** real-time chat and in-app video sessions.
- **Events:** mentors and partners can schedule and manage events.
- **Notifications:** transactional emails for key account and application events.
- **Admin dashboard:** account management, application review, and reporting.
- **Internationalization:** the interface is available in multiple languages.

## Tech Stack

| Layer    | Technologies                                                        |
| -------- | ------------------------------------------------------------------- |
| Frontend | React, Ant Design, Redux Toolkit, i18next, Socket.IO client         |
| Backend  | Flask, MongoEngine (MongoDB), Flask-SocketIO + eventlet, Firebase   |
| Tooling  | pnpm workspace (monorepo), uv (Python), Prettier, Black             |
| Hosting  | Heroku                                                              |

The repository is a **pnpm monorepo** containing the React `frontend` and the Flask
`backend`. The backend is managed as a [uv](https://docs.astral.sh/uv/) project, and
pnpm orchestrates both sides from the repository root.

## Getting Started

### Prerequisites

- [nvm](https://github.com/nvm-sh/nvm): Node version manager. The repo pins
  **Node 22.21.0** and **pnpm 11.3.0** (via `.nvmrc` and `package.json`).
- [pnpm](https://pnpm.io/) `11.3.0`
- [uv](https://docs.astral.sh/uv/): Python package and virtualenv manager. The backend
  targets **Python 3.10**.

### Environment configuration

The app integrates with external services (database, authentication, email, etc.) and
reads its configuration from local environment files that are **not** committed to the
repository. Before running, obtain the required values from the team and create:

- `backend/.env`
- `backend/firebase_service_key.json`
- `frontend/.env`

> Never commit `.env` files, service keys, or any credentials. Treat all secrets as sensitive.

### Install & run

```bash
nvm use      # switch to the pinned Node version
pnpm setup   # install frontend (pnpm) and backend (uv) dependencies
pnpm dev     # run the frontend and backend together
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

To run a single side, use `pnpm dev:frontend` or `pnpm dev:backend`.

## Common Commands

Run from the repository root:

| Command                     | Description                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `pnpm dev`                  | Run the frontend and backend in development mode                     |
| `pnpm build`                | Build the production frontend assets (served by Flask)               |
| `pnpm format`               | Format all code (Prettier for the frontend, Black for the backend)   |
| `pnpm format:check`         | Check formatting without writing (used by CI)                        |
| `pnpm export:requirements`  | Regenerate `requirements.txt` from `uv.lock` after backend dep changes |

## Project Structure

```
.
├── frontend/             # React app (pnpm workspace)
├── backend/              # Flask API (uv project)
├── package.json          # workspace root (orchestration scripts)
├── pnpm-workspace.yaml   # pnpm workspace definition
└── Procfile              # Heroku process definitions
```

## Deployment

The app is deployed on **Heroku** with two buildpacks, in order:

1. `heroku/nodejs`: installs pnpm, runs `heroku-postbuild`, and builds the frontend into `frontend/artifacts`.
2. `heroku/python`: installs the backend from the root `requirements.txt`; Flask then serves the built frontend.

The root `requirements.txt` is generated from `backend/uv.lock` via
`pnpm export:requirements`. Regenerate and commit it whenever backend dependencies
change so the deployed package set stays in sync.

## License

[MIT](https://github.com/mentee-global/mentee/blob/main/LICENSE) licensed. Copyright (c) 2021-2026 MENTEE.
