# Vatican Terminal Playbook — Build Package

Everything needed to use, edit, and regenerate the execution playbook for the 167-task WBS.

## What to open

- **2026-06-30-vatican-terminal-playbook.html** — the playbook. Searchable/filterable task list plus full directive per task. Self-contained, works offline. Your status and notes save in the browser; use Export for a real backup file.
- **2026-06-30-vatican-terminal-gantt-linked.html** — your Gantt with a `>` link on each task that jumps to the matching directive.

Both are standalone. You do not need anything else to just use them.

## How it fits together

```
_wbs_tasks_raw.json        <- task metadata extracted from the WBS xlsx (167 rows)
directives-src/*.md        <- the directives, in plain editable text (source of truth for content)
build_playbook.py          <- merges the two above into playbook_data.json + the playbook HTML
build_linked_gantt.py      <- adds directive links to a copy of the Gantt (never touches your original)
playbook_data.json         <- the merged data the playbook embeds
```

## To edit a directive and rebuild

1. Open the relevant file in `directives-src/` (named by phase/work-stream, e.g. `p1c.md` = Phase 1, work-stream C).
2. Each entry looks like:

   ```
   ### WBS: P1.C.4.1
   :: SUMMARY
   one or two sentence summary
   :: DIRECTIVE
   freeform directive text. supports **bold**, lists (- or 1.),
   ## headings, and > callouts.
   ```

3. Edit the text. Save.
4. Regenerate:

   ```
   python3 build_playbook.py
   python3 build_linked_gantt.py
   ```

   The build reports how many directives were written and flags any WBS id still pending. Partial edits still produce a working file, so an interrupted session never breaks the deliverable.

## Notes

- The build script requires Python 3 only (standard library). No internet or extra packages.
- `build_linked_gantt.py` reads the original uploaded Gantt and writes a new linked copy. Your original is never modified.
- Bracketed placeholders like `[confirm jurisdiction]` and "confirm-before-use" notes mark every point where a specific depends on your situation (jurisdictions, vendors, named officeholders such as Boscia, Gasperini, Piccinotti, Zona, EdR contacts). Fill those in before executing.
