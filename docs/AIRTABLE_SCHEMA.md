# Airtable schema — Blackstone Vatican Playbook

The app uses **two Airtable tables** in a single base. Everything else (auth, the 167-task WBS, the directives) lives in the app itself and does not need Airtable.

Below are the exact prompts to paste into Airtable AI. It will generate the tables to spec. After it builds them, generate a **Personal Access Token (PAT)** with `data.records:read` + `data.records:write` scopes on this base, and set these environment variables in Railway:

```
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TASK_STATE_TABLE=TaskState
AIRTABLE_AUDIT_LOG_TABLE=AuditLog
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

## What NOT to add

The app deliberately does **not** need any of the following. If Airtable AI proposes them, decline:

- A separate `Users` table — auth is a shared team passcode enforced by the server; team members are not enrolled in Airtable.
- Link fields between `TaskState` and `AuditLog` — the join is by `WBS` string, kept simple on purpose.
- A `Tasks` table with the 167 rows of WBS metadata — that content lives in `scripts/playbook_data.json` in the app and is the source of truth for the WBS. Duplicating it in Airtable would create drift.
- Airtable automations, syncs, or views — nothing in the app depends on them.

---

## Permissions

Once the two tables exist, invite each team member to the **base** at whichever role you prefer (Editor is fine; the server is the only writer). No per-table permissioning is required — the app itself doesn't check Airtable roles. Access control on the app is the shared `TEAM_PASSCODE` env var.

If you want teammates to browse the audit log directly in Airtable, Read-only base access is sufficient.

---

## Getting the Base ID + PAT

1. Open the base in Airtable → the URL contains the base id (`app...`) as the first path segment after `airtable.com/`.
2. Airtable → your profile → **Developer hub** → **Personal access tokens** → **Create token**.
   - Scopes: `data.records:read`, `data.records:write`.
   - Access: this base only.
3. Copy the `pat...` token (Airtable shows it once). Paste it as `AIRTABLE_TOKEN` in Railway.
