# Delivery Proof

## Eval Intent

- Goal: Fix `AsyncCache.get(key, loader)` so concurrent same-key calls share one in-flight load.
- Constraints: Keep public API unchanged: `AsyncCache`, `get(key, loader)`, `has(key)`, `clear()`. Dependency-free. Edit only work/output dirs. Do not inspect hidden tests or sibling arms.
- Tradeoffs: Track pending loads separately from resolved values so `has()` continues to mean "resolved value is cached".
- Rejected approaches: Cache raw promises in `values`, because it would make `has()` true before a resolved value exists and would risk keeping rejected promises cached.

## Before State

- Mode: DEBUG
- Proof: Same-key concurrent `get()` calls start one loader per caller before the first loader resolves.
- Command or artifact: `node --input-type=module -e '<same-key concurrent repro>'`
- What this proves: Current code violates the same-key in-flight sharing requirement. Observed failure: `3 !== 1` loader calls.
- What this does not prove: It does not prove all adjacent cache behavior; `npm test` separately showed existing visible sequential/cache/clear/distinct-key tests pass before the fix.

## After Target

- Expected behavior: Same-key concurrent gets invoke `loader` exactly once and every caller resolves to the same value.
- Compatibility to preserve: Different keys load independently; rejected loader is not cached and later calls retry; resolved values, `has()`, and `clear()` continue to work.
- Intentional drift: Only duplicate same-key pending loads are coalesced.

## Command Manifest

| Name | Command | Source | Proves | Used when |
|---|---|---|---|---|
| same-key repro | `node --input-type=module -e '<same-key concurrent repro>'` | evaluator_owned | Missing in-flight sharing before fix | before |
| npm test | `npm test` | frozen_repo | Repo-visible cache behavior and added regression coverage | before / after |

## Decision Gates

| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | auto-fix | resolved | Duplicate same-key pending loads happen because only resolved values are memoized. | Add an internal pending-load map, clear it on settle, and leave public API unchanged. | `npm test` |
| d2 | no-op | resolved | `has()` should not expose pending loads as cached values. | Keep `has()` backed only by resolved values. | Added regression tests |

## After Evidence

| Check | Status | Evidence | Verifies | Does not verify |
|---|---|---|---|---|
| npm test | pass | `1..8`, `# pass 8`, `# fail 0`, `# duration_ms 69.617458` | Same-key coalescing, different-key concurrency, rejection retry, pending `has()`, pending `clear()`, and existing cache behavior. | Hidden tests are unavailable by instruction. |

## Residual Risk

- Not proven: Hidden tests are unavailable and were not inspected.
- Follow-up: None expected if repo tests pass.
