# Looped self-improvement vs single run - case-015 LSP, bare codex, gpt-5.5 @ low

Same task, same wrapper (bare codex), same model+effort. The only variable is **how many
fresh-context passes** run over the one task.

- **single**: bare codex, ONE build pass on the task.
- **loop**: same build pass, then **3 fresh-context review/verify/improve passes** - each a new
  `codex exec` that reads the current files on disk (no shared context), is told to review against the
  task + visible tests, fix gaps/bugs, and re-run `npm test`.
- Same case-015 fixture + hidden tests + v2 scorer as the 5-CLI eval. **Yardstick is fixed**: every
  snapshot is scored on a throwaway COPY with the *canonical* visible+hidden tests restored, so a loop
  pass that edits/adds tests cannot move the denominator (an early run showed a loop padding the visible
  suite to fake 10/9 - hence this guard). Hidden tests are never in the live sandbox.
- n: single x3 seeds (baseline band), loop x2 seeds (each build + 3 loops). Score snapshotted after
  every pass for the trajectory.

## Result

| arm | checks (of 9) | quality | tokens | wall-clock |
|---|---|---|---|---|
| single (1 pass) | 6-7 (mean **6.67**) | 79-81 | ~493k | ~181 s |
| loop (build + 3 improve) | **7-7 (mean 7.0)** | 81 | **~3.24M** | **~991 s** |

**Loop costs ~6.6x the tokens and ~5.5x the wall-clock of a single run, and lands at 7/9 - the same
place a single run already reaches on a median draw.**

## Improvement trajectory (checks/9 after each pass)

| seed | build | loop1 | loop2 | loop3 |
|---|---|---|---|---|
| s1 | 6 | **7** | 7 | 7 |
| s2 | 7 | 7 | 7 | 7 |

Source lines kept growing while the score did not: s1 331 -> 360 -> 390 -> 414; s2 395 -> 467 -> 476 ->
443. The loops add code; they do not add correctness.

## What looping did and did not do

- **It did NOT exceed the single-run ceiling.** Both loop seeds finished at 7/9 = the top of the single
  band. No loop ever reached 8/9.
- **The first loop only recovered a below-median build** (s1: 6 -> 7). Where the build already hit the
  median (s2: 7), all three loops added nothing.
- **Loops 2 and 3 are pure waste** - flat checks and quality, only more source lines.
- **No pass ever cleared `completion prefix + signatures`** - failed by every single AND every loop
  snapshot. That requirement is the gpt-5.5-low ceiling; re-running the same model at the same effort
  cannot break its own ceiling, it only reshuffles/pads. (Loop finals also still miss `parser
  recovery`.)
- **Mild upside: variance reduction.** single drew 6-7 here (6-8 in an earlier run); loop stabilized at
  7 both times by pulling a bad draft up to the median. But that is the *only* benefit, and it is far
  cheaper bought another way (see below).

## Recommendation

For a hard, explicitly-specified task at gpt-5.5/low, **3-loop self-improvement is not worth it**: it
returns the same 7/9 as a single run at ~6.6x tokens / ~5.5x wall-clock. Its lone benefit - rescuing a
below-median first draft - is bought more cheaply by simply re-rolling a single run (two single runs
average ~1M tokens, still a third of one loop run's ~3.2M, and already produced a 7/9). 

If you need to break **above** 7/9, the lever is **reasoning effort**, not loop count: iterating the
same model at the same effort plateaus at that model's ceiling. (The prior `gpt-5.3-codex-spark` at
*high* effort reached 8/9 in a single pass.)

This matches the 5-CLI result and the standing baseline-first finding: added machinery (more CLIs, rule
packs, skills, or now improvement loops) does not beat a strong baseline on a spec-complete task; it
adds cost. Use one good pass; spend the budget on effort, not iteration.

## Caveats

- n=2 loop seeds, n=3 single seeds, one case -> **directional, not proven**. But the trajectory signal
  (flat after loop1, never above the band, ceiling test never cleared) is consistent across both loop
  seeds and matches every prior eval on this case.
- "loop" here is naive re-prompting of the same model/effort with no external oracle (hidden tests are
  withheld, as in reality). A loop given a *stronger* verifier or *higher* effort on the review pass is a
  different experiment.

## Reproduce

```
cd docs/experiments/2026-06-07-codex-loop-vs-single-gpt55-low
node run.mjs
# tune: SG_EVAL_LOOPS=3 SG_EVAL_SINGLE_SEEDS=3 SG_EVAL_LOOP_SEEDS=2 node run.mjs
```
