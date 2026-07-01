# Blackstone Vatican Playbook

Global, team-synced execution tracker for the 167-task Vatican allocation WBS.
Every teammate sees the same status and notes in real time. All persistence is
in Airtable; the Node.js server proxies Airtable so no credentials leak to the browser.

## What's inside

```
public/
  login.html                 shared-passcode sign-in page
  playbook.html              the terminal-task playbook (search / filter / status / notes)
  gantt.html                 interactive Gantt with › links into each directive
server/
  index.js                   Express app: auth, Airtable proxy, static serving
  airtable.js                Airtable REST adapter (upsert TaskState, append AuditLog)
scripts/
  playbook_data.json         merged 167-task WBS + directives (source of truth for the UI)
  _wbs_tasks_raw.json        raw WBS metadata (input to build_playbook.py)
  build_playbook.py          rebuild playbook_data.json from raw + directives-src/
  build_linked_gantt.py      original linker (kept for regen; not part of the runtime)
directives-src/               human-editable per-phase directive text (.md)
docs/
  AIRTABLE_SCHEMA.md         Airtable AI prompts for the TaskState + AuditLog tables
  ORIGINAL_README.md         the README that shipped with the original build
```

## Live persistence model

- The 167-task WBS is embedded in `scripts/playbook_data.json` and served at `GET /api/playbook`.
- Every task's **current status + working notes** live in Airtable's `TaskState` table.
- Every change is also appended to Airtable's `AuditLog` table with who + when.
- The browser polls `GET /api/state` every 20 seconds so teammates see each other's changes without a hard refresh.

Because Airtable is the source of truth, **status is persistent across everyone who has access**, exactly as required.

## Setup

### 1. Airtable

Open `docs/AIRTABLE_SCHEMA.md` and paste each prompt into Airtable AI to create the `TaskState` and `AuditLog` tables. Then create a Personal Access Token (PAT) with `data.records:read` + `data.records:write` scoped to the base, and note the base id (`app...`).

### 2. Environment variables

Copy `.env.example` → `.env` (local dev) or set these in Railway's **Variables** tab:

| Variable                     | Purpose                                                       |
|------------------------------|---------------------------------------------------------------|
| `TEAM_PASSCODE`              | Shared passcode every team member types on the login page.    |
| `SESSION_SECRET`             | Long random string. Rotate to log everyone out.               |
| `AIRTABLE_TOKEN`             | Personal Access Token (`pat...`).                             |
| `AIRTABLE_BASE_ID`           | Airtable base id (`app...`).                                  |
| `AIRTABLE_TASK_STATE_TABLE`  | Defaults to `TaskState`.                                      |
| `AIRTABLE_AUDIT_LOG_TABLE`   | Defaults to `AuditLog`.                                       |
| `PORT`                       | Optional. Railway sets this automatically.                    |

Generate a strong random secret with, for example: `openssl rand -hex 32`.

### 3. Local dev

```bash
npm install
npm start
# visit http://localhost:3000
```

### 4. Deploy on Railway

1. Push this repo to GitHub (already done during initial setup).
2. In Railway → **New Project** → **Deploy from GitHub repo** → pick this repo.
3. Set the environment variables from the table above in **Variables**.
4. Railway auto-detects Node.js and runs `npm install && npm start`.
5. Once healthy, add a public domain in **Settings → Networking** (or use the default `*.up.railway.app`).

Health check: `GET /healthz` returns `{ ok: true, ts: … }`.

## Using the app

1. Go to the app URL → sign-in gate.
2. Enter **your name** (used for audit attribution) and the **shared team passcode**.
3. You land on the playbook. Search / filter / click any task.
4. Click **To do / In progress / Done** — the change is written to Airtable and every other teammate's browser picks it up within ~20 seconds.
5. Notes are debounced (~600 ms after you stop typing) and saved automatically. "last edit: <name>" appears under the notes.
6. The **Export** button downloads a JSON snapshot of all statuses + notes. **Import** pushes a snapshot back to Airtable (with a confirmation prompt, since it affects the whole team).
7. The **Gantt** view (`/gantt.html`) shows the interactive Gantt; the `›` icon on each row jumps into the corresponding directive.

## Regenerating playbook_data.json

If you edit any file in `directives-src/` and want to rebuild the merged data:

```bash
python3 scripts/build_playbook.py
```

This overwrites `scripts/playbook_data.json`. Restart the server (or just refresh — the browser will re-fetch on next load).

## Fidelity notes

- All directive text, WBS metadata, gate/dates/ownership, phase/workstream structure, filters, keyboard shortcuts, print behavior, and Gantt layout are **verbatim** from the original build.
- The only functional additions are: shared-passcode login, Airtable-backed persistence, live-refresh polling, audit-log write-through, and an updated "last edit by …" indicator.
- Visibility-only additions: a **TEAM SYNCED** pill on each task detail, a "signed in as / sign out" widget in the footer, a loading overlay on first paint, and a bottom-right toast for save failures. No functional behavior changed.
