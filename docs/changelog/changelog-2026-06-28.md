# Changelog 2026-06-28

## Code-as-Harness evidence hardening

- Decision: strengthen HARNESS-EVAL proof capture, not the high-level router. The official Code-as-Harness
  paper frames harnesses as executable contracts with accepted-action evidence, trajectory telemetry, and
  governed harness evolution; the existing skill already had same-snapshot controls, blind grading,
  quality scoring, false-GREEN accounting, and fixture discrimination.
- Added scoped evidence bundles to machine checks: every check now records `verifies`, `does_not_verify`,
  `confidence`, and `evidence`. A passing command without its proof boundary was rejected because it can
  hide oracle gaps.
- Added replayable trajectory telemetry to each arm: artifact root, logs, commands, edited files,
  permissions/approvals, turns completed, exit code, crash, and context-exhaustion status. Aggregate
  cost-only telemetry was rejected because it cannot explain why a harness won, lost, or crashed.
- Added a harness mutation contract to result reports: status, intended delta, safety envelope, rollback,
  proof command, and rejected alternatives. Prose-only adoption recommendations were rejected because they
  are not replayable and cannot be rolled back safely.
- Updated `templates/harness-eval-gate.mjs` and `tests/harness-eval-contract.test.sh` so missing scope,
  bad confidence, missing telemetry, proven crashes, and missing mutation contracts fail mechanically.

## Source basis

- Official project page: `https://code-as-harness.github.io/code-as-harness-webpage/`
- Paper: `https://arxiv.org/abs/2605.18747`

## Verification

- `node --check templates/harness-eval-gate.mjs` passed.
- `node templates/harness-eval-gate.mjs templates/harness-eval-result.json` passed.
- `bash tests/harness-eval-contract.test.sh` passed: 140 passed, 0 failed.
- `git diff --check` passed.
- `bash tests/run-all.sh` passed.
