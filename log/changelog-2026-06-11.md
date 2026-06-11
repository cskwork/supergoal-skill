# Changelog 2026-06-11

## Feature: SPEC mode - Kiro-style spec structuring merged as a spec-first prefix

### What
Merged the Kiro spec-driven-development workflow (jasonkneen/kiro skills: requirements-engineering,
design-documentation, task-breakdown, spec-driven-development) into supergoal as a tenth mode. SPEC is
a prefix to the default loop, not a parallel pipeline: requirements.md -> design.md -> tasks.md are
written and approved under `docs/spec/<feature-slug>/` in the TARGET repo, then the existing loop
executes against them.

- NEW `reference/spec.md` (~95 lines): the contract. Glossary-first requirements (one name per
  concept; EARS statements use glossary terms verbatim); numbered requirements each carrying a user
  story ("As a [role], I want [feature], so that [benefit]"), EARS acceptance criteria
  (WHEN/IF/WHEN-AND ... THEN system SHALL ...), and edge cases; design.md with components citing
  requirement numbers and decision records; tasks.md as a two-level checkbox plan with
  `_Requirements: N.N_` traceability. One approval checkpoint per document, pre-approvable
  ("끝까지 진행") so the gate stays cheap.
- NEW `templates/spec/requirements.md`, `templates/spec/design.md`, `templates/spec/tasks.md` -
  fill-in templates in the surfaced-requirements.md idiom (intro comment + compact example).
- NEW `tests/spec-contract.test.sh` (31 checks) - written FIRST and run red (30 fail at baseline; the
  one initial false-pass on a bare "SPEC" grep was tightened to pin the mode-table row).
- `SKILL.md`: mode-table row, reference-map row, "spec this feature" trigger in the description
  (339 chars, within the 1024 frontmatter cap).
- `README.md` / `README.ko.md` mode tables; `docs/index.html`: SPEC mode card (blue accent),
  metric 9 -> 10 modes.

### What was deliberately changed from Kiro
- **Integration instead of copy**: Kiro's phases end at "begin implementation". Here the spec feeds
  the existing role loop - Build executes tasks.md in order, the critic derives its failing tests
  from the EARS criteria (each WHEN/THEN line is a test case by construction), and every surfaced
  requirement flows BACK into requirements.md as a new numbered requirement, keeping the spec the
  living document of record while the run vault keeps the per-run trail.
- **Anti-ceremony gate**: SPEC is opt-in (explicit ask, or multi-component feature + user confirms).
  Trivial edits and hotfixes skip it - consistent with the 8-eval finding that gated ceremony never
  beat a strong baseline. DEBUG keeps `reference/debugging.md`; bug fixes do not get specs.
- **"2-4 hours" task sizing dropped** for "small enough to verify independently" - agent time is not
  human hours; independent verifiability is the property the loop actually needs.
- **Ground-truth guardrail added**: EARS criteria strengthen the prose spec but never replace ground
  truth; final verification stays the project's REAL tests + prose spec.
- Glossary made mandatory and load-bearing (Kiro's repo skills omit it; the Kiro product has it):
  EARS statements must use glossary terms verbatim, which is what makes criteria mechanically
  testable without synonym drift.

### Why
User request: adopt Kiro's spec structuring (glossary / user story / EARS requirements,
requirements.md + tasks.md document flow) as a supergoal workflow generating documents under
`docs/spec/`. The EARS form is a good fit for the existing critic: each criterion is a black-box,
spec-anchored test case, which is exactly the signal `reference/role-loop.md` wants the critic to
produce.

### Verification
- RED: `tests/spec-contract.test.sh` run before implementation - 30 failed (file absent, wiring
  absent), 1 weak assertion fixed to `| SPEC |`.
- GREEN: full suite via bash - 12/12 test files rc=0, 394 assertions PASS, 0 FAIL
  (baseline was 11 files / 363 assertions).
- Landing: 10 mode cards counted, article tags balanced 18/18, no stale `<strong>9</strong>`.

## Follow-up: grill protocol - middle ground between autonomous drafting and rubber-stamp

### What
User feedback: SPEC as shipped was too autonomous - the agent drafts three polished documents and the
user just approves at checkpoints. Merged Matt Pocock's grill-with-docs method into the SPEC contract
as a `## Grill - crystallize, don't rubber-stamp` section in `reference/spec.md`:

- **Skeleton first (autonomous)**: code/docs exploration, candidate glossary terms, requirement
  one-liners; mechanical work (EARS phrasing, edge enumeration, formatting) stays autonomous.
- **Grill load-bearing, user-only decisions**: decision tree walked branch by branch, one question at
  a time, each with a recommended answer; code-answerable questions are explored, never asked.
