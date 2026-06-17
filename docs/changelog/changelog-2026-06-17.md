# 2026-06-17 - Supergoal Board: lock-free multi-agent state protocol + in-browser Textual dashboard

## What

Opt-in observability overlay (NOT a 12th mode, NOT a gate): a live, in-browser board of every agent's
mode + workflow stage + Jira-like task board, across concurrent agents on different repos/branches/
worktrees, with no branch locking.

- `templates/observability/sg-emit.sh` - POSIX sh + jq emitter. One heartbeat JSON per agent at
  `${SUPERGOAL_RUN_DIR:-$HOME/.supergoal/runs}/agents/<agent_id>.json`, replaced atomically
  (`tmp.$$` -> `mv -f`). Opt-in via `.enabled` flag; best-effort (any failure -> exit 0).
- `templates/observability/heartbeat.schema.json` - flattened v1 schema (draft-07).
- `reference/observability.md` - producer spec: layout, lifecycle, reader liveness, concurrency table.
- `tui/` - Textual 8.x reader. `state.py` (pure, headless-testable), `app.py` (roster DataTable +
  stage strip + Jira board DataTable + RichLog; `set_interval(1.0)` poll, flicker-free `update_cell`
  diffing, dead-pid greying), `serve.py` (`textual_serve.Server` wrapper), `launch.sh` (idempotent
  background launch + browser auto-open), `app.tcss`.
- Wiring: one advisory line in `reference/role-loop.md`; one opt-in overlay paragraph + ref-map row in
  `SKILL.md`. Tests: `tests/observability-contract.test.sh` (producer, 16), `tests/tui-state-reader.test.sh`
  (consumer incl. headless Pilot render, 11).

## Why

User asked for a "terminal Jira" that shows, in real time, which workflow each agent is on and where -
across multiple agents and worktrees - without locking branches. The board answers "which agent, which
mode, which phase, which task column, alive?" which 8/10 modes (markdown-only) could not surface.

## Decisions

- **One writer per file + atomic rename is the entire correctness story.** Lock-free, crash-safe,
  shared-branch-safe all follow. `branch` is a display field, never a mutex -> agents share a branch
  freely. Rejected JSONL (forces replay to derive "now") and SQLite (writer lock couples agents).
- **Two latent design bugs in the raw research design, fixed for Claude Code reality:**
  (1) No stable per-agent OS pid (each Bash tool call is a fresh shell) -> liveness is TIMESTAMP-primary;
  pid is an advisory same-host refinement only. (2) Exported env does not persist across tool calls ->
  identity is SELF-DERIVED from `git` each call (not held in env); `--slot` disambiguates same-worktree
  agents; opt-in is a `.enabled` FILE (survives across calls), not an env var.
- **Verifier must-fixes folded in:** single repo-independent state path (deleted the false `.omx/state`
  read); removed the PostToolUse board-write that caused an intra-agent lost-update race (conductor-only,
  one trigger); `jq` declared dependency; NFS rename atomicity stated as a limitation; launch never
  stalls a run (port-wait runs inside the detached child); all emission optional.
- **Trimmed to v1** per the verifier: `set_interval` poll instead of a `watchdog` file-watch worker
  (phase transitions are seconds-to-minutes); cut JSONL audit, `_archive`, TTL auto-prune,
  follow-latest, lsof dual-guard (single pidfile). Smallest thing that delivers the core ask.
- **Baseline-first:** droppable telemetry. No gate reads these files; no mode fails when emission is
  absent. Deleting `~/.supergoal/runs` breaks nothing. The board observes; it never blocks a commit.

## Verify

Reader: liveness alive/stale/dead/done correct against fixtures; robust to a torn/garbage file (skips,
never raises). App: composes, mounts, auto-selects, renders the board, survives repeated polls - all
headless via Textual `run_test()` Pilot. sg-emit: opt-in no-op when disabled, carry-forward + append,
atomic (no `.tmp` leftover). `launch.sh`: creates `.enabled`, returns immediately. Full `tests/*.test.sh`:
15/15 suites green (added observability + tui-state-reader). In-browser serving needs
`pip install textual-serve` (serve.py degrades with an install hint if absent); the app itself is
verified, the serve layer is a thin wrapper over the confirmed `textual_serve.Server` API.

---

# 2026-06-17 - Loop sharpening from external skill repos (deltas only, no duplication)

