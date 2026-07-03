# Harness Eval Report

## Summary

Cases:
Runtime adapter:
Case templates:
Pass winner:
Quality winner:
Overall winner:
Claim status:

## Four-Axis Metrics

| Axis | Metric | Baseline | Harness | Delta | Source / reason |
|---|---|---:|---:|---:|---|
| Correctness |  |  |  |  |  |
| Token/cost |  |  |  |  |  |
| Wall-clock speed |  |  |  |  |  |
| Routing accuracy |  |  |  |  |  |

## Routing Accuracy

| Prompt set | Count | Trials/prompt | Split | Should-trigger rate | Should-not-trigger rate | Held-out accuracy | Near-miss failures |
|---|---:|---:|---|---:|---:|---:|---|

Use at least 20 should-trigger / should-not-trigger near-miss prompts, 3 trials each, and select on the
40% held-out split. If routing is not applicable, state why.

## Case Selection

Default coding A/B pair:

1. `revfactory-case-002-async-race/` (`revfactory-case-002-bug-fix.yaml`) - DEBUG/concurrency.
2. `revfactory-case-003-refactoring/` (`revfactory-case-003-refactoring.yaml`) - LEGACY/brownfield
   preservation.

Do not substitute `underspec-001-deepmerge/` or `underspec-002-csvline/` for this default. If both
default cases tie, report `Not proven`, record the runnable-corpus ceiling, and require authored expert
runnable fixtures before claiming a stronger harness win.

## Eval Intent

Goal:
Constraints:
Tradeoffs:
Rejected approaches:

## Command Manifest

| Command | Source | Used by | Verifies |
|---|---|---|---|

## Verification (harness-native + ground truth)

| Case | Harness verified natively? | Native verifier checks (if any) | Hidden-check REDs | REDs fixed | Visible-only false-GREEN? |
|---|---|---:|---:|---:|---|

Notes: ground truth for BOTH arms is Machine Checks + hidden tests below; the eval does not impose a
verifier/repair loop. For hard cases, `None`/`visible tests only` self-verification still requires the arm
to pass the hidden checks - otherwise `Not proven`.

## Machine Checks

| Case | Run | Check | Status | Evidence |
|---|---|---|---|---|

## Evidence Bundle

| Case | Run | Check | Verifies | Does not verify | Confidence | Artifact |
|---|---|---|---|---|---|---|

## Trajectory Telemetry

| Case | Run | Artifact root | Logs | Commands | Edited files | Turns | Exit | Crash/context |
|---|---|---|---|---|---|---:|---:|---|

## Decision Gates

| ID | Action | Status | Description | Human decision | Recheck |
|---|---|---|---|---|---|

Actions: `auto-fix`, `no-op`, or `ask-user`. A `proven` claim cannot leave `ask-user` unresolved.

## Adapter Fixture Replay

| Status | Adapter event schema | Fixtures | Redaction | Replay command |
|---|---|---|---|---|

Reusable harness claims need recorded, scrubbed fixtures or an explicit `Not proven` reason.

## Quality Score

RevFactory-style scoring: 10 dimensions, each 0-10, total 100.

| Case | Run | Total | Feature | Tests | Code | Errors | Efficiency | Correctness | Architecture | Extensibility | Docs | Dev Env |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|

Anchors:
- No tests caps `test_coverage` at 3 unless evaluator-only hidden tests are the only tests.
- Single-file monolith caps `architecture` at 4 when the task requires multiple modules.
- Missing major requested features caps `feature_completeness` at 7.
- Failing hidden or machine checks cap `correctness` at 6 unless the failure is explicitly outside scope.

## Bug-Catch Matrix

| Case | Run | Planted/hidden bugs caught | Bugs still shipped | Extra real bugs found | False GREEN? |
|---|---|---:|---:|---:|---|

## Regression Protection

| Case | Run | Fixed REDs | Permanent regression tests | Exception |
|---|---|---:|---:|---|

## Blind Grading

| Case | A | B | Winner | Confidence |
|---|---|---|---|---|

## Statistics

| Method | Inputs | Result | Decision |
|---|---|---|---|
| Sign-flip + BCa | gradient score deltas |  |  |
| McNemar | discordant binary pass/fail pairs after SNR filter |  |  |

Record `discordant_baseline_only`, `discordant_harness_only`, exact two-sided `p`, matched pairs removed
by the SNR filter, and the per-seed vector. Do not use overlapping confidence intervals as the winner gate.

## Cost

| Case | Baseline tokens/time/tool calls | Harness tokens/time/tool calls | Tradeoff |
|---|---|---|---|

## Harness Mutation Contract

| Status | Intended delta | Safety envelope | Rollback | Proof command | Rejected alternatives |
|---|---|---|---|---|---|

## Surface Sync

| Changed surfaces | Proof commands |
|---|---|

## Not Proven

List any reason the harness improvement claim is not proven yet: weak sample size, missing blind grading, different repo snapshot, missing machine checks, quality score tie/loss, or cost overhead larger than quality gain.

## Decision

Use one:

- Adopt harness
- Revise harness
- Reject harness
- Not proven
