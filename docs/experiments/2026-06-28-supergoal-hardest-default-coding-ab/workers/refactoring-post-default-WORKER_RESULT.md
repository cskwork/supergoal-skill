# WORKER_RESULT

## before_state

- Mode: LEGACY / brownfield refactor.
- Visible baseline command: `npm test`.
- Baseline result: pass, 5/5 tests.
- Source-defined behavior to preserve:
  - `subtotal` is the sum of each item's `price * qty`.
  - `SAVE10` discounts 10% of subtotal.
  - `SAVE20` discounts 20% when subtotal is at least 100, otherwise 10%.
  - `HALF` discounts 50% only when `vip` is truthy.
  - VIP orders receive at least a 5% discount.
  - US tax is 7%, EU tax is 20%, every other region is 10%, all on discounted subtotal.
  - Shipping is 7.5 below 50 discounted subtotal, 3 below 100, otherwise 0; express adds 12.
  - Returned fields are `subtotal`, `discount`, `tax`, `shipping`, `total`, each rounded to two decimals.

## after_target

- `calculateInvoice` remains the public export and returns the same object shape.
- Behavior above remains observable through visible tests and added characterization tests.
- Implementation is clearer by separating subtotal, discount, tax, shipping, and rounding concerns.
- No intentional behavior drift.

## command_manifest

| Name | Command | Source | Proves | Used when |
|---|---|---|---|---|
| visible tests | `npm test` | frozen_repo | Runs the workdir's visible Node test suite. | before / after |

## decision_gates

| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | no-op | resolved | Hidden tests are unavailable by design. | Preserve source-defined behavior rather than infer new product rules. | `npm test` |

## after_evidence

- Characterization run before implementation refactor: `npm test` passed, 8/8 tests. This proves the added visible tests describe existing behavior.
- Final verification run after implementation, test, and changelog edits: `npm test` passed, 8/8 tests.
- Final TAP summary:
  - `# tests 8`
  - `# pass 8`
  - `# fail 0`

## residual_risk

- Hidden tests are not visible and were not run directly.
- The test suite proves representative public behavior, but does not exhaustively prove every malformed input edge.

## files_changed

- `src/order.mjs`
- `test/order.visible.test.mjs`
- `docs/changelog/changelog-2026-06-28.md`
- `WORKER_RESULT.md`

## commands_run

- `npm test` -> pass, 5/5 tests before edits.
- `npm test` -> pass, 8/8 tests after adding characterization tests and before implementation refactor.
- `npm test` -> pass, 8/8 tests after implementation refactor.
- `npm test` -> pass, 8/8 tests after implementation, test, and changelog edits.
