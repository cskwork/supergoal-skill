# Private Codebase Comparison Benchmark

This report is evidence for `/supergoal`. It is not part of the skill runtime
contract.

## Question

Does `/supergoal` improve difficult coding-task outcomes against plain Codex CLI
and Codex Goal mode?

## Setup

- Same prompt across all three arms.
- Same hidden scorer across all three arms.
- Same isolated tracked-file copy of a private production-scale Java service.
- No proprietary code, project names, local private paths, or business details
  are included here.
- Task required cross-layer backend diagnosis: SQL mapper ordering,
  latest-row selection, service-layer request-context preservation and fallback,
  and focused regression tests.

## Results

| Arm | Hidden checks | Verification | Token signal | Outcome |
|---|---:|---|---:|---|
| Plain Codex CLI | Failed | No solution diff; no final output | Not reported | No usable result |
| `/supergoal` | Passed all | Focused regressions green; neighbor checks green; `git diff --check` green; delivery gate green | 378,468 | Best result |
| Codex Goal mode | Failed 1 check | Focused regressions green; `git diff --check` green | 165,336 CLI + 130,543 internal | Partial result |

## Hidden Checks

- Formatting clean: `git diff --check`.
- Deterministic latest-row ordering in the mapper layer.
- Request-context preservation in all targeted service entry points.
- Latest-row selection covered by focused tests.
- Request-context fallback and preservation covered by focused tests.
- Non-empty solution diff.

## Raw Result Summary

- Plain Codex CLI: failed because it produced no usable diff or final answer.
- `/supergoal`: passed every hidden check.
- Codex Goal mode: fixed the main code path but missed one required
  fallback/preservation test-coverage check.

## Full-Suite Note

Both solved arms also probed a broad Gradle suite. The broad suite failed on
pre-existing fixture/config/context failures outside the changed surface, so the
score used focused checks plus the shared hidden scorer.

- `/supergoal`: `352 tests completed, 47 failed, 3 skipped`.
- Codex Goal mode: `342 tests completed, 47 failed, 3 skipped`.

## What This Proves

On this harder private-codebase task, `/supergoal` produced the only complete
answer. The difference was not just code generation; the delivery gate, review
loop, and hidden-check discipline caught coverage and completion gaps that the
other arms missed.

## Limits

- Single benchmark, not a universal claim.
- Private source is intentionally excluded.
- Broad-suite noise was separated from task-specific proof.
