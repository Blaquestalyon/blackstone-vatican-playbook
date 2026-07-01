# Airtable schema — Blackstone Vatican Playbook

The app uses **four Airtable tables** in a single base. Everything else (auth, the 167-task WBS, the directives) lives in the app itself and does not need Airtable.

Below are the exact prompts to paste into Airtable AI. Paste them **sequentially, one at a time**, verifying each table before moving on. After all four are built, generate a **Personal Access Token (PAT)** with `data.records:read` + `data.records:write` scopes on this base, and set these environment variables in Railway:

```
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TASK_STATE_TABLE=TaskState
AIRTABLE_AUDIT_LOG_TABLE=AuditLog
AIRTABLE_DEPENDENCIES_TABLE=Dependencies
AIRTABLE_TASK_ACTIONS_TABLE=TaskActions
AIRTABLE_TASK_ACTIONS_FORM_URL=https://airtable.com/appXXX/pagYYY/form   # paste the shareable form URL after you build the form
```

---

## Prompt 1 — `TaskState` table (paste into Airtable AI)

> Create a new table in this base named **TaskState**. This table stores the current global status and working notes for every WBS task in the Blackstone Vatican Playbook. There will be up to 167 rows, one per WBS id. The app upserts rows by the `WBS` field.
>
> Create the following fields, in this exact order, with these exact names, types, and options. Field names are case-sensitive.
>
> 1. **WBS** — Single line text. **This is the primary field.** Values look like `P1.A.1.1`, `P2.F.3.2`, etc. It must be unique per row.
> 2. **Status** — Single select. Options (exact spelling, lowercase): `todo`, `prog`, `done`. Colors: `todo` gray, `prog` amber/yellow, `done` green. Allow empty (no default).
> 3. **Notes** — Long text (rich text OFF). This is a plain-text field for team working notes; may contain line breaks; up to ~20,000 characters.
> 4. **UpdatedBy** — Single line text. Stores the display name of the last team member who changed this row.
> 5. **UpdatedAt** — Single line text. Stores an ISO-8601 UTC timestamp string (e.g. `2026-07-01T14:22:07.412Z`) written by the app. Do NOT use Airtable's built-in Last Modified Time — the app writes this value itself so it stays in sync with the audit log.
>
> Do not add any other fields, views, or automations. Do not add a `Created` or `Modified` field — those aren't needed. The primary field must be `WBS` (not "Name").
>
> When finished, confirm the table name is exactly `TaskState`, the primary field is `WBS`, and the four other fields are named `Status`, `Notes`, `UpdatedBy`, `UpdatedAt` with the types above.

**After Airtable AI builds it:** open the table settings and confirm the primary field is `WBS`. If Airtable put `WBS` as a secondary field and named the primary "Name", right-click the WBS column → "Set as primary field" and delete the empty "Name" column.

---

## Prompt 2 — `AuditLog` table (paste into Airtable AI)

> Create a second new table in this base named **AuditLog**. This is an append-only log of every status or notes change made on the Blackstone Vatican Playbook. The app POSTs a new row every time any team member changes anything. Rows are never updated or deleted by the app.
>
> Create the following fields, in this exact order, with these exact names, types, and options. Field names are case-sensitive.
>
> 1. **WBS** — Single line text. **This is the primary field.** The WBS id that was changed (e.g. `P1.A.1.1`).
> 2. **Field** — Single select. Options (exact spelling, lowercase): `status`, `notes`, `status+notes`. Represents which field(s) the change touched.
> 3. **NewStatus** — Single line text. When the change touched status, this holds the new status value (`todo`, `prog`, `done`, or `(cleared)` if the user un-set the status). Empty otherwise.
> 4. **NotesChanged** — Checkbox. Ticked when the change included a notes edit.
> 5. **ChangedBy** — Single line text. Display name of the team member who made the change.
> 6. **ChangedAt** — Single line text. ISO-8601 UTC timestamp string written by the app.
>
> Do not add any other fields, views, or automations. Do not add link fields to `TaskState`. Do not add a formula rollup.
>
> When finished, confirm the table name is exactly `AuditLog`, the primary field is `WBS`, and the other fields are named `Field`, `NewStatus`, `NotesChanged`, `ChangedBy`, `ChangedAt` with the types above.

