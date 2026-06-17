# Supergoal: workflow improvements + live multi-agent board (research + reconciled design)

2026-06-17. Source: 8-agent workflow `wf_d7fa2137-b0f` mining `addyosmani/agent-skills` (62k*)
and `mattpocock/skills` (132k*), Textual capabilities, and the local supergoal inventory; then an
adversarial verification pass. This README is the **reconciled** design after applying the
verifier's 6 must-fixes. Raw per-agent outputs: `improvements.md`, `protocol.md`, `tui.md`,
`verdict.md`, `research-addy.json`, `research-matt.json` in this dir.

Two independent deliverables:
- **A. Per-workflow improvements** (prose edits to existing anchors) - grounded, shippable now, carry
  the real correctness gains, depend on nothing else. Ship these first.
- **B. Supergoal Board** - a lock-free multi-agent state protocol + an in-browser Textual dashboard.
  An **observability overlay, not a 12th mode and not a gate**. Optional, trim-then-build.

---

## A. Per-workflow improvement plan (highest-leverage first)

Five pure-prose edits raise correctness with zero new ceremony - do these first:

| # | Workflow | Change | From |
|---|---|---|---|
| 1 | DEBUG | `reference/debugging.md`: 3-5 **ranked falsifiable hypotheses** before any probe ("if X, changing Y kills the bug"); user re-ranks, AFK-safe | mattpocock diagnose + addy competing-hypothesis |
| 2 | DEBUG | `reference/debugging.md`+`agents/debugger.md`: **feedback-loop-first** - build a deterministic pass/fail signal (test/curl/CLI) BEFORE hypothesising; if none constructible, STOP | mattpocock diagnose ladder |
| 3 | GREENFIELD | `reference/role-loop.md` Frame: **reframe-to-measurable** - each vague goal -> a falsifiable acceptance line in `surfaced-requirements.md` | addy spec-driven |
| 4 | GREENFIELD | `agents/code-reviewer.md`: **adversarial Critic + withhold-the-claim** - critic gets artifact+criteria only, never the builder's reasoning; "find what is wrong, do not validate" | addy doubt-driven |
| 5 | all loop modes | `reference/role-loop.md`: cap Critic->Fixer at **3 cycles then escalate**; "doubt theater" anti-signal (2+ cycles, findings, zero actionable = abort) | addy doubt-driven hard bound |

Two new gates that verify a real invariant (not self-graded quality), worth the effort:
- **SPEC traceability** (`templates/spec-trace-gate.mjs`): every EARS criterion in `requirements.md`
  resolves to a `_Requirements: N.N_` ref in `tasks.md`; unmatched = fail.
- **ARCH no-edits** (`templates/no-edit-gate.sh`): `git status --porcelain` clean except vault - verifies
  ARCH/REVIEW-ONLY's honor-system "no source edits".

Other grounded edits (see `improvements.md` for the full table + effort): LEGACY structured
before/after API capture + `.domain-agent` staleness warning; SPEC guess-attached one-question
interview w/ explicit-yes gate + Out-of-scope line; LEARN mission/ZPD anchoring; LEARN-DOMAIN
`file:line` citation requirement in the grounding gate; QA-ONLY scenario-level pass/fail in
`state.json`; REVIEW-ONLY two-axis (Standards vs Spec) + finding-prefix taxonomy; ARCH deletion-test
seam vocabulary; HARNESS-EVAL running ledger; SKILL-MINE rejection memory.

**Rejected (would violate baseline-first), do not import:** `/build auto` autonomous chaining;
per-task commit-choreography rails; blanket ADR-on-every-decision; 95%-confidence multi-question
interview in DEBUG/QA (over-interviewing); HTML/Mermaid ARCH report; caveman terse-output persona;
`setup-*` multi-tracker config substrate (net-new infra across all 11 modes). Detail + reasons in
`improvements.md`.

---

## B. Supergoal Board - reconciled design (verifier fixes applied)

Answers the literal ask: real-time per-agent **mode + workflow stage**, **repo path + branch/worktree**,
a **Jira-like task board**, served **in-browser**, across **multiple agents** with **no branch locking**.

### B0. Verifier must-fixes folded in

1. **One state path, repo-independent.** Single source of truth =
   `${SUPERGOAL_RUN_DIR:-$HOME/.supergoal/runs}/<run_epoch>/agents/<agent_id>.json`, **outside any target
   repo** (writing into the repo would dirty `git status`, which ARCH/REVIEW-ONLY treat as a baseline
   violation). The TUI reads exactly this path. The design does **not** read or write `.omx/` or any
   host-side telemetry surface - the earlier TUI draft that pointed inside the repo at a host telemetry
   dir was wrong and is deleted. The Board owns its own state files end to end; nothing else is a
   dependency.
