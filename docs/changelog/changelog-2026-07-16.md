# Changelog 2026-07-16

## Regression-reconciliation A/B: first fixture deleted as non-discriminating

**Change**: deleted the `sideeffect-004-shared-format` fixture and the inconclusive A/B run
artifacts (results/summary/manifest/report) from
`docs/experiments/2026-07-15-regression-reconcile-ab/`. Kept `driver.mjs` (the parameterized
old-vs-new-vs-bare A/B harness) for reuse with a harder fixture.

- Why deleted: the fixture could not produce a meaningful result. It variant-validated
  (starter fails / naive-shared-edit false-GREENs / scoped fix passes), but in live runs at
  gpt-5.5-low all 18 units - old skill, new skill, AND the bare no-skill control - made the scoped
  fix and left the shared helper untouched. The fixture was too small (5 files, direct-import
  consumers, a telegraphing comment) to reproduce the target failure mode (a diff outgrowing the
  plan across files/iterations), so it discriminated nothing.
- Kept: the `8c01712` rules change (contract-test-backed, not under question) and `driver.mjs`.
- Next: a harder fixture that reproduces the failure mode - larger surface, consumers coupled
  through indirection (registry / serialized contract / re-export barrel) so a grep of the changed
  symbol misses them, no telegraphing. Design fork pending user direction (synthetic-large vs real
  external benchmark vs staged).