---

## Prompt 3 — `Dependencies` table (paste into Airtable AI)

> Create a third new table in this base named **Dependencies**. This table stores the predecessor relationships between the 167 WBS tasks in the Blackstone Vatican Playbook. Each row is one directed edge: "task WBS cannot progress until task PredecessorWBS reaches the required state." The app reads this table on load to gate status transitions.
>
> Create the following fields, in this exact order, with these exact names, types, and options. Field names are case-sensitive.
>
> 1. **Edge** — Single line text. **This is the primary field.** Values look like `P1.A.1.2 <- P1.A.1.1 (FS)`. It's a human-readable label; not used programmatically by the app. Team members will read it in Airtable to understand the row at a glance.
> 2. **WBS** — Single line text. The task that has the predecessor. E.g. `P1.A.1.2`.
> 3. **PredecessorWBS** — Single line text. The task that must reach the required state first. E.g. `P1.A.1.1`.
> 4. **RelType** — Single select. Options (exact spelling, uppercase): `FS`, `SS`, `FF`, `SF`.
>    - `FS` = Finish-to-Start: predecessor must be Done before this task can be In progress or Done.
>    - `SS` = Start-to-Start: predecessor must be In progress or Done before this task can be In progress or Done.
>    - `FF` = Finish-to-Finish: predecessor must be Done before this task can be Done. (Task can still be In progress.)
>    - `SF` = Start-to-Finish (rare): predecessor must be In progress or Done before this task can be Done.
> 5. **Note** — Long text (rich text OFF). Optional; a free-text explanation of why this dependency exists. Not read by the app.
>
> Do not add any other fields, views, or automations. Do not add link fields to `TaskState`.
>
> When finished, confirm the table name is exactly `Dependencies`, the primary field is `Edge`, and the other fields are `WBS`, `PredecessorWBS`, `RelType`, `Note`.

**Seeding the table.** After Airtable AI builds it, don't fill in rows by hand. The app ships with a starter CSV at `scripts/dependencies-starter.csv` containing one row per WBS id. Open it, add predecessors as needed, then bulk-paste into the Airtable table (Airtable → paste into the grid). See `scripts/DEPENDENCIES_HOW_TO.md` in the repo for the format.

**How the app uses this table.**

- On every page load and every 20-second poll, the app fetches the current dependency graph.
- When a team member clicks a status button, the app checks whether every predecessor edge for that task is satisfied for the requested transition. If any edge is unmet, a modal appears listing the unmet prerequisites and the change is refused.
- The default status for any task with no manual override is `to do` if either (a) today is on or after the task's `startDate`, or (b) all `FS` and `SS` predecessors are already satisfied. Otherwise the task is shown as blocked (grey placeholder) and cannot be started yet.

Because the table is edited in Airtable, teammates with base access can add, correct, or remove edges without a redeploy. Changes appear in the app within ~20 seconds.

---

## Prompt 4 — `TaskActions` table + edit form (paste into Airtable AI)

