# Changelog 2026-06-19

## Workflow contract: required worktrees and browser UI QA

### What

- Added `tests/workflow-contract.test.sh` to pin the coding/debug workflow contract.
- Updated `SKILL.md` and `reference/role-loop.md` so non-trivial coding/debug work must resolve a
  source/base branch and target/integration branch, verify both refs, create a run worktree, and avoid
  mutating the original checkout.
- Updated `reference/qa.md` and `README.md` so browser UI changes require `playwright-cli` evidence and
  `qa-gate.sh <vault> browser`; lint, typecheck, build, unit tests, or static screenshots do not replace
  browser QA.

### Why

The previous spine still described worktree isolation as optional. That allowed a coding run to edit the
active checkout before resolving the correct source and target branches. It also made browser UI QA easy
to omit from an implementation plan even though the QA gate already required `playwright-cli` evidence.

### Rejected alternatives

- Keep worktrees as a recommendation only: rejected because the failure mode is operational, not stylistic.
- Add a project-specific branch example: rejected because the skill is general and should work across
  teams, branches, and agent CLIs.
- Treat lint/typecheck/build as enough for UI changes: rejected because they do not exercise the real
  browser surface or capture user-observable evidence.

## QA-ONLY detailed impact coverage

### What

- Added an Impact Matrix contract to QA-ONLY so broad verification covers direct behavior, adjacent
  surfaces, complex multi-step scenarios, before/during/after actions, data/role/viewport/failure risks,
  and explicit uncovered areas.
- Added generic web feature families so QA-ONLY chooses scenarios that fit the feature type and checks
  displayed data consistency across state propagation paths instead of baking in one domain example.
- Updated `templates/qa-report.md` and `templates/qa-only-gate.sh` so QA reports must include impact
  coverage, reproduction notes for issues, not-covered items, and re-run instructions.
- Updated the QA suite persistence contract so `.domain-agent/qa/<suite>.md` carries the matrix,
  reproduction notes, coverage, uncovered areas, and residual risks for future re-runs.
- Added Scenario shard dispatch: independent QA surfaces can run in separate `qa-auditor` subagents, each
  writing its own shard file while the conductor owns the shared `qa/scenario-ledger.md`.
- Clarified the public README and landing copy so Impact Matrix is defined as a feature-impact QA map, not
  left as unexplained QA jargon.
- Expanded `tests/qa-only-contract.test.sh` to guard the new QA-ONLY behavior.

### Why

QA-only should mean detailed human QA, not a shallow happy-path smoke. A changed feature can pass its
direct browser check while breaking nearby flows, stale cached state, role-specific behavior, or later
screens that read the same data. Recording uncovered areas and reproduction steps keeps the result useful
to both the user and the next debugging run.

### Rejected alternatives

- Force the full Impact Matrix on every GREENFIELD/LEGACY/DEBUG browser QA run: rejected because normal
  implementation verification needs to stay lean unless the user asks for broad QA or blast radius is high.
- Keep the report at pass/fail only: rejected because a human needs exact reproduction steps when a QA
  finding requires follow-up.
- Let QA subagents edit one shared file directly: rejected because parallel writes are fragile; each
  subagent writes one shard file and the conductor merges the shared ledger.
- Make the gate require every scenario to run: rejected because access, data, roles, and action budget can
  block safe execution; the correct behavior is to name the uncovered risk, not fake coverage.

## Spine diet + subagent-default (context-per-task reduction)

Plan: `docs/plans/2026-06-19-spine-diet-subagent-default.md`. Branch: `refactor/spine-diet-subagent-default`.

### What

- Slimmed `SKILL.md` from 1703 to 1218 words (-28%) by cutting duplicated/verbose connective prose (the
  utility-modes section that re-stated the mode table, the expanded 5-step loop, the verbose UI/UX overlay)
  while preserving every literal that a contract test pins into the spine.
- Flipped the default execution model to subagent-first: `reference/role-loop.md` now states each role runs
  in a fresh-context subagent by default (conductor stays lean; the role's heavy references load inside the
  subagent; independent units run in parallel; trivial single edit stays inline). `README.md` and
  `README.ko.md` updated to match (was "dispatch is optional and single-driver by default").
- All 16 contract suites stay green; no test was retargeted.

### Why

- The complaint was "supergoal eats a lot of context no matter the task." Two causes: (1) the always-loaded
  `SKILL.md` carried all-mode detail (~3k tokens) regardless of mode, and (2) inline-by-default execution
  piled every reference (role-loop, domain-context, taste-skill-v2, ...) into one conductor window. The
  subagent machinery already existed in `agents/*.md` but was secondary.
- superpowers (obra) `writing-skills` sets the target: a frequently-loaded entry skill should be a thin
  router (<200 words) that defers detail; `subagent-driven-development` keeps the orchestrator lean by
  dispatching fresh-context subagents that return only a short structured result. The skill's own test
  comments already declared the intended direction ("SKILL.md is a slim router").

### Why not smaller (the <600-word target was not met)

- `tests/workflow-contract.test.sh:35` pins the operational safety contract (branch isolation, browser QA)
  into `SKILL.md` *on purpose* - "the role loop carries the same operational contract, not only the short
  spine." Those literal sentences set a hard floor for the spine. Reaching <600 would require retargeting
  those tests to the reference files, which weakens the maintainer's deliberate spine-safety design - a
  patch that passes tests but fights the structure. Rejected; left as a user decision.
- The larger lever for "no matter what task" is the subagent-default flip, not the spine size: it moves the
  heavy reference loads out of the conductor's context entirely.

### Verified

- `for f in tests/*.test.sh; do bash "$f"; done` -> 16 suites, 0 failing.
- `wc -w SKILL.md` -> 1218 (was 1703). `git diff --stat` -> 4 files, +85/-111.

### Follow-up: option A (no-risk further trim)

- Compressed only non-pinned filler in `SKILL.md` (the redundant done-checklist -> one `Done =` line; a
  few verbose mode-table / overlay / principle clauses). No pinned literal, no safety-contract sentence,
  and no test was touched. `wc -w SKILL.md` -> 1128 (1703 -> 1128 = -34% cumulative); 16 suites still
  green. Stopped at 1128 rather than chasing <600: deeper cuts would either retarget the deliberate
  spine-safety contract or strip routing clarity from the mode table / reference map.
- Decided NOT to split `reference/teach.md` or `reference/taste-skill-v2.md`: taste-skill-v2 has no real
  appendix (3 lines after `# Appendices`) and already loads only inside the designer subagent;
  teach.md's "templates" are inline illustrations of adjacent rules, so extracting them fragments a
  cohesive, low-frequency protocol for little gain. The subagent-default flip already moves both files
  out of the conductor's context.