2. **No intra-agent race.** Remove the PostToolUse board-write entirely. Only the conductor emits, at
   phase transitions - one writer, one trigger, per `agent_id.json`. (This was the lost-update bug:
   two emit triggers + non-atomic read-merge-rename could drop `tasks[]`.)
3. **`jq` is a declared dependency** of the emit helper. Dropped the inconsistent "no client lib" wording.
4. **NFS rename atomicity is a stated limitation**, not a guarantee. Local `$HOME` is the supported case.
5. **Launch never stalls a run.** Caller returns immediately (`&`); the bounded port-wait runs *inside*
   the backgrounded child, not the agent turn.
6. **All emission optional.** No "mandatory" hook. If nothing emits, the board shows nothing and every
   gate still passes. Liveness is reader-derived from `pid` + `updated_at` age - never a trusted flag.

### B1. State protocol (the load-bearing idea)

**Correctness comes entirely from: one writer per file + atomic rename.** Every other property
(lock-free, crash-safe, shared-branch-safe, tailable) follows, with no lock anywhere.

- **Mechanism:** one heartbeat JSON per agent, replaced atomically (`tmp.$$` -> `mv -f`). Not JSONL
  (forces tail-replay to derive "now"), not SQLite (writer lock couples agents; over-engineering).
- **No branch lock:** `agent_id` embeds `pid`, so two agents on `feat/login` own two distinct files.
  `branch` is a display field, never a mutex. There is no shared mutable file => no lock needed.
- **Liveness (reader-side only, writers never reap):**
  `alive` = pid running on this host AND age <= 45s; `stale` = age 45-180s; `dead` = pid gone (same
  host) OR age > 180s; `done` = phase == Done. PID-reuse false-positive mitigated by AND-ing freshness.

**v1 flattened schema** (cut from the original: top-level `task_status`, per-task `phase`, the JSONL
audit stream, `_archive/`, TTL auto-prune - add those only when a post-mortem need actually appears):

```jsonc
{
  "schemaVersion": 1,
  "agent_id": "acme-api-feat-login-9f3a2b-48217",  // repo-branch-worktreehash-pid, slugified
  "repo_path": "/Users/danny/work/acme-api",
  "repo": "acme-api",
  "branch": "feat/login",                          // advisory; agents may share it
  "worktree": "/Users/danny/work/acme-api",        // == repo_path unless linked worktree
  "mode": "GREENFIELD",                            // supergoal mode
  "phase": "Critic",                               // Frame|Build|Critic|Fixer|Verify|Done
  "current_task": "Add JWT refresh endpoint",      // nullable
  "started_at": "2026-06-17T09:00:00Z",            // ISO-8601 UTC Z, immutable
  "updated_at": "2026-06-17T09:14:51Z",            // ISO-8601 UTC Z, the liveness clock
  "pid": 48217,
  "host": "danny-mbp",
  "note": "2 reds open from critic",               // <=120 chars, nullable
  "tasks": [                                       // full snapshot each emit (board is small)
    {"id":"t1","title":"Add JWT refresh","status":"in-progress"},
    {"id":"t2","title":"Rotate token on use","status":"backlog"},
    {"id":"t0","title":"Login happy path","status":"done"}
  ]
}
```
Task `status` enum = Jira columns: `backlog | in-progress | review | done | blocked`
(review = Critic-active, done = Verify-passed).

