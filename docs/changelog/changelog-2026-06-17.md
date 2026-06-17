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
