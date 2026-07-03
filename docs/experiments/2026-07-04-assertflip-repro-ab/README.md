# AssertFlip Repro A/B Scaffold

Status: RUN 2026-07-04 (Haiku, n=64). Result: null / unproven — ceiling tie on stratum-i
(valid_repro A 24/24 = B 24/24); stratum-ii uninformative (grader requires assertion-red but
crash bugs throw). See `report.md` for the full verdict, mechanism, and the grader crash-bug
limitation. Change ① stays uncommitted (PRD §6 Phase-2 gate not passed).

This experiment measures whether DEBUG step 1's assert-current-then-invert method helps weak models
construct valid bug repros. It does not prove skill lift until the paired A/B protocol is run and
machine-graded.

## Arms

- Arm A: `reference/debugging.md` step 1 with assert-current-then-invert.
- Arm B: shipped baseline wording: "create a deterministic failing test."

Use the same fixture and seed for both arms. The model should be weak/non-ceilinged, because strong
models often write direct failing tests well enough for a tie.

## Protocol

- Stratified fixtures: 6 invertible wrong-value bugs in `fixtures/stratum-i/`; 2 crash/exception
  negative controls in `fixtures/stratum-ii/`.
- Paired runs: same seed, same fixture, A vs B.
- Machine grading only: no LLM judgment in the grader.
- Valid repro: the candidate repro fails on buggy HEAD, passes after the candidate fix, and the HEAD
  failure is an assertion failure rather than import, collection, syntax, or setup failure.
- Resolved rate: the candidate fix passes the hidden spec oracle generated from `hidden-spec.json`.
- Decision gate from the PRD: stratum i needs a positive paired signal with BCa CI excluding 0 and
  sign-flip permutation p < 0.05; stratum ii must show no regression beyond noise.

## Grader

Invoke the grader for one candidate attempt:

```sh
node docs/experiments/2026-07-04-assertflip-repro-ab/grade.mjs \
  --fixture stratum-i/normalize-score \
  --test /path/to/candidate/repro.test.mjs \
  --fix-src /path/to/candidate/src
```

`--fix-src` may be a directory to overlay onto fixture `src/`, or a single fixed module file to copy
over the fixture entry module.

List fixtures:

```sh
node docs/experiments/2026-07-04-assertflip-repro-ab/grade.mjs --list
```

## Fixtures

### Stratum I: assertable wrong value

- `normalize-score`: scores round but are not clamped to 0..100.
- `business-hours`: closing hour is treated as inclusive instead of exclusive.
- `coupon-total`: VIP coupon uses a 10 percent discount instead of 15 percent.
- `retry-delay`: retry attempt numbering starts at zero instead of one.
- `average-rating`: missing ratings are counted as zero instead of ignored.
- `priority-rank`: unknown priorities return rank 0 instead of the lowest rank.

### Stratum II: crash/exception negative control

- `config-port`: missing nested config crashes instead of using the default port.
- `user-label`: missing profile data crashes instead of producing `Anonymous`.

