# Role-separated loop vs single vs naive loop - case-015 LSP, bare codex, gpt-5.5 @ low

Same task, same wrapper (bare codex), same model+effort. The variable is the loop STRUCTURE.

- **single**: one build pass.
- **naive_loop**: build + 3 "review & improve" passes (from the sibling experiment, reused band).
- **role_loop**: build + **critic -> fixer -> verifier** (3 role passes, fresh context each):
  - **critic**: no src edits; re-reads the spec; writes spec-derived FAILING tests into
    `test/spec.gen.test.mjs`; logs defects to NOTES.md.
  - **fixer**: no test edits; makes the failing tests pass with the smallest change; no padding.
  - **verifier**: fixes residual failures/regressions; re-checks each required behavior.
- Yardstick is FIXED: every snapshot is scored on a throwaway copy whose `test/` dir is reset to the
  canonical visible + hidden tests, so the critic's generated tests cannot move the denominator OR the
  test_coverage basis. If the critic wrote WRONG tests and the fixer optimized to them, the canonical
  score would DROP - so Goodhart damage shows up honestly. Hidden tests never touch the live sandbox.
- n: single x1 (in-batch anchor) + role x2; naive band reused from
  `2026-06-07-codex-loop-vs-single-gpt55-low` (same day/setup). Directional.

## Result

| arm | checks (of 9) | quality | tokens | wall-clock |
|---|---|---|---|---|
| single (this batch) | 8 | 82 | 778k | 269 s |
| single (prior, n=3) | 6-7 (mean 6.67) | 79-81 | ~493k | ~181 s |
| naive_loop (prior, n=2) | 7 (both) | 81 | ~3.24M | ~991 s |
| **role_loop (n=2)** | **8-9 (mean 8.5)** | **82-85** | ~2.91M | ~811 s |

**role_loop is the first configuration in any of these experiments to (a) exceed 7/9 from a loop and
(b) reach a perfect 9/9.** It beats naive_loop on BOTH outcome (8.5 vs 7) AND cost (~0.9x tokens,
~0.82x wall-clock): same loop budget, spent on a sharp signal instead of aimless padding.

## Trajectory (checks/9 after each pass)

| seed | build | critic | fixer | verifier |
|---|---|---|---|---|
| s1 | 6 | 6 | **8** | 8 |
| s2 | 8 | 8 | **9** | 9 |

- **critic never changes the score** (it only writes failing tests, no src edits) - role discipline held.
- **the fixer is where the jump happens** (6->8, 8->9), driven by the critic's spec-derived tests.
- **verifier == fixer in both seeds** - the 3rd role pass added no score here (pure regression-guard).
  Implication: build + critic + fixer (3 passes) likely captures the gain at ~25% less cost.

## The headline finding: the ceiling was SIGNAL, not capability

`completion prefix + signatures` was missed by **every arm in every prior experiment** - all 5 CLIs,
every single run, every naive loop - which led to the earlier conclusion "this is a gpt-5.5-low ceiling,
raise effort." **That was wrong.** role_loop s2 cleared it and hit 9/9 at the *same* low effort. The
block was never capability; it was that no arm had a failing test telling it prefix-completion was
broken (the visible completion test only checks an empty-prefix position). The critic turned the prose
requirement into a failing test, and the fixer cleared it.

Per-seed hidden-test progress (canonical yardstick):

- s1: build misses {completion-prefix, local-scope, parser-recovery} -> fixer clears completion-prefix
  AND local-scope (8/9); parser-recovery still missed.
- s2: build misses {completion-prefix} -> fixer clears it -> **9/9, all hidden passed**.

No canonical regression at any pass (visible stayed 5/5 throughout) - the fixer optimizing to the
critic's tests did not break real behavior. No Goodhart damage observed (n=2).

## What this refines

The standing finding was "naive looping / extra machinery never beats a strong baseline; the lever is
reasoning effort." This holds for *naive* loops (plateau at 7) but **not** for a loop given an
independent, spec-derived signal:

- **Signal, not effort, was the missing lever here.** Role separation (an author-independent critic that
  writes failing tests from the prose) is exactly supergoal's "surface hidden requirements," made
  executable. It is the one move that beat the baseline ceiling at fixed effort.
- This is consistent with supergoal's thesis (the one place process beats a plain baseline is surfacing
  hidden requirements) and refines the blanket "loops don't help": *naive* loops don't; a
  critic->fixer loop does.

## Recommendation

To exceed the single-run ceiling **without raising reasoning effort**, use a **role-separated loop**:
an author-independent critic that writes spec-derived FAILING tests, then a fixer that makes them pass
with no padding. In this run it reached 8-9/9 (incl. a perfect 9/9) where naive looping plateaued at 7,
at slightly lower cost than the naive loop. Drop the verifier pass (or make it conditional on a fresh
red) to save ~25%; the critic+fixer pair carried the gain.

Cost honesty: role_loop is still ~4-6x a single run's tokens. Use it when correctness on
unspecified-in-tests behavior matters; for a quick pass a single run is far cheaper. Raising effort
remains an alternative lever - but this shows it is not the *only* one.

## Caveats

- n=2 role seeds, n=1 single anchor, one case -> **directional, not proven**. But both role seeds ended
  >=8, one hit 9/9 (unprecedented across all prior runs), and the critic->fixer mechanism is visible in
  both. This is the strongest positive signal in the series and warrants replication (more seeds + a
  second expert case) before updating the standing conclusion.
- An earlier attempt at this run stalled: the headroom proxy degraded (`failed to refresh available
  models`) and a pass hung ~19 min at 0% CPU. Killed it, confirmed the proxy recovered with a smoke
  test, lowered per-pass timeout to 8 min, and reran lean. The numbers above are from the clean rerun.

## Reproduce

```
cd docs/experiments/2026-06-07-codex-roleloop-vs-baseline-gpt55-low
SG_EVAL_SINGLE_SEEDS=1 SG_EVAL_NAIVE_SEEDS=0 SG_EVAL_ROLE_SEEDS=2 SG_EVAL_TIMEOUT_MS=480000 node run.mjs
# full 3-way: SG_EVAL_SINGLE_SEEDS=3 SG_EVAL_NAIVE_SEEDS=2 SG_EVAL_ROLE_SEEDS=3 node run.mjs
```
