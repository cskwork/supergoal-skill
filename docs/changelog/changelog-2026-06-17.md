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
