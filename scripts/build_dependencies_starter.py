#!/usr/bin/env python3
"""
Build scripts/dependencies-starter.csv — a starter template with one row per WBS id,
plus helpful "prior task" hints in a comment column so the user can quickly fill in
Predecessor + RelType and bulk-paste into the Airtable Dependencies table.

CSV columns:
  Edge, WBS, PredecessorWBS, RelType, Note
  (only WBS is pre-filled — the rest are blank for the user to complete.)

We also append a companion "…-with-hints.csv" that includes the immediately-prior
WBS id and its task title for context.
"""
import csv, json, os, sys, re

ROOT   = os.path.dirname(os.path.abspath(__file__))
DATA   = os.path.join(ROOT, 'playbook_data.json')
OUT    = os.path.join(ROOT, 'dependencies-starter.csv')
HINTS  = os.path.join(ROOT, 'dependencies-starter-with-hints.csv')

with open(DATA, 'r', encoding='utf-8') as f:
    db = json.load(f)

tasks = db.get('tasks', [])
by_id = {t['wbs']: t for t in tasks}

# Natural predecessor guess: the previous WBS id in the same workstream, if any.
def prev_in_ws(t, i):
    ph, ws = t['phase'], t['ws']
    for j in range(i - 1, -1, -1):
        p = tasks[j]
        if p['phase'] == ph and p['ws'] == ws:
            return p
    return None

# Blank starter — one row per task, no predecessor filled in (user picks their own).
with open(OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['Edge', 'WBS', 'PredecessorWBS', 'RelType', 'Note'])
    for t in tasks:
        w.writerow(['', t['wbs'], '', '', ''])

# Hinted starter — same columns plus 3 helper columns AT THE END that Airtable will ignore
# on paste (or the user can delete before pasting). Helps you decide dependencies quickly.
with open(HINTS, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['Edge', 'WBS', 'PredecessorWBS', 'RelType', 'Note',
                '_TaskTitle', '_Window', '_LikelyPrior_WBS', '_LikelyPrior_Title'])
    for i, t in enumerate(tasks):
        prior = prev_in_ws(t, i)
        w.writerow([
            '',                    # Edge
            t['wbs'],              # WBS
            '',                    # PredecessorWBS
            '',                    # RelType
            '',                    # Note
            t.get('task', ''),
            t.get('window', ''),
            prior['wbs'] if prior else '',
            prior.get('task', '') if prior else '',
        ])

print(f'Wrote {OUT}  ({len(tasks)} rows)')
print(f'Wrote {HINTS} ({len(tasks)} rows, with prior-task hints for humans)')
