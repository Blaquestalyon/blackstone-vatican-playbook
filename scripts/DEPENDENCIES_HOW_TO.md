# Dependencies — how to fill in the starter CSV

The **Blackstone Vatican Playbook** app enforces task-transition rules using a
dependency graph you own. This is the file that defines that graph.

You have two starter files in this folder:

- `dependencies-starter.csv` — the clean template (167 rows, one per WBS id, empty
  predecessor columns). Paste this straight into the Airtable **Dependencies** table
  when you're ready.
- `dependencies-starter-with-hints.csv` — same 167 rows plus **three helper columns
  at the end** (`_TaskTitle`, `_Window`, `_LikelyPrior_WBS`, `_LikelyPrior_Title`).
  Use this file in a spreadsheet editor while you decide predecessors — the hints
  make it easy to see the previous task in the same workstream. Delete the `_`
  helper columns before pasting into Airtable.

---

## Columns

| Column           | What to put in it                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `Edge`           | (Optional) Human-readable label, e.g. `P1.A.1.2 <- P1.A.1.1 (FS)`. Leave blank if unsure. |
| `WBS`            | The task that has the dependency. **Do not change** — already filled in.                 |
| `PredecessorWBS` | The task that must reach a certain state first. E.g. `P1.A.1.1`.                         |
| `RelType`        | One of `FS`, `SS`, `FF`, `SF`. See below.                                                |
| `Note`           | (Optional) Free-text explanation of why this dependency exists.                          |

### RelType values

| Code | Meaning                                                                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FS` | **Finish → Start.** The predecessor must be `Done` before this task can be `In progress` or `Done`. This is the common case ("we can't start until X is finished"). |
| `SS` | **Start → Start.** The predecessor must be `In progress` (or `Done`) before this task can be `In progress` or `Done`. Two tasks that can proceed in parallel once the first opens.  |
| `FF` | **Finish → Finish.** The predecessor must be `Done` before this task can be `Done`. This task can be `In progress` before the predecessor is finished, but not marked done.        |
| `SF` | **Start → Finish.** (Rare.) The predecessor must be `In progress` before this task can be `Done`.                                                                                 |

---

## Multiple predecessors

A task can have as many predecessors as you like — just add **one row per edge**.
For example, if `P1.A.1.4` depends on both `P1.A.1.3` (FS) and `P1.A.2.1` (SS),
add two rows:

```
Edge,WBS,PredecessorWBS,RelType,Note
P1.A.1.4 <- P1.A.1.3 (FS),P1.A.1.4,P1.A.1.3,FS,Signature depends on final draft
P1.A.1.4 <- P1.A.2.1 (SS),P1.A.1.4,P1.A.2.1,SS,Cannot sign until custody kickoff has opened
```

Some rows in the starter CSV have no predecessor. That's fine — leave them blank
or delete them before pasting. Only rows with a `PredecessorWBS` are stored as edges.

---

## Default status behavior

The app computes each task's default status live from the graph:

- If the current date is **on or after** the task's `startDate`, default status is **`To do`**.
- If **all** `FS` and `SS` predecessors of the task are already satisfied (predecessor
  is Done for FS, or In progress/Done for SS), default status is also **`To do`**.
- Otherwise, the app shows the task as **`Blocked`** — a visibility-only grey
  placeholder. It cannot be marked `In progress` until the gating dependencies clear.

This default only applies when a task has **no explicit status yet** in the
`TaskState` table. Once anyone marks a task `To do`, `In progress`, or `Done`, that
manual choice takes precedence.

---

## Editing after go-live

The `Dependencies` table is editable in Airtable — your teammates can add, correct,
or remove rows without a redeploy. Changes appear in the app within about **20 seconds**
(next poll cycle).

If a wrong dependency is blocking someone, they can either:

1. Edit the row in Airtable to fix or delete it, **or**
2. Ask a teammate with access to update the predecessor's status.

---

## Bulk paste into Airtable

1. Open the base → **Dependencies** table in Grid view.
2. In your spreadsheet, delete the `_TaskTitle` / `_Window` / `_LikelyPrior_*`
   columns if you used the hinted file. Keep only `Edge, WBS, PredecessorWBS, RelType, Note`.
3. Select all rows (including headers) → Copy.
4. In Airtable, click into the top-left `Edge` cell of the first empty row → Paste.
   Airtable will match columns by header name.
5. Delete any rows with a blank `PredecessorWBS` — those aren't edges and would just
   be noise.
6. Confirm `RelType` shows the pill colors from the single-select options — if any
   row shows plain text, the value doesn't match one of `FS`/`SS`/`FF`/`SF`.

The app will pick up the new rows on its next poll.

---

## Regenerating the starter

If new WBS ids are ever added to `scripts/playbook_data.json`, rebuild the starter
files:

```bash
python3 scripts/build_dependencies_starter.py
```

This will overwrite `dependencies-starter.csv` and `dependencies-starter-with-hints.csv`.
Any edits you've already committed to Airtable are unaffected.
