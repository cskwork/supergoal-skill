All APIs confirmed. Here is the design doc.

---

# Supergoal Board — Textual TUI Design Doc

In-browser, auto-opening observability dashboard for the multi-agent supergoal workflow. **It observes; it never gates delivery.** No mode blocks on it being up; if the TUI is down, every supergoal mode runs unchanged.

All Textual APIs below were verified against current docs (June 2026). Items Textual cannot do are called out in §6.

---

## 0. Grounding assumptions (from the sibling state-protocol design)

The board is a pure consumer. It assumes the protocol agent emits, per run vault, atomic per-agent files:

```
<target-repo>/.omx/state/agents/<agent-id>.json      # heartbeat snapshot, atomic write (tmp+rename)
<target-repo>/.omx/state/agents/<agent-id>.jsonl     # append-only event log
```

Consumed snapshot shape (the board reads these keys; tolerates extras/missing):

```jsonc
{
  "agent_id": "exec-3f2a",
  "repo": "/Users/danny/work/api",
  "branch": "feat/login",          // or worktree path; may be null
  "worktree": ".../wt-login",      // null if not a worktree
  "mode": "GREENFIELD",
  "stage": "Critic",               // Frame|Build|Critic|Fixer|Verify (or mode-specific)
  "pid": 48213,
  "updated_at": 1718600000.123,    // epoch seconds
  "tasks": [                       // Jira board rows
    {"id":"T1","title":"login route","col":"in-progress","note":"surfaced: rate-limit"}
  ],
  "counts": {"backlog":2,"in-progress":1,"review":0,"done":4}
}
```

The board derives **liveness itself** (`updated_at` age + `os.kill(pid,0)`), never trusting a `status:"alive"` field. This matches the MEMORY note *proxy-fabricates-tool-output*: corroborate, don't trust a self-reported flag.

---

## 1. App structure & layout

### Widget tree

```
SupergoalBoard(App)
└─ Screen
   ├─ Header(show_clock=True)                         # title; counts injected into header title
   ├─ Horizontal #body
   │  ├─ Vertical #left  (width: 32)                  # AGENT ROSTER
   │  │  └─ DataTable #agents                         # one row per agent; cursor_type="row"
   │  │       cols: ●  id  repo  branch/wt  mode
   │  └─ Vertical #center-right
   │     ├─ Horizontal #stage-strip (height: 3)       # WORKFLOW STAGE STRIP
   │     │  └─ Static #stages  (one styled Rich Text line: Frame ▸ Build ▸ Critic …)
   │     ├─ Horizontal #mid
   │     │  ├─ Vertical #board (width: 2fr)            # JIRA BOARD
   │     │  │  └─ DataTable #tasks                     # cols: Backlog | In-Progress | Review | Done
   │     │  └─ Vertical #events (width: 1fr)           # EVENT LOG
   │     │     └─ RichLog #log (highlight=True, markup=True, wrap=True)
   └─ Footer                                           # key bindings
```

Why these widgets (all real, verified):
- **Agent roster = `DataTable`**, not `Tree` — agents are flat and have uniform columns (id/repo/branch/mode); a table sorts and updates cells in place. `cursor_type="row"` (reactive) makes the whole row the selection unit. Row selection fires `DataTable.RowSelected` → drives center/right.
- **Stage strip = single `Static`** holding one `rich.text.Text` line. Rebuilding one short Text on stage change is cheaper and flicker-free vs. five separate `ProgressBar`/`Label` widgets. (A `ProgressBar` row was considered and rejected — stages are discrete, not fractional.)
- **Jira board = `DataTable`** with 4 fixed columns. Each cell is a `Text` renderable (verified: cells accept Rich renderables); we pack the per-column task list into the cell and recolor by state. Live moves use `update_cell` (verified signature).
- **Event log = `RichLog`** — append-only, `.write()` accepts Rich markup/ANSI. Natural fit for the `.jsonl` tail.
- **Counts in Header**: Textual's `Header` shows the `App.title`/`sub_title`; we set `self.sub_title = "agents:5 live:4 stale:1 | done:12/19"`. (Header has no free-form right slot — see §6.)

### ASCII mockup

