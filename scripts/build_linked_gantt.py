#!/usr/bin/env python3
"""
Create an augmented, NON-DESTRUCTIVE copy of the uploaded Gantt that jump-links
each terminal task into the playbook at its WBS anchor.

  input : uploads/wbs_gantt_interactive.html   (never modified)
  output: outputs/2026-06-30-vatican-terminal-gantt-linked.html

The original Gantt renders rows from a top-level `const WBS = [...]` array and gives
each row a data-idx. We resolve each row's WBS id at runtime (WBS[idx].wbs, with a
task-name fallback map), add a per-row "directive" link, and add a toolbar button.
All task names are unique, so the fallback is exact.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = "/sessions/exciting-serene-tesla/mnt/uploads/wbs_gantt_interactive.html"
if not os.path.exists(SRC):
    SRC = os.path.join(HERE, "wbs_gantt_interactive.html")  # fallback if copied locally
OUT  = os.path.join(HERE, "2026-06-30-vatican-terminal-gantt-linked.html")
PLAYBOOK = "2026-06-30-vatican-terminal-playbook.html"

tasks = json.load(open(os.path.join(HERE, "_wbs_tasks_raw.json"), encoding="utf-8"))
by_task = {t["task"]: t["wbs"] for t in tasks}

html = open(SRC, encoding="utf-8").read()

inject_css = """
<style id="pb-linker-style">
  .pb-link{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;
    margin-left:6px;border-radius:4px;border:1px solid #cdd6dc;background:#fff;color:#2f6f8f;
    font-size:10px;line-height:1;text-decoration:none;flex:none;vertical-align:middle;cursor:pointer;
    transition:all .12s;}
  .pb-link:hover{background:#2f6f8f;color:#fff;border-color:#2f6f8f;}
  .prow .pb-link{width:16px;height:16px;}
  #pb-open{font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:8px;border:1px solid #2f6f8f;
    background:#2f6f8f;color:#fff;cursor:pointer;text-decoration:none;white-space:nowrap;}
  #pb-open:hover{background:#255a74;}
  #pb-note{font-size:11px;color:#6b6b6b;margin-left:8px;}
</style>
"""

inject_js = """
<script id="pb-linker">
(function(){
  var PLAYBOOK = %PLAYBOOK%;
  var BY_TASK  = %MAP%;
  function idFor(tr){
    var idx = tr.getAttribute('data-idx');
    try{ if(idx!=null && typeof WBS!=='undefined' && WBS[+idx] && WBS[+idx].wbs) return WBS[+idx].wbs; }catch(e){}
    var tt = tr.querySelector('.ttext');
    if(tt){ var k=(tt.getAttribute('title')||tt.textContent||'').replace(/&quot;/g,'"').trim(); if(BY_TASK[k]) return BY_TASK[k]; }
    return null;
  }
  function addLink(row){
    if(row.getAttribute('data-pb')) return;
    var id = idFor(row); if(!id) return;
    row.setAttribute('data-pb','1'); row.setAttribute('data-wbs', id);
    var lbl = row.querySelector('.tlabel') || row.querySelector('.plabel') || row;
    var a = document.createElement('a');
    a.className='pb-link'; a.href=PLAYBOOK+'#'+encodeURIComponent(id);
    a.target='_blank'; a.rel='noopener'; a.title='Open the execution directive for '+id;
    a.textContent='\\u203A';
    a.addEventListener('click', function(e){ e.stopPropagation(); });
    lbl.appendChild(a);
  }
  function enhance(){ document.querySelectorAll('.trow').forEach(addLink); }
  function toolbar(){
    if(document.getElementById('pb-open')) return;
    var tb = document.querySelector('.toolbar');
    var a = document.createElement('a');
    a.id='pb-open'; a.href=PLAYBOOK; a.target='_blank'; a.rel='noopener';
    a.textContent='Open Execution Playbook \\u2197';
    var note=document.createElement('span'); note.id='pb-note';
    note.textContent='\\u203A on any task opens its step-by-step directive';
    if(tb){ tb.insertBefore(a, tb.firstChild); tb.insertBefore(note, a.nextSibling); }
    else { a.style.position='fixed'; a.style.top='10px'; a.style.right='12px'; a.style.zIndex=9999; document.body.appendChild(a); }
  }
  function run(){ enhance(); toolbar(); }
  run();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run);
  var obs = new MutationObserver(function(){ enhance(); });
  try{ obs.observe(document.body, {childList:true, subtree:true}); }catch(e){}
})();
</script>
"""
inject_js = inject_js.replace("%PLAYBOOK%", json.dumps(PLAYBOOK)).replace("%MAP%", json.dumps(by_task, ensure_ascii=False))

payload = inject_css + inject_js + "\n</body>"
if "</body>" in html:
    html = html.replace("</body>", payload, 1)
else:
    html = html + payload

open(OUT, "w", encoding="utf-8").write(html)
print("wrote:", OUT)
print("linked task names in map:", len(by_task))
