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