## What

Mined `addyosmani/agent-skills` (62k*) and `mattpocock/skills` (132k*) for transferable techniques
(8-agent workflow + adversarial verification; research vault in
`docs/experiments/tui-research-2026-06-17/`). Applied five surgical edits - only the genuinely missing
delta in each case:

- DEBUG `reference/debugging.md`: feedback-loop intro now says STOP+report if no trusted loop can be
  built (was implicit in "No trusted loop, no fix"); hypothesis ledger gains a falsifiable-prediction
  framing ("if cause C, probe P flips the result") so the discriminating probe is explicit.
- DEBUG `agents/debugger.md`: same STOP discipline in the persona RULES.
- GREENFIELD `SKILL.md` Frame: acceptance criteria must each be a falsifiable/measurable check
  (reframe "make it faster" into a measured line), not a vibe.
- Critic `agents/code-reviewer.md`: explicit adversarial stance - try to DISPROVE; do not validate,
  summarize, or rubber-stamp.
- `reference/role-loop.md` Guardrails: hard stop - cap critic->fixer at 3 cycles then escalate;
  doubt-theater anti-signal (2+ cycles, findings, zero code change = validating, not doubting).

Contract: `tests/role-loop-contract.test.sh` +3 assertions (3-cycle cap, doubt-theater, DISPROVE
stance). Full `tests/*.test.sh`: 13/13 suites green.

## Why

The research agent proposed DEBUG ranked-hypotheses and feedback-loop-first as new, but reading the
actual files showed both were ~90% already present (ledger + AFK-safe re-rank in `debugging.md` steps
3-4; "No trusted loop, no fix" + Reproduce-before-hypothesise ordering). Re-adding them would be the
exact gated-ceremony duplication this project removed once (`supergoal-baseline-first` memory). So each
edit is a single clause/line that adds the one missing thing, not a new section.

## Decisions

- **Deltas only, not the proposed sections.** A1/A2 already implemented -> added only the falsifiable
  phrasing and the explicit STOP. Smallest-correct-change over importing a redundant block.
- **A5 (3-cycle cap) is the one real new discipline** -> it gets a Guardrail line AND a contract
  assertion, because a stuck/self-congratulating critic loop had no machine-checked stop before.
- **Rejected for baseline-first** (logged in `docs/experiments/.../improvements.md`): `/build auto`
  autonomous chaining, per-task commit choreography, blanket ADRs, 95%-confidence multi-question
  interview in DEBUG/QA, HTML/Mermaid ARCH report, caveman terse-output, multi-tracker config substrate.

## Verify

`tests/role-loop-contract.test.sh` -> 17 passed, 0 failed. Full suite 13/13 green. No contract-asserted
phrase removed (Frame/LEGACY/surfaced-requirements anchors intact).

---

# 2026-06-17 - LEGACY: exact API capture before refactor (preserve-baseline)

## What

Gave LEGACY mode a capture step parallel to DEBUG's `screen -> exact API` (commit `cf77a87`).
Before refactoring/integrating an existing API, capture its exact behavior as a golden-master
baseline; after the refactor, re-capture the same call and diff. Unintended drift is a red.