```
┌─ Supergoal Board ─────────────────────  agents:3 live:2 stale:1 · done:9/14 ──── 14:22 ┐
│ ● id       repo        br/wt     mode  │  Frame ─ Build ─▸[ CRITIC ]◂─ Fixer ─ Verify  │
│ ● exec-3f  api         feat/log  GREEN │ ───────────────────────────────────────────── │
│ ● rev-91   api         feat/log  GREEN │  Backlog    In-Progress   Review     Done      │
│ ◦ qa-7c    web-admin   wt-qa     QA    │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ │
│   (grey = stale/dead pid)              │  │T5 csrf │ │T1 login ⚙│ │T3 rate │ │T0 init✓│ │
│                                        │  │T6 logout│ │          │ │  -limit│ │T2 db  ✓│ │
│                                        │  └────────┘ └──────────┘ └────────┘ │T4 ui  ✓│ │
│                                        │                                     └────────┘ │
│                                        │ ┌─ events (exec-3f) ───────────────────────┐  │
│                                        │ │14:22:01 ▸ Critic: failing test login_429 │  │
│                                        │ │14:22:03 ⚙ Fixer: editing routes/login.ts │  │
│                                        │ │14:22:09 ✓ Verify: 14/14 real tests pass  │  │
│                                        │ └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ↑↓ select agent   f follow-latest   p pause-refresh   o open-vault   q quit              │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

Selected agent row is reverse-highlighted; stale agents render in `dim` grey with a `◦` glyph instead of `●`.

---

## 2. Real-time refresh strategy

**Decision: file-watch worker (preferred) with a `set_interval` fallback.** Rationale: the protocol writes atomic snapshots sporadically; a thread worker blocking on `watchdog`/`inotify`/`kqueue` is event-driven (low latency, no idle CPU), while a bare `set_interval` poll wastes cycles and adds up to one interval of lag. We keep a **slow `set_interval(1.0)` liveness tick** regardless, because liveness is time-derived (an agent going stale produces *no* file event — only the clock advancing reveals it).

### Mechanism (all verified APIs)

```python
from textual.worker import get_current_worker
from textual.message import Message

class Snapshot(Message):                       # custom message, thread-safe to post
    def __init__(self, agent_id, data): ...
class LogLine(Message):
    def __init__(self, agent_id, line): ...
class AgentGone(Message):
    def __init__(self, agent_id): ...

class SupergoalBoard(App):
    agents: reactive[dict] = reactive(dict)    # agent_id -> snapshot dict
    selected: reactive[str | None] = reactive(None)

    def on_mount(self):
        self.watch_files()                     # thread worker
        self.set_interval(1.0, self._liveness_tick)

    @work(thread=True, exclusive=True)
    def watch_files(self):
        worker = get_current_worker()
        for change in watch(self.state_dir):   # watchdog/inotify; blocking, off UI loop
            if worker.is_cancelled:
                return
            for path in change.changed:
                if path.suffix == ".json":
                    data = read_atomic_json(path)
                    self.post_message(Snapshot(path.stem, data))   # thread-safe
                elif path.suffix == ".jsonl":
                    for line in tail_new(path):
                        self.post_message(LogLine(agent_of(path), line))
```

Thread-safety, verified verbatim from the Workers guide: *"Most Textual functions are not thread-safe … use `call_from_thread` to run them from a thread worker. The exception … is `post_message`."* So the worker **only** `post_message`s; it never touches a widget or a reactive directly.

### Handlers mutate reactive state → watchers repaint only changed rows

```python
def on_snapshot(self, m: Snapshot):
    self.agents = {**self.agents, m.agent_id: m.data}   # new dict → triggers watch_agents

def watch_agents(self, old, new):
    self._sync_roster(old, new)        # diff: add_row / update_cell only changed cells; never clear()

def on_log_line(self, m: LogLine):
    if m.agent_id == self.selected:
        self.query_one("#log", RichLog).write(self._fmt(m.line))
```

**No-flicker rule:** never `DataTable.clear()` on refresh. Diff old vs new:
- new agent → `add_row(..., key=agent_id)`
- changed field → `update_cell(agent_id, col_key, new_value)` (verified signature `update_cell(row_key, column_key, value, update_width=False)`)
- stage change → rebuild only the `#stages` `Static` for the selected agent
- task move → `update_cell` on the affected board columns only

Reactives repaint lazily and Textual diffs the compositor output, so untouched cells don't repaint.

### Appearing / disappearing / stale agents

```python
def _liveness_tick(self):
    now = time.time()
    for aid, snap in self.agents.items():
        age = now - snap.get("updated_at", 0)
        dead = not pid_alive(snap.get("pid"))      # os.kill(pid, 0)
        stale = age > STALE_SECS or dead           # STALE_SECS ~ 10
        self._set_row_style(aid, "dim" if stale else "")
        self._set_glyph(aid, "◦" if stale else "●")
```

- **Appear**: first snapshot → `add_row`. **Disappear** (file removed → `AgentGone`, or pid dead + age > GONE_SECS ~60): keep the row but greyed, or `remove_row(key)` if the protocol deletes the file. Default = grey-and-keep, so a crashed agent stays visible for inspection (matches the "preserve evidence" debug ethos).
- **Stale ≠ gone**: greyed but selectable; its last board/log state is frozen and still inspectable.
- **No branch-exclusivity assumption**: `exec-3f` and `rev-91` above share `api` + `feat/log` and coexist as distinct rows keyed by `agent_id`.

