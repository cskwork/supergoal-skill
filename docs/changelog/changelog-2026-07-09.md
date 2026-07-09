# 2026-07-09

## WAYFINDER and PROTOTYPE routes

**Change**: Added two routes from the full mattpocock/skills scan:

- `WAYFINDER` (`reference/wayfinder.md`) maps large or foggy efforts into a destination, vertical
  tickets, blocker edges, and the next frontier. It writes tracker/local planning artifacts, not product
  code, and routes exactly one frontier ticket into delivery.
- `PROTOTYPE` (`reference/prototype.md`) creates isolated throwaway proofs for one uncertainty, then
  deletes/quarantines the artifact or routes the proven decision into GREENFIELD / DEBUG / LEGACY /
  WAYFINDER.
  It cannot satisfy delivery `Done`.

Wired both into `SKILL.md`, README/README.ko, the static landing page, and
`tests/wayfinder-prototype-contract.test.sh`.

**Why**: The upstream repo's strongest missing ideas for Supergoal were not generic context hygiene
(already present through `PLAN.md`, `R-LOOP.md`, `run-state.json`, and fresh-context roles). The useful
imports were a tracker-backed frontier for multi-session work and a clean throwaway prototype lane for
uncertain design/logic questions.

**Rejected alternatives**:

- Add only prose to the default loop - too easy to miss; these are routes with distinct stop conditions.
- Put ticket splitting under SPEC - wrong artifact. SPEC freezes requirements/design/tasks for a feature;
  WAYFINDER maps multiple independently claimable tickets and blocker edges before any one feature is
  ready.
- Let prototypes count as delivery proof - unsafe. A prototype answers a question but skips the real
  tests, request/docs trace, and production cleanup that delivery requires.
- Auto-publish issues to GitHub by default - visibility and permissions differ per repo; WAYFINDER uses
  the native tracker only when configured or named, otherwise local markdown.

**Verification target**: `bash tests/run-all.sh`, plus the new focused contract test.

## Optional example verifier drift

**Change**: `tests/run-all.sh` now skips `examples/url-shortener` when that optional directory is absent,
and README/README.ko plus `docs/DESIGN.md` describe the example as optional vendored material.

**Why**: This checkout has no tracked `examples/` directory, but the canonical runner hard-failed after
all contract tests and template syntax checks passed. The example step should not make the canonical
verification unusable when the optional fixture is not vendored.

**Rejected alternative**: Recreate the historical URL shortener in this change. That would be unrelated
fixture restoration, not needed for the WAYFINDER/PROTOTYPE route contract.

## WAYFINDER vault-local layout and one-ticket stop

**Change**: Replaced the standalone `docs/wayfinder/<slug>/` fallback with the run-vault-local
`docs/changelog/<YYYY-MM>/<DD-topic>/wayfinder/` layout. The root vault still owns `GOAL.md`; the
WAYFINDER folder holds the large-work map and ticket slices beneath that same dated task folder.

**Why**: Large-work planning should stay attached to the same run vault as the original objective. A
separate global docs path makes the map feel like a detached project wiki instead of the detailed slice
of the active `GOAL.md`.

**Behavior**: WAYFINDER now routes exactly one frontier ticket, then stops. The final handoff must name
the closed ticket, integration/end-to-end check status or requested command, next frontier ticket, and a
request to clear context before starting the next task.

**Rejected alternative**: Keep batch-ticket execution behind a user opt-in. For large efforts, that keeps
too much state in one context and makes integration proof easy to skip.

## Collapse SPEC into WAYFINDER

**Change**: Removed SPEC as a standalone Supergoal mode. `spec / requirements first` intent now routes
to WAYFINDER, and the useful SPEC mechanics live as optional ticket-depth sections inside a WAYFINDER
ticket: glossary, user story, EARS-style acceptance checks, edge cases, design notes, decision records,
and task checklist.

**Why**: SPEC and WAYFINDER were competing planning workflows. Keeping only WAYFINDER makes large-work
planning one path: map the goal, deepen only the ticket that needs it, route one frontier, stop, and ask
for context clear plus integration proof before the next ticket.

**Rejected alternatives**:

- Keep SPEC as a second mode and clarify when to use each. This still leaves agents choosing between two
  similar planning lanes.
- Keep `docs/spec/<feature-slug>/` for ticket depth. That recreates a parallel artifact tree beside the
  run vault and weakens the user's requested `docs/changelog/<date>/<task>/wayfinder/` layout.
- Delete all SPEC learnings. The old workflow had useful rigor - glossary discipline, EARS checks,
  one-question grill, and traceable tasks - but those belong inside a ticket, not as a separate mode.

## Korean public-copy cleanup

**Change**: Smoothed awkward Korean copy in `README.ko.md` and `docs/index.html`, especially English-style
phrasing around routing, WAYFINDER ticket depth, QA sharding, agent dispatch, and ground-truth
verification. Also corrected the landing metric from 13 modes to 12 after SPEC collapsed into
WAYFINDER.

**Why**: The Korean docs should read like product documentation, not a literal translation of internal
agent terms. Canonical command names and mode names remain in English where tests and operators depend
on them.

**Rejected alternative**: Translate every technical term. Terms such as `WAYFINDER`, `Critic/Fixer`,
`Impact Matrix`, and `run vault` are contract vocabulary, so the copy explains them in Korean while
keeping the canonical labels visible.

## WAYFINDER research reference

**Change**: Added a `reference/research.md` helper and WAYFINDER hook for tickets that need cited
outside/current-source evidence before a decision can be made.

**Why**: Matt Pocock's `research` skill has one useful import for Supergoal: high-trust primary-source
research should produce a cited Markdown asset in the repo. Supergoal should use that inside WAYFINDER
tickets instead of creating another top-level mode.

**Rejected alternatives**:

- Add a `RESEARCH` mode - too much surface for a helper that only resolves knowledge questions.
- Reuse `reference/market-research.md` - wrong scope; demand validation is not technical/docs/API
  evidence gathering.
- Let research count as delivery proof - unsafe; implementation still needs the selected route's real
  tests and request/docs trace.

**Verification target**: `bash tests/research-contract.test.sh`, `bash tests/reference-integrity.test.sh`,
and `bash tests/run-all.sh`.
