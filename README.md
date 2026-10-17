# CareerPilot AI — MERN hackathon project

CareerPilot AI compares **real job-posting requirements** with evidence found in a user's **real GitHub repositories**, then reassesses selected repositories when new commits are detected. The UI is based on the supplied AI Career Coach frontend ZIP, and the API follows the familiar client/server split of the supplied Voting System project.

## Features in this MVP
- React/Vite responsive dashboard with Jobs, Repositories, Skill Analysis, Skill Gaps, Change Timeline, Demo Center, and Settings.
- Express REST API, MongoDB Atlas persistence, GitHub OAuth, repository selection, real job URL ingestion, job skill extraction with supporting quotes, code evidence with file/line/commit citations, versioned assessments, before/after timeline, signed push webhooks, and a polling fallback.
- Email/password account signup and login backed by MongoDB, bcrypt password hashing, and MongoDB-backed server sessions.
- Heuristic skill detection for SQL, Python, JavaScript, TypeScript, React, Node.js, Express, MongoDB, Docker, and tests.
- Scope and uncertainty language: “Not demonstrated in scope” does not mean a person lacks a skill.

## Setup on Windows / PowerShell

Prerequisites: Node.js 20+, a MongoDB Atlas cluster, and a GitHub OAuth App.

1. Extract the ZIP to a folder such as `C:\Users\YOUR_USER\Downloads\CareerPilot_AI_MERN` and open that folder in VS Code.
2. In Atlas, create a database user and allow your current IP under Network Access. Copy the Drivers connection URI.
3. Create a GitHub OAuth App at GitHub Developer Settings. Homepage: `http://localhost:5173`; callback URL: `http://localhost:5000/api/auth/github/callback`.
4. In PowerShell:
   ```powershell
   Copy-Item server/.env.example server/.env
   notepad server/.env
   ```
   Set `MONGODB_URI`, `SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY` (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`, and `GITHUB_WEBHOOK_SECRET`. Do not paste secrets into chat or commit `server/.env`.
5. Install and run:
   ```powershell
   npm install
   npm install --prefix server
   npm run dev
   ```
6. Open `http://localhost:5173`. The API is `http://localhost:5000/api/health`.

If login or signup says the server is unavailable, run `npm run dev` from the project root (not only `npm run dev:web`) and check that `server/.env` has a real `MONGODB_URI`; the example URI is a placeholder and the API will not start until it is replaced.

If PowerShell blocks a script, run commands in the VS Code terminal or Command Prompt; do not change execution policy globally just for this app.

## GitHub webhook and automatic polling

- The polling worker checks selected repositories every `POLL_INTERVAL_MS` (minimum 30 seconds) while the API process is running. It compares latest commit SHA to the last analyzed SHA, fetches changed paths, and triggers a new assessment.
- For webhooks, configure the repository webhook URL as `https://YOUR_PUBLIC_TUNNEL/api/github/webhook`, content type `application/json`, secret equal to `GITHUB_WEBHOOK_SECRET`, and subscribe to **Pushes**. Localhost cannot receive GitHub webhooks without a secure tunnel.
- Webhook delivery IDs are unique to make duplicate delivery processing idempotent.

## Demo checklist
1. Connect GitHub and select a repository.
2. Add a real job posting URL that allows automated fetching. The app saves its source URL and retrieval timestamp and extracts skill mentions with nearby quotes.
3. Analyze selected repositories and open Skill Analysis to inspect clickable file/line/commit citations.
4. Show a gap such as SQL not demonstrated in scope. Add SQL code to a tracked repo and push a commit.
5. Wait for polling or send a real webhook; the timeline should show the new SHA and assessment. Inspect changed-file citations and status changes.

## Important limitations and responsible claims
- Skill detection is heuristic, not a validated ability score and not an LLM. A language can be mentioned in documentation or a dependency without proving proficiency.
- Job-page extraction is generic and may fail on JavaScript-rendered pages, bot-blocked pages, or sites that prohibit automated retrieval. It does not bypass access controls. Use permitted public postings or a supported official job API.
- The OAuth scope is `read:user repo` so users can select private repositories if they grant that scope. Review least-privilege scope before public deployment.
- The GitHub token is kept server-side, encrypted at rest with AES-256-GCM using `TOKEN_ENCRYPTION_KEY`, and excluded from JSON responses. Protect and back up that key separately from MongoDB. Before production, add token rotation/revocation, secure session settings, CSRF protections, audit logging, and privacy/retention controls.
- Polling is in-process and suitable for a demo/single API instance, not horizontally scaled production. Move it to a dedicated worker with a distributed lock for deployment.
- Private repository webhook events are processed only when the repository is selected by a connected user. GitHub API rate limits and permission failures are surfaced as errors.

## Folder structure
- `src/` — React frontend (adapted from the supplied Career Coach UI archive)
- `server/src/index.js` — Express API, MongoDB models, OAuth, job ingestion, scanning, webhook and polling logic
- `server/.env.example` — backend configuration template

## API routes
- `GET /api/health`
- `GET /api/auth/github`, `GET /api/auth/github/callback`
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/github/status`, `GET /api/github/repositories`, `POST /api/github/repositories/select`, `POST /api/github/disconnect`
- `GET /api/jobs`, `POST /api/jobs`, `POST /api/jobs/:id/analyze`
- `POST /api/analysis/run`, `GET /api/skills/evidence`, `GET /api/skills/gaps`
- `GET /api/changes`, `GET /api/summary`, `GET /api/demo`
- `POST /api/github/webhook`, `POST /api/github/poll`
"# AI-Career-Coach" 
