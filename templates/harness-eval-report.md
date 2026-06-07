# Harness Eval Report

## Summary

Cases:
Runtime adapter:
Case templates:
Pass winner:
Quality winner:
Overall winner:
Claim status:

## Verification (harness-native + ground truth)

| Case | Harness verified natively? | Native verifier checks (if any) | Hidden-check REDs | REDs fixed | Visible-only false-GREEN? |
|---|---|---:|---:|---:|---|

Notes: ground truth for BOTH arms is Machine Checks + hidden tests below; the eval does not impose a
verifier/repair loop. For hard cases, `None`/`visible tests only` self-verification still requires the arm
to pass the hidden checks - otherwise `Not proven`.

## Machine Checks

| Case | Run | Check | Status | Evidence |
|---|---|---|---|---|

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

## Cost

| Case | Baseline tokens/time/tool calls | Harness tokens/time/tool calls | Tradeoff |
|---|---|---|---|

## Not Proven

List any reason the harness improvement claim is not proven yet: weak sample size, missing blind grading, different repo snapshot, missing machine checks, quality score tie/loss, or cost overhead larger than quality gain.

## Decision

Use one:

- Adopt harness
- Revise harness
- Reject harness
- Not proven
