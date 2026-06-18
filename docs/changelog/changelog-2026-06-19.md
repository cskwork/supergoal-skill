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
