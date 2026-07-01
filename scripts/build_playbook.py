#!/usr/bin/env python3
"""
Build the Vatican Terminal Playbook.

Merges:
  - _wbs_tasks_raw.json         (167 task metadata rows, extracted from the WBS xlsx)
  - directives-src/p*.md        (human-authored directive source, incremental / interruption-safe)
into:
  - playbook_data.json          (single merged data file, source of truth for the UI)
  - 2026-06-30-vatican-terminal-playbook.html  (self-contained, offline, deliverable)

Re-runnable at any time. If some directives are not yet written, the build still
succeeds and the UI shows a clear "directive pending" state for those tasks, so a
dropped connection never leaves a broken deliverable on disk.
"""
import json, re, os, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "_wbs_tasks_raw.json")
SRC_DIR = os.path.join(HERE, "directives-src")
TEMPLATE = os.path.join(HERE, "playbook_template.html")
OUT_HTML = os.path.join(HERE, "2026-06-30-vatican-terminal-playbook.html")
OUT_DATA = os.path.join(HERE, "playbook_data.json")

BLOCK_RE = re.compile(r'^###\s*WBS:\s*(\S+)\s*$', re.M)

def parse_directive_file(path):
    """Return dict wbs -> {summary, directive}."""
    text = open(path, encoding="utf-8").read()
    out = {}
    marks = list(BLOCK_RE.finditer(text))
    for i, m in enumerate(marks):
        wbs = m.group(1).strip()
        start = m.end()
        end = marks[i+1].start() if i+1 < len(marks) else len(text)
        body = text[start:end]
        summary, directive = "", ""
        # split on the :: SUMMARY / :: DIRECTIVE markers
        sm = re.search(r'^::\s*SUMMARY\s*$', body, re.M)
        dm = re.search(r'^::\s*DIRECTIVE\s*$', body, re.M)
        if sm and dm:
            summary = body[sm.end():dm.start()].strip()
            directive = body[dm.end():].strip()
        elif dm:
            directive = body[dm.end():].strip()
        else:
            directive = body.strip()
        out[wbs] = {"summary": summary, "directive": directive}
    return out

def load_directives():
    merged = {}
    if os.path.isdir(SRC_DIR):
        for fn in sorted(os.listdir(SRC_DIR)):
            if fn.endswith(".md"):
                merged.update(parse_directive_file(os.path.join(SRC_DIR, fn)))
    return merged

def main():
    tasks = json.load(open(RAW, encoding="utf-8"))
    directives = load_directives()

    written, pending = [], []
    for t in tasks:
        d = directives.get(t["wbs"])
        if d and (d["directive"] or d["summary"]):
            t["summary"] = d["summary"]
            t["directive"] = d["directive"]
            written.append(t["wbs"])
        else:
            t["summary"] = ""
            t["directive"] = ""
            pending.append(t["wbs"])

    meta = {
        "title": "Vatican Allocation Playbook",
        "subtitle": "Terminal-Task Execution Directives · Fund manager: Kate Lu · Master clock Jul 1 2026 → Sep 2028",
        "generated": datetime.date.today().isoformat(),
        "total": len(tasks),
        "written": len(written),
        "pending": len(pending),
    }
    payload = {"meta": meta, "tasks": tasks}

    json.dump(payload, open(OUT_DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    tpl = open(TEMPLATE, encoding="utf-8").read()
    data_js = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
    html = tpl.replace("__PLAYBOOK_DATA__", data_js)
    open(OUT_HTML, "w", encoding="utf-8").write(html)

    print(f"tasks: {len(tasks)}  directives written: {len(written)}  pending: {len(pending)}")
    if pending:
        print("PENDING (" + str(len(pending)) + "):", ", ".join(pending))
    print("wrote:", OUT_HTML)
    print("wrote:", OUT_DATA)

if __name__ == "__main__":
    main()