Touched: `SKILL.md` (LEGACY row), `README.md` (LEGACY row), `reference/qa.md` (new "API behavior
baseline" section + nav-map intro), `reference/role-loop.md` (Build captures first / Verify diffs),
`agents/explore.md` (flag existing API + GATE), `agents/qa-tester.md` (one-line baseline capture),
`tests/role-loop-contract.test.sh` (anchors).

## Why

Refactoring an existing API risks silently changing observable behavior with nothing proving the
contract held. DEBUG already pins `screen -> endpoint` to LOCALIZE a bug; LEGACY needs the same live
evidence but to PRESERVE behavior across the change. Reuses the same mechanism (nav-map +
`agent-browser network requests`, via `qa-tester`).

## Decisions

- **Depth/gating: golden-master + before/after diff** (not light/advisory). Capture
  method+path+status + representative request + response shape; Verify diffs the re-capture; drift =
  red. Rejected the DEBUG-mirror "method+path+status, advisory" option: it knows where but does not
  prove preservation, which is the whole point of a refactor.
- **Scope: UI-reachable AND backend-only** (not web-only). DEBUG's text is web-symptom-scoped, but
  LEGACY API refactors are commonly backend-only with no UI; web-only would miss the common case.
  UI-reachable -> agent-browser + nav-map; backend-only -> HTTP capture (curl/HAR / HTTP probe).

## Concept split (keeps blast radius small)

- `.domain-agent/qa/nav-map.md` = durable routing (`screen -> API`, method+path) - unchanged.
- `<vault>/qa/api-baseline-<endpoint>.md` = per-run preserve evidence (full contract, may contain
  response data) - run vault only, never the domain pack, sanitized. So `domain-context.md` needed no
  change.

## Verify

`tests/role-loop-contract.test.sh` exits 0; full `tests/*.test.sh` suite has no FAIL.

---

# 2026-06-17 - Single browser driver: playwright-cli only (drop agent-browser / attach-to-browser / MCP)

## What

Collapsed every browser-QA path in QA, DEBUG, and LEGACY onto ONE driver and ONE capture stage:
`playwright-cli` (`@playwright/cli`, microsoft/playwright-cli). Removed agent-browser, Playwright MCP,
Computer Use, `iab`, the separate attach-to-browser skill, and the headless-Chrome fallback ladder.

Files: new `reference/playwright-cli.md` (integrated command skill); `reference/qa.md` (driver mechanics
merged into one "Browser context capture - the single driver stage"; auth folded into playwright-cli
native session/state/CDP; baseline + nav-map + vault + exit gate reworded); `reference/qa-only.md`,
`reference/debugging.md`, `SKILL.md` (driver swap + file-map entry); `agents/qa-tester.md`,
`agents/qa-auditor.md`, `agents/debugger.md` (driver steps, RULES, WRITE, GATE); `templates/qa-gate.sh`
(machine contract); `templates/qa-report.md`, `templates/domain-agent/qa/nav-map.md` (Driver field);
`tests/gate-scenarios.test.sh`, `tests/qa-only-contract.test.sh` (contract assertions + fixtures).

## Why

The multi-driver ladder (agent-browser default -> attach-to-browser for auth -> headless render fallback)
was three tools, three install paths, and a `Fallback:` justification protocol the gate had to police.
playwright-cli does all of it in one binary: token-efficient (no page data forced into the model),
native authenticated sessions (named session / `state-save`+`state-load` / CDP attach), and an installable
self-documenting skill (`playwright-cli install --skills`). One driver = less surface, no silent-fallback
hole, simpler gate. User directive: "just use playwright-cli only only this."

## Decisions

- **Single driver, hard-stop on install failure** (not a fallback ladder). If playwright-cli cannot be
  installed, STOP and prompt the user - never substitute a headless render. Rejected keeping a documented
  last-resort renderer: it is exactly the silent-fallback hole prior changelogs (06-02) closed by hand;
  one driver removes the hole structurally.
- **Auth via playwright-cli native, not a separate skill.** Dropped the external attach-to-browser skill;
  authenticated sessions use named session / saved storage state / CDP attach within playwright-cli. The
  driver line stays `Tool: playwright-cli`, so no `Fallback:` line exists anymore.
- **Gate enforces `Tool: playwright-cli`.** `qa-gate.sh` dropped the `agent-browser doctor` preflight and
  the non-agent-browser `Fallback:` branch; it now fails any `Tool:` line that is not playwright-cli. This
  is the machine backstop against drifting back to another driver.
- **Skill integration = terse vendored reference + on-demand upstream.** `reference/playwright-cli.md`
  carries the verified command surface (from the official README); the full upstream skill is pulled with
  `playwright-cli install --skills`. Did not vendor the upstream SKILL.md verbatim (avoids fabrication and
  bloat; keeps the ref succinct).

## Verify

Full `tests/*.test.sh` suite: 13/13 suites green, 0 FAIL (gate-scenarios 32, qa-only-contract 48,
role-loop 14, others unchanged). `bash -n` clean on both gate scripts. qa-gate.sh behavior smoke:
`Tool: playwright-cli` + as-is/to-be -> PASS; `Tool: agent-browser` -> blocked ("not playwright-cli");
no `Tool:` line -> blocked; CLI smoke -> PASS. No `agent-browser`/`attach-to-browser` left in active
skill files except intentional negative references (the gate/agents stating "no agent-browser").
`docs/experiments/*` snapshots left frozen by design.
