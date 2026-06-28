# WORKER_RESULT

## before_state

- Mode: LEGACY brownfield refactor.
- Public contract: `calculateInvoice(order)` remains exported from `src/order.mjs` and returns `{ subtotal, discount, tax, shipping, total }`.
- Source-characterized behavior before production edits:
  - `subtotal` is the indexed sum of `item.price * item.qty` over `order.items`.
  - Coupons: `SAVE10` gives 10%; `SAVE20` gives 20% when subtotal is at least 100 and 10% below 100; `HALF` gives 50% only for VIP orders; missing or unknown coupons give no coupon discount.
  - VIP orders receive at least a 5% discount when the coupon discount is lower.
  - Tax is calculated after discount: US 7%, EU 20%, every other region 10%.
  - Shipping is based on the discounted amount: below 50 costs 7.5, below 100 costs 3, otherwise 0; express shipping adds 12.
  - Monetary return values are rounded with `Math.round(amount * 100) / 100`.
- Baseline visible test command before any edit: `npm test`.
- Baseline result: exit 0, 5 tests passed, 0 failed.

## after_target

- Keep observable invoice behavior unchanged.
- Make `calculateInvoice` read as invoice steps: subtotal, coupon discount, VIP floor, taxable amount, tax, shipping, total, rounding.
- Keep helpers private to avoid expanding the public API.
- Add visible characterization coverage for uncovered current behavior branches before refactoring production code.

## command_manifest

- Visible test command: `npm test`, which runs `node --test` from `package.json`.
- No separate lint, typecheck, or build script exists in `package.json`.
- Gate sequence:
  - Run visible tests before edits.
  - Add characterization tests and run visible tests again before production edits.
  - Refactor `src/order.mjs` and run visible tests again.

## decision_gates

- Behavior-preservation gate: passed by original 5-test baseline, characterization 9-test run before production edit, and final 9-test run after refactor.
- Scope gate: changed only `src/order.mjs`, `test/order.visible.test.mjs`, and this report.
- API gate: preserved exported function name and return shape; new helpers are not exported.
- Simplicity gate: rejected changing subtotal calculation to `Array.prototype.reduce` because the original indexed loop is the source contract and has slightly different edge behavior for sparse arrays.
- Hidden-test gate: hidden tests were not read or run.
- Git gate: this assigned workdir is not a Git repository, so Git status/diff were not used as completion evidence.

## after_evidence

- Final command: `npm test`.
- Final result: exit 0.
- Final visible test summary: 9 tests, 9 pass, 0 fail.

## residual_risk

- Hidden tests may cover edge cases not visible in this workdir; they were not accessed.
- The refactor preserves the normal source-characterized behavior and public result shape, but stack traces for failures inside helper functions may differ because the implementation is now decomposed.

## files_changed

- `src/order.mjs`
- `test/order.visible.test.mjs`
- `WORKER_RESULT.md`

## commands_run

- `wc -l /private/tmp/supergoal-hardest-default-eval-20260628.4BbXHi/skill_refs/pre-default/SKILL.md`
- `sed -n '1,260p' /private/tmp/supergoal-hardest-default-eval-20260628.4BbXHi/skill_refs/pre-default/SKILL.md`
- `pwd`
- `rg --files`
- `ls`
- `sed -n '1,220p' package.json`
- `sed -n '1,260p' src/order.mjs`
- `sed -n '1,260p' test/order.visible.test.mjs`
- `npm test` -> exit 0, 5 pass, 0 fail
- `npm test` -> exit 0, 9 pass, 0 fail after characterization tests, before production refactor
- `npm test` -> exit 0, 9 pass, 0 fail after production refactor
- `git status --short` -> exit 128, not a Git repository
- `git diff -- src/order.mjs test/order.visible.test.mjs` -> exit 1, not used as repo evidence
- `sed -n '1,240p' src/order.mjs`
