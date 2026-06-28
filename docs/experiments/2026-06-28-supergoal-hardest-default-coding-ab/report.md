# Supergoal Hardest Default Coding A/B Eval

Date: 2026-06-28

## Decision

The HARNESS-EVAL default coding pair now points to the hardest existing runnable two-case set:

1. `revfactory-case-002-async-race/` - DEBUG/concurrency bug fix, hard, visible-pass hidden-fail starter.
2. `revfactory-case-003-refactoring/` - LEGACY/brownfield preservation refactor, hidden suite catches behavior drift.

`underspec-001-deepmerge/` and `underspec-002-csvline/` are explicitly excluded from the default because
they are latent-correctness probes, not the default coding difficulty.

## Before / After Selection

| Snapshot | Default coding pair | Tie rule | Evidence |
|---|---|---|---|
| pre-default worktree snapshot | Not defined; only runnable fixtures were listed | Not defined for the default pair | `/private/tmp/supergoal-hardest-default-eval-20260628.4BbXHi/skill_refs/pre-default/reference/harness-eval.md` |
| post-default worktree snapshot | `revfactory-case-002-async-race/` + `revfactory-case-003-refactoring/` | If both default cases tie, report `Not proven` and require authored expert runnable fixtures | `/private/tmp/supergoal-hardest-default-eval-20260628.4BbXHi/skill_refs/post-default/reference/harness-eval.md` |

Selection effect: proven. The post-change reference has an explicit default pair, excludes underspec
substitution, and records the tie ceiling.

## Actual Code Tasks

Workers used only visible-test sandboxes. Hidden tests were copied into separate scoring copies after
worker completion.

| Case | Arm | Worker visible result | Hidden-inclusive score | Raw log |
|---|---|---|---:|---|
| async race bug fix | pre-default | final visible `npm test` passed, 6/6 | 11/11 | `raw/async-race-pre-default-score.log` |
| async race bug fix | post-default | final visible `npm test` passed, 6/6 | 11/11 | `raw/async-race-post-default-score.log` |
| brownfield refactor | pre-default | final visible `npm test` passed, 9/9 | 18/18 | `raw/refactoring-pre-default-score.log` |
| brownfield refactor | post-default | final visible `npm test` passed, 8/8 | 17/17 | `raw/refactoring-post-default-score.log` |

Worker proof ledgers:

- `workers/async-race-pre-default-WORKER_RESULT.md`
- `workers/async-race-post-default-WORKER_RESULT.md`
- `workers/refactoring-pre-default-WORKER_RESULT.md`
- `workers/refactoring-post-default-WORKER_RESULT.md`

## Claim Status

- Proven: the default coding HARNESS-EVAL selection is harder and more measurable than the pre-change
  implicit default because it now names two runnable real-code tasks and blocks underspec substitution.
- Not proven: the new default-selection text improves actual code-task correctness. Both before and after
  skill refs passed all hidden-inclusive scoring checks on the two selected tasks.
- No regression observed: the post-default arms passed the same hidden acceptance surface as the
  pre-default arms.

## Verification

- `bash tests/harness-eval-contract.test.sh` passed: 170 passed, 0 failed.
- `node templates/harness-eval-gate.mjs templates/harness-eval-result.json` passed.
- `git diff --check` passed.
- Async starter discrimination check: original fixture failed 3 hidden tests while visible tests passed.
- Refactor starter preservation check: original fixture passed 14/14 visible + hidden tests before refactor.