> Create a fourth new table in this base named **TaskActions**. This table stores every edit anyone submits to the Actions section of a task in the Blackstone Vatican Playbook. It is **append-only** — every submission creates a new row, never updates one. The app treats the row with the newest `SubmittedAt` for a given `WBS` as the current version, and shows every prior submission (plus the original from the playbook) in a history drawer.
>
> Create the following fields, in this exact order, with these exact names, types, and options. Field names are case-sensitive.
>
> 1. **Edit ID** — Single line text. **This is the primary field.** Values look like `P1.A.1.2 · 2026-07-01T15:14:22.417Z`. The app writes this string on submit so each row has a unique, human-readable id. Not used programmatically for lookups.
> 2. **WBS** — Single line text. The WBS id whose Actions this row updates. E.g. `P1.A.1.2`. The app queries the table by this field.
> 3. **Actions** — Long text (rich text OFF). The new Actions content, in the same markdown format as the rest of the directive. May contain line breaks and lists. Up to ~20,000 characters.
> 4. **SubmittedBy** — Single line text. Display name of the team member who submitted the edit. Prefilled by the app from the shared-passcode session.
> 5. **SubmittedAt** — Single line text. ISO-8601 UTC timestamp string (e.g. `2026-07-01T15:14:22.417Z`) written by the app. Do NOT use Airtable's built-in Created Time — the app writes this value itself so it stays in sync with the audit log and the primary key.
> 6. **Reason** — Single line text. Optional short reason for the edit (e.g. `counsel updated timing`, `reverting to version 1`). May be blank.
>
> Do not add any other fields, link fields, formula fields, `Created` or `Modified` timestamp fields, or views. Do not add a separate "Name" primary field. Do not add automations — the app does the merge/newest-wins logic itself.
>
> **Then create an Airtable Form on this TaskActions table** with the following configuration:
>
> - Form title: `Update Actions for a task`
> - Form description: `The playbook app opens this form when a teammate clicks “Update actions” on a task. The WBS field is prefilled from the app — do not change it. Type the new Actions content in the Actions field. Optionally note why in Reason. Submit. The rest of the team will see your change within 20 seconds.`
> - Visible fields (in this order): `WBS`, `Actions`, `Reason`, `SubmittedBy`
> - Hidden fields: `Edit ID`, `SubmittedAt` (the app writes these via URL prefill parameters)
> - Mark `WBS`, `Actions`, and `SubmittedBy` as required. `Reason` optional.
> - After submit: show a confirmation page with the text `Thanks. Your update will appear in the playbook within 20 seconds. Close this tab to return.`
> - Allow multiple submissions from the same browser (do not enable "only allow one submission per person").
>
> **After you create the form, copy its shareable URL (the one that starts with `https://airtable.com/app.../pag.../form`) and give it to me** — I will paste it into the Railway env var `AIRTABLE_TASK_ACTIONS_FORM_URL`. Without that URL the “Update actions” button in the app can’t open the form.
>
> When finished, confirm the table name is exactly `TaskActions`, the primary field is `Edit ID`, the six fields are named exactly as above, and the form exists with the field order and required-field settings described.

**How the app uses this table.**

- On every page load and every 20-second poll, the app fetches all rows and groups them by `WBS`, sorted by `SubmittedAt` descending.
- For each task in the playbook, if there are any `TaskActions` rows, the newest one replaces the `**Actions**` subsection of the execution directive. The rest of the directive (Deliverable, Done when, etc.) is untouched.
- The original Actions text (from `scripts/playbook_data.json`) is always accessible via a history drawer that lists every version, including the original, with author, timestamp, and reason. Reverting an edit is done by submitting the older content as a **new** row — nothing is ever deleted, so the audit trail stays complete.
- If a task has zero rows in this table, the directive renders identically to today — no history UI appears.

---

## What NOT to add

The app deliberately does **not** need any of the following. If Airtable AI proposes them, decline:

- A separate `Users` table — auth is a shared team passcode enforced by the server; team members are not enrolled in Airtable.
- Link fields between `TaskState` and `AuditLog` — the join is by `WBS` string, kept simple on purpose.
- A `Tasks` table with the 167 rows of WBS metadata — that content lives in `scripts/playbook_data.json` in the app and is the source of truth for the WBS. Duplicating it in Airtable would create drift.
- Airtable automations, syncs, or views — nothing in the app depends on them.

---

## Permissions

Once the four tables exist, invite each team member to the **base** at whichever role you prefer (Editor is fine; the server is the only writer). No per-table permissioning is required — the app itself doesn't check Airtable roles. Access control on the app is the shared `TEAM_PASSCODE` env var.

If you want teammates to browse the audit log directly in Airtable, Read-only base access is sufficient.

---

## Getting the Base ID + PAT

1. Open the base in Airtable → the URL contains the base id (`app...`) as the first path segment after `airtable.com/`.
2. Airtable → your profile → **Developer hub** → **Personal access tokens** → **Create token**.
   - Scopes: `data.records:read`, `data.records:write`.
   - Access: this base only.
3. Copy the `pat...` token (Airtable shows it once). Paste it as `AIRTABLE_TOKEN` in Railway.