**Emit helper `sg-emit` (POSIX sh + jq):** reads `SG_*` identity from env set once at registration; if
`SG_AGENT_ID` unset -> `exit 0` silently (opt-in). Computes `updated_at`/`pid`/`host`, carries forward
`tasks[]` from the prior file unless `--tasks-file` given, writes `$DEST.tmp.$$`, `mv -f` over `$DEST`.
Any failure -> stderr warning + `exit 0` (never aborts the agent's real work). < 15ms, once per phase
transition. Called by the **conductor** at role-loop boundaries (personas run isolated and can't see
each other - the conductor owns the loop boundary, same pattern as `qa-only.md:61`).

### B2. Textual board (in-browser, real-time)

Widget tree (all verified-current Textual APIs): `Header(show_clock)` + `Horizontal` body:
left `DataTable #agents` (roster: glyph/id/repo/branch-wt/mode, `cursor_type="row"`); center-right a
`Static #stages` strip (`Frame > Build > [CRITIC] > Fixer > Verify`, current highlighted) over a
`Horizontal` of `DataTable #tasks` (4 columns Backlog/In-Progress/Review/Done) + `RichLog #events`;
`Footer` for keys.

```
+- Supergoal Board --------------------  agents:3 live:2 stale:1 . done:9/14 ---- 14:22 -+
| * id       repo        br/wt     mode  |  Frame - Build -[ CRITIC ]- Fixer - Verify   |
| * exec-3f  acme-api    feat/log  GREEN | ----------------------------------------------|
| * rev-91   acme-api    feat/log  GREEN |  Backlog    In-Progress   Review     Done     |
| o qa-7c    web-admin   wt-qa     QA     |  T5 csrf    T1 login(*)   T3 rate    T0 init  |
|   (grey = stale/dead pid)               |  T6 logout                -limit     T2 db    |
|                                         | +- events (exec-3f) -----------------------+ |
|                                         | | 14:22:01 Critic: failing test login_429  | |
|                                         | | 14:22:09 Verify: 14/14 real tests pass   | |
|                                         | +------------------------------------------+ |
+----------------------------------------------------------------------------------------+
| up/dn select agent   p pause-refresh   o open-vault   q quit                           |
+----------------------------------------------------------------------------------------+
```

**Refresh (v1 = simplest that works):** `set_interval(1.0)` polls the agents dir mtimes and re-reads
changed `*.json` (phase transitions are seconds-to-minutes apart - no `watchdog` dependency needed).
A separate `set_interval(1.0)` **liveness tick** greys stale/dead rows (a stale agent emits no file
event, so only the clock reveals it). Never `DataTable.clear()` on refresh - diff and `update_cell`
only changed cells (flicker-free). Two agents sharing repo+branch are two distinct rows keyed by
`agent_id` - no branch-exclusivity assumed.

**In-browser auto-open:** `textual-serve` `Server("python -m tui.app", host="127.0.0.1", port=8000,
title="Supergoal Board").serve()` - launches the app in a subprocess per browser visit over a
websocket (multiple tabs/humans can watch one run). `textual-serve` does **not** open a browser itself,
so `tui/launch.sh` does it: single pidfile guard (don't spawn a 2nd server), spawn `nohup python -m
tui.serve &`, port-wait **inside** the child, then `open` (macOS) / `xdg-open` (linux) / `wslview`
(wsl) the URL. Caller returns immediately. `SUPERGOAL_TUI_NO_OPEN=1` suppresses the browser.

**Module layout:** `tui/app.py` (App: compose/reactives/handlers), `tui/state.py` (pure reader:
`read_atomic_json`, `pid_alive`, liveness - no Textual imports, headless-testable), `tui/serve.py`
(`textual_serve.Server` wrapper), `tui/launch.sh`, `tui/app.tcss`.

**Integration = overlay, not a mode.** `SKILL.md` gets ONE advisory line: on skill start, if
`$SUPERGOAL_TUI=1`, fire-and-forget `bash tui/launch.sh &`; never block; ignore failure. No
`*-gate.sh` entry. The only test is `tests/tui-state-reader.test.sh` (a producer/consumer parse check,
not a delivery gate). The board observes; it cannot reject a verification or block a commit.

### B3. Textual limits the request implies (verified honest)

`textual-serve` won't auto-open a browser (we do it). `Header` has no free-form right slot (counts go
in `sub_title`). `DataTable` has no per-cell hover tooltip or arbitrary per-cell background fill (Jira
"cards" are glyph + foreground color, not filled blocks). `App.suspend()` is ignored under serve.
`textual-web` is beta + non-persistent (tab close kills the app) - use `textual-serve` for an always-on
overlay. File-watching is not built into Textual - v1 uses stdlib mtime polling, no new dep.

---

## Build order (if approved)

1. **A1-A5** prose edits (DEBUG x2, GREENFIELD x2, cross-cutting 3-cycle bound) - smallest, highest
   correctness gain, no dependency on the board. Each = single-file anchor edit + its contract test.
2. **B1** state protocol (`templates/observability/sg-emit.sh` + `heartbeat.schema.json` +
   `reference/observability.md` + one advisory line in `role-loop.md`) + a producer test.
3. **B2** Textual board (`tui/`) + the reader test + the opt-in `SKILL.md` overlay line.
4. Two real-invariant gates (SPEC traceability, ARCH no-edits) if wanted.

Each step verified against the repo's own `tests/*.test.sh` suite before the next.