---

## 3. Multi-agent distinctness

- Row identity = `agent_id` (the DataTable row key), never repo/branch. Two agents in the same repo+branch (e.g. Executor + Critic in the role-loop) are two rows.
- Columns surface `repo` (basename, full path on hover via tooltip — see §6 caveat), `branch/worktree` (shows worktree leaf dir if `worktree` set, else `branch`), `mode`.
- `DataTable.RowSelected` → set `self.selected = row_key` → `watch_selected` re-renders stage strip, board, and switches the RichLog to that agent's buffered log (we keep a bounded `deque(maxlen=500)` per agent so switching shows recent history, not a blank log).
- `f` (follow-latest) binding: auto-select whichever agent posted the most recent event — useful when watching many agents.

---

## 4. In-browser auto-open

### Serve command (verified `textual-serve` `Server` API)

The board ships its own launcher rather than the bare `textual serve` CLI, so it can do the idempotent pidfile/port check and the browser open in one place.

`tui/serve.py`:
```python
from textual_serve.server import Server
# Server(command, host="localhost", port=8000, title=None, public_url=None)
server = Server(
    "python -m tui.app",                 # launches SupergoalBoard; subprocess per browser tab
    host="127.0.0.1",
    port=PORT,                           # default 8000; overridable via $SUPERGOAL_TUI_PORT
    title="Supergoal Board",
)
server.serve()                           # blocking; spawns app subprocess per visit over websocket
```

Mechanism (verified): on each browser visit `textual-serve` *"launches an instance of your app in a subprocess and communicates with it via a websocket."* Users are confined to the app UI (not a shell). Multiple tabs = multiple subprocesses, all reading the same `.omx/state` files — so several humans can watch the same run.

### Idempotent background launch (`tui/launch.sh`)

Called once when an agent starts using the supergoal skill. Safe to call repeatedly.

```bash
#!/usr/bin/env bash
set -euo pipefail
PORT="${SUPERGOAL_TUI_PORT:-8000}"
URL="http://127.0.0.1:${PORT}"
PIDFILE="${TMPDIR:-/tmp}/supergoal-board.${PORT}.pid"

# 1. Already up? (pidfile alive OR port bound) -> just open browser, don't spawn a 2nd server.
if { [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; } \
   || lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  open_browser=1
else
  # 2. Spawn detached; survives the agent turn. Logs to vault for debugging.
  LOG="${TMPDIR:-/tmp}/supergoal-board.${PORT}.log"
  nohup python -m tui.serve >"$LOG" 2>&1 &
  echo $! > "$PIDFILE"
  open_browser=1
  # wait until the port is actually listening (bounded), so the browser doesn't hit a dead URL
  for _ in $(seq 1 30); do
    lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 && break
    sleep 0.2
  done
fi

# 3. Open the user's browser (macOS/darwin first, then linux/wsl fallbacks).
if [ "${open_browser:-0}" = 1 ] && [ "${SUPERGOAL_TUI_NO_OPEN:-0}" != 1 ]; then
  if command -v open >/dev/null;       then open "$URL"            # macOS
  elif command -v xdg-open >/dev/null; then xdg-open "$URL"        # linux
  elif command -v wslview >/dev/null;  then wslview "$URL"; fi      # wsl
fi
echo "$URL"
```

**Idempotency**: two guards — a TMPDIR pidfile *and* a live `lsof` port check — so even across separate shells or a stale pidfile we never start a second server on the same port. The browser-open step always runs (cheap; the OS focuses the existing tab rather than duplicating on most setups).

**macOS/darwin specifics**: `open` is the right opener (not `xdg-open`); `lsof -nP -iTCP -sTCP:LISTEN` is the portable port check on darwin (no `/proc`, so a `/proc/net/tcp` parse would fail). `kill -0` works for the pid liveness check on darwin.

**Auto-open caveat (verified)**: `textual-serve` itself does **not** pop a browser — it prints the URL. We open it ourselves via `open`/`xdg-open`. Do **not** rely on `App.suspend()` / Ctrl-Z in the served app — suspension is ignored under `textual-serve` (documented limitation).

### Shutdown

