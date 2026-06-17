#!/usr/bin/env bash
# Supergoal Board (consumer) contract.
# Verifies the pure reader (tui/state.py) derives liveness/board correctly and the Textual app
# composes + refreshes headless against fixture heartbeats. The board is observability only -
# this is a producer/consumer parse check, NOT a delivery gate.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
ok()  { PASS=$((PASS + 1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$1"; [ -n "${2:-}" ] && printf '        %s\n' "$2"; }

echo "=================================================================="
echo " /supergoal BOARD (Textual reader) contract"
echo "=================================================================="

for f in tui/__init__.py tui/state.py tui/app.py tui/serve.py tui/launch.sh tui/app.tcss; do
  [ -f "$ROOT/$f" ] && ok "exists: $f" || bad "exists: $f"
done

# Wiring: launch enables emission (opt-in) and is idempotent; serve degrades without textual-serve.
grep -Fq '.enabled' "$ROOT/tui/launch.sh" && ok "launch.sh enables emission (.enabled)" || bad "launch.sh enables emission"
grep -Fq 'PIDFILE' "$ROOT/tui/launch.sh" && ok "launch.sh is pidfile-guarded (idempotent)" || bad "launch.sh pidfile guard"
grep -Fq 'textual-serve is not installed' "$ROOT/tui/serve.py" && ok "serve.py degrades gracefully without textual-serve" || bad "serve.py graceful degrade"
grep -Fq 'observes only' "$ROOT/SKILL.md" && ok "SKILL.md overlay line marks the board observe-only" || bad "SKILL.md overlay line"

# Behavioral check needs python3 + textual; skip cleanly otherwise.
if ! command -v python3 >/dev/null 2>&1 || ! python3 -c 'import textual' >/dev/null 2>&1; then
  printf '\n  SKIP  reader/app behavioral checks (python3 + textual not available)\n'
  printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
  [ "$FAIL" -eq 0 ]; exit $?
fi

if PYTHONPATH="$ROOT" python3 - "$ROOT" <<'PY'
import os, sys, json, tempfile, time, asyncio, shutil
from datetime import datetime, timezone
from tui import state
from tui.app import SupergoalBoard

run = tempfile.mkdtemp(prefix="sgtui."); ag = os.path.join(run, "agents"); os.makedirs(ag)
now = time.time(); host = state.this_host()
def iso(off): return datetime.fromtimestamp(now-off, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def hb(aid, repo, branch, mode, phase, age, tasks):
    return {"schemaVersion":1,"agent_id":aid,"repo_path":f"/w/{repo}","repo":repo,"branch":branch,
            "worktree":f"/w/{repo}","mode":mode,"phase":phase,
            "current_task":tasks[0]["title"] if tasks else None,
            "started_at":iso(age+60),"updated_at":iso(age),"pid":0,"host":host,"note":None,"tasks":tasks}
fx = [
  hb("acme-1","acme","feat/login","GREENFIELD","Critic",2,
     [{"id":"t0","title":"Login","status":"done"},{"id":"t1","title":"JWT","status":"review"},
      {"id":"t2","title":"Rotate","status":"backlog"},{"id":"t3","title":"CSRF","status":"blocked"}]),
  hb("acme-2","acme","feat/login","DEBUG","Build",60,[{"id":"t0","title":"Repro","status":"in-progress"}]),
  hb("web-3","web","main","LEGACY","Fixer",300,[{"id":"t0","title":"Port","status":"in-progress"}]),
  hb("api-4","api","wt-qa","QA-ONLY","Done",5,[{"id":"t0","title":"Smoke","status":"done"}]),
]
for v in fx: json.dump(v, open(os.path.join(ag, v["agent_id"]+".json"), "w"))
open(os.path.join(ag, "stray.json"), "w").write("{not json")   # must be skipped, not raise

a = state.read_agents(run, now_epoch=now)
liv = {x["agent_id"]: x["liveness"] for x in a}
assert liv == {"acme-1":"alive","acme-2":"stale","web-3":"dead","api-4":"done"}, liv
c = state.counts(a)
assert (c["agents"],c["alive"],c["stale"],c["dead"]) == (4,1,1,1), c
bc = state.board_columns(fx[0]["tasks"])
assert bc["done"]==["Login"] and bc["review"]==["JWT"] and bc["blocked"]==["CSRF"], bc

async def smoke():
    app = SupergoalBoard(run_dir=run, poll_secs=0.2)
    async with app.run_test(size=(120,40)) as pilot:
        await pilot.pause(0.5)
        assert app.query_one("#agents").row_count == 4
        assert app.selected is not None
        assert app.query_one("#board").row_count >= 1
        await pilot.pause(0.3)
asyncio.run(smoke())
shutil.rmtree(os.path.dirname(run), ignore_errors=True)
print("behavioral OK")
PY
then ok "reader liveness + board grouping + app Pilot render (headless)"; else bad "reader/app behavioral check"; fi

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
