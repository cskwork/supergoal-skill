# HARNESS-EVAL: looped improvement vs single run (bare codex, gpt-5.5 @ low, case-015)

One task. single = run once. loop = build + 3 fresh-context review/verify/improve passes on the same
code. Same fixture + hidden tests + scorer; yardstick fixed (canonical tests restored at score time so a
loop can't change the denominator). n = 3 single / 2 loop seeds -> directional.

## Verdict

| arm | checks/9 | quality | tokens | wall-clock |
|---|---|---|---|---|
| single (1 pass) | 6-7 (mean 6.67) | 79-81 | ~493k | ~181 s |
| loop (build+3) | 7 (both seeds) | 81 | ~3.24M (**6.6x**) | ~991 s (**5.5x**) |

Trajectory (checks/9): s1 `6 -> 7 -> 7 -> 7`, s2 `7 -> 7 -> 7 -> 7`.

- **Looping does not beat the single-run ceiling.** Both loop seeds end at 7/9 - the top of the single
  band - at ~6.6x tokens / ~5.5x time.
- **Only the first loop helped, and only by rescuing a bad draft (6 -> 7).** Loops 2-3 added source lines
  but zero score.
- **No pass ever cleared `completion prefix + signatures`** - a gpt-5.5-low ceiling. Re-running the same
  model at the same effort can't break its own ceiling.

## Decision

Not worth it for this task class. 3-loop self-improvement returns the same 7/9 as one run at 5-7x the
cost; its only benefit (variance reduction) is cheaper bought by re-rolling a single run. To exceed 7/9,
raise reasoning effort, not loop count. Corroborates baseline-first. Directional (small n).

See `results.md` for the full trajectory, hidden-fail vectors, and signal-vs-noise.
