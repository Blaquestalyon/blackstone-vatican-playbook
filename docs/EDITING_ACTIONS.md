# Editing Actions from the front-end

The **Actions** section of each task is the only part of the playbook that can be
edited without touching code or the shipped `playbook_data.json` file. Every edit
is saved as a new version in Airtable — nothing is destructive, and you can
always revert to a prior version (including the shipped original).

## What is editable

- **Actions only.** Not the task title, gate, deliverable, done-when, summary, or
  any other section of the directive.
- Everything else in the directive — the intro paragraph, `**Deliverable:**`,
  `**Done when:**`, escalation notes, etc. — comes from the shipped
  `playbook_data.json` and never changes from the front-end.

## How the UI works

Open any task in the playbook. Below the **Execution directive** heading you
will now see:

1. A small **ACTIONS** header row with an **✎ Update actions** button on the
   right. The header appears whenever the task has an Actions section (whether
   or not it has been edited).
2. The directive text — with the latest Actions version already spliced in.
3. If at least one edit has ever been submitted for this task, a small footer
   strip below the directive shows: `Actions updated by <name> · <date> · N
   versions · Show history · Toggle original`.
4. A collapsed **View original Actions (shipped with playbook)** disclosure
   below the footer — click to see the shipped baseline without leaving the
   task view.

Tasks that have never been edited look exactly the same as they did before this
feature shipped — the shipped Actions are still live, no footer, no history UI.

## Submitting an edit

1. Click **✎ Update actions**. An Airtable form opens in a new browser tab with
   the WBS id, your name (from your sign-in), and the timestamp pre-filled.
2. Type the new Actions content into the **Actions** field. Formatting is plain
   text plus Markdown (numbered lists, `**bold**`, links) — same conventions
   as the shipped directives.
3. Optionally fill in **Reason for change** so future readers understand the
   edit context (e.g. "Tightened after Kate's July 1 feedback").
4. Hit **Submit**. Within ~20 seconds every teammate looking at that task will
   see the new version live, along with the footer strip crediting you.

Nothing is ever overwritten — each submission appends a new row in the
TaskActions table.

## Viewing history

Click **Show history** in the footer strip (or the ✎ button if no history
exists yet) to open the **Actions history** drawer on the right side of the
screen. Each version shows:

- Version number (**v1**, **v2**, … newest first) and current-version badge.
- Who submitted it and when.
- The reason they gave, if any.
- A preview of the Actions content, with a **Show full** toggle for long edits.
- A **Revert to this version** button (on every version except the current
  one).

The last entry in the drawer is always **Original · shipped** — the baseline
Actions that shipped with the playbook. You can always revert to that state.

## Reverting to a prior version

1. Open the history drawer (**Show history** link in the footer).
2. Find the version you want to restore.
3. Click **Revert to this version** (or **Revert to original** on the shipped
   baseline).
4. Confirm the prompt. Airtable will open in a new tab with the Actions field
   pre-filled with that version's content and a reason starter like
   "Reverting to earlier version by Sarah Chen (Jun 28, 2026 10:00 AM)."
5. Adjust the reason if you like, then submit.

The revert is saved as a **new version on top of history** — the version you
reverted from is preserved. This means every state of every task's Actions is
recoverable, forever.

## What administrators need to set up (one-time)

Before the ✎ Update actions button will work, an administrator needs to do two
things in Airtable:

1. **Create the TaskActions table** by pasting Prompt 4 from
   `docs/AIRTABLE_SCHEMA.md` into Airtable AI. This creates the fields
   (`Edit ID`, `WBS`, `Actions`, `SubmittedBy`, `SubmittedAt`, `Reason`) with
   the correct types.
2. **Build an Airtable Form on the TaskActions table**, with:
   - Visible fields: `WBS`, `Actions`, `Reason`, `SubmittedBy`
   - Hidden fields (still submitted via URL prefill): `Edit ID`, `SubmittedAt`
   - Optional post-submit redirect back to the playbook
3. Copy the form share URL and set it as the Railway environment variable
   `AIRTABLE_TASK_ACTIONS_FORM_URL`. Redeploy — the ✎ Update actions button
   is now live.

Until step 3 is done, the ✎ Update actions button will show a friendly
"Editing is not configured yet" alert instead of opening the form. The rest of
the playbook (state, notes, dependencies) keeps working normally.

## Troubleshooting

- **"Editing is not configured yet" alert.** Set
  `AIRTABLE_TASK_ACTIONS_FORM_URL` and redeploy — see step 3 above.
- **Form opens but the WBS field is empty.** The form URL is likely correct but
  the WBS field's Airtable field name does not exactly match `WBS`. Rename in
  Airtable and try again.
- **My edit shows up in Airtable but not in the playbook.** Wait 20 seconds
  (the polling interval), then refresh. If it still does not appear, check the
  Airtable row: `WBS` must exactly match the task's WBS id, and `Actions` must
  not be empty.
- **The old version keeps coming back.** Your submission likely had an older
  `SubmittedAt` string than an existing row. `SubmittedAt` sorts as text; use
  ISO-8601 UTC (e.g. `2026-07-01T15:30:00.000Z`). The Update-actions button
  pre-fills this correctly — only worry about it if you were editing rows
  directly in Airtable.
