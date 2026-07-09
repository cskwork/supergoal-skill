# 2026-07-09

## GREENFIELD Frontier Scope Gate

- Decision: keep broad new-app requests in `GREENFIELD` instead of routing them to a separate top-level
  `WAYFINDER` run.
  Why: users asking to build a new thing should not need to choose a planning route manually.
- Decision: reuse WAYFINDER's map/ticket mechanics inside GREENFIELD before Build when the new build is
  broad, foggy, roadmap-shaped, or multi-session.
  Why: one vertical frontier slice is simpler to verify than a large app plan.
- Rejected: fully merging away `WAYFINDER`.
  Why: explicit no-code planning asks still need a product-code-free route.

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

## Clarify GREENFIELD + WAYFINDER path sharing

**Change**: Kept GREENFIELD and WAYFINDER as separate public modes while making their shared path
explicit. Broad GREENFIELD requests now reuse the WAYFINDER map/ticket-depth machinery during Frame, then
deliver one selected frontier ticket as GREENFIELD. Pure planning/spec requests still route to no-code
WAYFINDER.

**Why**: This gives one simple workflow path for broad new builds without making "spec this" requests
accidentally ship code or forcing every small GREENFIELD request through heavy planning.

**Rejected alternatives**:

- Fully merge GREENFIELD and WAYFINDER into one public mode. That erases the no-code planning boundary.
- Keep the wording as "scope gate" only. That is technically correct but does not make the shared
  workflow path obvious enough.

**Verification target**: `tests/wayfinder-prototype-contract.test.sh` should enforce shared map/ticket
machinery plus the separate no-code WAYFINDER boundary.

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

## Credit surface

**Change**: Added Matt Pocock public-skill credit to the root skill, README, Korean README, and landing
footer.

**Why**: WAYFINDER and the cited research helper deliberately reuse concepts from Matt Pocock's
research and skill-writing patterns, so the credit belongs on the durable skill surfaces, not only in
the planning note.

## Mandatory Two-Axis Review

**Change**: Split the default GREENFIELD / DEBUG / LEGACY review gate into independent Spec and Standards
axes. The mandatory core now routes through the same review gate before Exact Verify/QA. REVIEW-ONLY uses
the same split and keeps the existing Security reviewer as a third findings-only pass.

**Why**: Matt Pocock's `code-review` skill has one directly useful import for Supergoal: "did we build the
right thing?" and "is it built well?" should not be blended into one reviewer context. Separate axes make
missing requirements, scope creep, repo-standard violations, and design smells easier to judge without one
category masking the other.

**Rejected alternatives**:

- Put the review inside Build. That weakens independence; the builder should keep one job and not approve
  its own work.
- Replace Supergoal's review/verify model wholesale. Supergoal already has `GOAL.md`, `PLAN.md`, `QA.md`,
  run vaults, red-green, exact proof, and optional Critic/Fixer; only the axis split was missing.
- Drop the Security reviewer from REVIEW-ONLY. That would make the standalone audit route less safe than
  before.

**Verification target**: `bash tests/role-loop-contract.test.sh`, `bash tests/review-only-contract.test.sh`,
`bash tests/harness-eval-contract.test.sh`, `bash tests/run-all.sh`, and `git diff --check`.

## Merged Improve phase

**Change**: Collapsed the visible delivery loop from `Build -> Improve full spec -> Improve edge cases ->
Mandatory Two-Axis Review -> Exact Verify/QA` to `Build -> Improve spec & edges -> Mandatory Two-Axis
Review -> Exact Verify/QA`.

**Why**: The full-spec and edge-case passes use the same executor persona, same ambiguity threshold, and
same smallest-correct-change rule. Keeping two public phases made the loop look heavier than the behavior
requires. The merged phase keeps two mandatory internal checks: Spec fit compares request/docs/`GOAL.md`
against current behavior, and Edge stress attacks boundary, error, state/protocol, compatibility,
security, and cleanup paths.

**Rejected alternatives**:

- Keep both public phase names. This preserves history but keeps unnecessary surface area in the loop.
- Merge Improve into Build. That would weaken the fresh re-read after implementation.
- Move edge checks into Two-Axis Review. Review is no-src-edit; grounded edge gaps still need an editable
  improve phase before exact verification.

**Verification target**: `bash tests/role-loop-contract.test.sh`, `bash tests/harness-eval-contract.test.sh`,
`bash tests/observability-contract.test.sh`, `bash tests/tui-state-reader.test.sh`, `bash tests/run-all.sh`,
and `git diff --check`.