- **Challenge moves**: term conflicts called out against the spec glossary and repo language
  (`CONTEXT.md` / `.domain-agent/`); fuzzy terms sharpened to a precise canonical term; boundaries
  stress-tested with concrete edge scenarios; user claims cross-checked against the code.
- **Inline crystallization**: a settled answer lands in the document the moment it settles - no
  batching into a final draft. Approval checkpoints become confirmations of co-created content.
- **Escape hatch**: "draft the rest" / pre-approval converts remaining grill items to recorded
  assumptions - this is the dial between fully interactive and fully autonomous.
- design.md decision records now grilled (options + recommendation) and gated on the ADR three-part
  test (hard to reverse AND surprising without context AND real trade-off); cheap reversible choices
  stay autonomous.
- SPEC now REPLACES the generic clarifying interview (`reference/interview.md`) instead of stacking
  on it - no double-asking.
- Touched: `reference/spec.md` (intro, Where-it-runs, design.md item, new Grill section, Approvals
  rewording), `templates/spec/requirements.md` + `design.md` (inline-crystallization / ADR-test
  comments), SKILL.md SPEC row, README.md / README.ko.md rows, `docs/index.html` card
  (pipe: Skeleton -> Grill -> Crystallize -> Build vs spec).

### Why
Specs drafted autonomously encode the agent's guesses; skim-approval makes the checkpoint a rubber
stamp. The grill makes approval meaningful (content was decided together), while the skeleton +
escape hatch keep the cost bounded - the requested middle ground.

### Verification
- RED: 13 new assertions added to `tests/spec-contract.test.sh` first - 31 passed / 13 failed before
  the edit.
- GREEN: full suite via bash - 12/12 files rc=0, 407 assertions PASS, 0 FAIL (spec contract 31 -> 44).

## Feature: ARCH mode + rejection-ADR discipline (improve-codebase-architecture merge)

### What
Merged the improve-codebase-architecture skill (Matt Pocock; companion to grill-with-docs) into
supergoal as the eleventh mode plus one cross-cutting grill rule.

**ARCH mode** - the previously unrouted intent "improve the architecture / find refactoring
opportunities" (LEGACY assumes you know the target; REVIEW-ONLY is diff-scoped with bug/security
lenses). NEW `reference/arch.md` reassembles existing machinery:
- Survey: read `CONTEXT.md` / `.domain-agent/` / `docs/adr/` first (ADRs record decisions not to
  re-litigate); explore organically for friction using the depth vocabulary (module/interface/depth/
  shallow/seam/leverage/locality, deletion test) - terms used exactly, no drift into
  component/service/boundary.
- Report: REVIEW-ONLY conventions - findings-only, `report.md` in the run vault (NOT the original
  skill's $TMPDIR HTML), per-candidate Files/Problem/Solution/Benefits + recommendation strength
  (Strong | Worth exploring | Speculative), Strong candidates re-checked against cited code,
  `Top recommendation:` + `Not covered:` anchors. No interface proposals before the user picks.
- Grill the pick: reuses `reference/spec.md ## Grill` verbatim (one question at a time + recommended
  answer, code-answerable explored not asked); new terms land in `CONTEXT.md`, rejections in ADRs.
- Route out: refactor executes as LEGACY (scoped) or SPEC (multi-component reshape); ARCH never edits
  src.

**Rejection-ADR rule** (added to `reference/spec.md` grill, item 6): when the user rejects an option
for a load-bearing reason, offer a short ADR under `docs/adr/` so future runs and surveys don't
re-suggest it; skip ephemeral/self-evident reasons. This was the one concept supergoal lacked - a
durable memory of REJECTED choices (surfaced-requirements only remembers adopted ones).

Wiring: SKILL.md (mode row, no-code bullet, reference-map row, "improve the architecture" trigger -
description 367 chars), README.md / README.ko.md (rows + utilities line), docs/index.html (ARCH card,
cyan accent, metric 10 -> 11). NEW `tests/arch-contract.test.sh` (24 checks).

### Why
User asked whether improve-codebase-architecture had a place in supergoal. Assessment: one real
routing gap (survey-first architecture work) and one portable discipline (rejection ADRs). Both
reuse existing parts - REVIEW-ONLY's report conventions and SPEC's grill - so the mode adds routing,
not machinery.

### Verification
- RED: `tests/arch-contract.test.sh` written first - 0/24 passed; spec-contract rejection-ADR
  assertions 44 passed / 3 failed before the edits.
- GREEN: full suite via bash - 13/13 files rc=0, 434 assertions PASS, 0 FAIL
  (spec contract 44 -> 47; arch 24 new).
- Landing: 11 mode cards, article tags balanced 19/19, no stale `<strong>10</strong>`.