Left running by default (it's an overlay; outliving one turn is the point). Explicit stop:
```bash
tui/launch.sh stop   # kill "$(cat $PIDFILE)" && rm -f "$PIDFILE"
```
A `Stop` (session-end) hook may call this, or it can idle until the box reboots. The server is read-only and cheap, so leaving it up is safe.

---

## 5. File / module layout & supergoal integration

```
supergoal-skill/
└─ tui/
   ├─ app.py        # SupergoalBoard(App): compose(), reactives, message handlers, watchers
   ├─ state.py      # reader: read_atomic_json, tail_new, pid_alive, derive liveness; NO Textual imports
   ├─ widgets.py    # stage-strip render (Text builder), roster/board cell formatting
   ├─ serve.py      # textual_serve.Server wrapper (the -m entrypoint for the subprocess)
   ├─ launch.sh     # idempotent background launch + browser open (above)
   └─ app.tcss      # layout: #left width 32; #board 2fr / #events 1fr; .stale { color: $text-disabled }
```

`state.py` is **pure** (parses files, returns dicts, no UI) so it's unit-testable headless and reusable by a future CLI/`--json` dump. `app.py` imports it. This keeps the producer/consumer split clean: agents write files, `state.py` reads them, `app.py` renders.

### Plugging into supergoal — overlay, not a mode

It is **not** a new mode and **not** a gate. Two integration points, both non-blocking:

1. **Skill-start overlay (recommended)**: `SKILL.md` adds one advisory line — *"On skill start, fire-and-forget `bash tui/tui/launch.sh &` if `$SUPERGOAL_TUI=1`; never block on it; ignore failure."* Off by default; opt-in via env var. Because it's fire-and-forget and failure-swallowing, a missing `python`, missing `textual-serve`, or a busy port can never stall or fail a supergoal run.

2. **No gate, no contract test that blocks delivery.** The board has no entry in any `*-gate.sh`. The only test added is `tests/tui-state-reader.test.sh` asserting `state.py` parses the protocol's sample fixtures — a producer/consumer contract check, not a delivery gate. This honors *supergoal-baseline-first* in MEMORY: the harness must never add ceremony that beats a clean baseline. The board observes; it cannot reject a verification or block a commit.

The board reads the **same** `.omx/state` surface the host harness already writes (the inventory confirms `.omx/state/*` is harness telemetry), plus the new per-agent protocol files. It introduces no new obligation on any mode — modes that emit nothing simply show a sparse row.

---

## 6. What Textual cannot currently do that the request implies

1. **Auto-open a browser** — `textual-serve` only prints the URL; it never launches a browser. We supply the `open`/`xdg-open` step ourselves (§4). Not a Textual feature.
2. **Header free-form / right-aligned counts** — `Header` exposes only `title`/`sub_title` (+ optional clock). There's no right-hand custom slot. Counts go in `sub_title`; for a richer header we'd replace `Header` with a custom `Static` bar. As-requested ("Header shows counts") is met via `sub_title`, with this limitation noted.
3. **Native hover tooltips for truncated cells** — `DataTable` cells don't expose per-cell hover tooltips; full repo path can't pop on hover inside a cell. Workarounds: show the path in a status line on `CellHighlighted`, or widen the column. (Widget-level `tooltip` exists, but not per-DataTable-cell.)
4. **True per-cell background fills in `DataTable`** — cell content is a Rich renderable (foreground styling, `Text` with styles is fine, verified), but you cannot paint an arbitrary full-cell background independent of the row/cursor styling. The Jira "card" look is approximated with glyphs + foreground color, not filled color blocks.
5. **App suspension under serve** — `App.suspend()`/`suspend_process` is ignored when served (documented). Any external-editor/Ctrl-Z affordance must be dropped in the browser path.
6. **`textual-web` is unsuitable as the always-on host** — its sessions are not persistent (tab close kills the app) and it's beta. Use `textual-serve` for the overlay; reserve `textual-web --signup` only if an internet-reachable URL is explicitly needed, accepting beta + non-persistence.
7. **File watching is not built into Textual** — `@work(thread=True)` runs the loop, but the actual watch needs an external lib (`watchdog`, or stdlib polling). Textual provides the safe thread→UI bridge (`post_message`), not the watcher. If adding `watchdog` is undesirable, fall back to the `set_interval(0.5)` poll of mtimes — slightly higher latency/CPU, zero new deps.

---

### Relevant absolute paths

- New implementation dir: `/Users/danny/Documents/PARA/Resource/supergoal-skill/tui/`
- Spine to add the opt-in overlay line: `/Users/danny/Documents/PARA/Resource/supergoal-skill/SKILL.md`
- State surface consumed (target repo): `<target-repo>/.omx/state/agents/<agent-id>.{json,jsonl}`
- Reader contract test to add: `/Users/danny/Documents/PARA/Resource/supergoal-skill/tests/tui-state-reader.test.sh`

**Load-bearing constraints to preserve**: the worker posts only via `post_message` (never touches widgets from the thread); refresh diffs rows (never `clear()`); liveness is board-derived from `pid` + `updated_at` age (never a trusted self-reported flag); launch is idempotent (pidfile + `lsof` port check) and failure-swallowing so it can never gate or stall a supergoal run.