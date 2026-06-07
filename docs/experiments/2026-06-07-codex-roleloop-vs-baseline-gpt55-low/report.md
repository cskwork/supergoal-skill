# HARNESS-EVAL: role-separated loop vs single vs naive loop (bare codex, gpt-5.5 @ low, case-015)

One task. Same model+effort. role_loop = build + critic(writes spec-derived failing tests) ->
fixer(makes them pass, no padding) -> verifier. Yardstick fixed to canonical tests on score-time
copies. n = 2 role / 1 single anchor; naive band reused from sibling experiment. Directional.

## Verdict

| arm | checks/9 | quality | tokens | wall-clock |
|---|---|---|---|---|
| single (anchor / prior n=3) | 8 / 6-7 (mean 6.67) | 82 / 79-81 | 778k / ~493k | 269s / ~181s |
| naive_loop (prior n=2) | 7 (both) | 81 | ~3.24M | ~991s |
| **role_loop (n=2)** | **8-9 (mean 8.5)** | **82-85** | **~2.91M** | **~811s** |

Trajectory: s1 `6 -> 6 -> 8 -> 8`, s2 `8 -> 8 -> 9 -> 9` (critic, then fixer carries the jump).

- **role_loop broke the ceiling** naive looping plateaued at (7/9), reaching 8-9/9 incl. a perfect 9/9
  - at slightly LOWER cost than the naive loop.
- **The previously universal-miss `completion prefix + signatures` fell** at the same low effort. So
  that block was a SIGNAL ceiling, not a capability/effort ceiling: gpt-5.5-low could do it once a
  spec-derived failing test pointed at it.
- **fixer does the work; critic enables it; verifier was redundant** here (== fixer both seeds) ->
  drop it to save ~25%.
- No Goodhart damage: visible stayed 5/5, hidden only rose (canonical yardstick).

## Decision

Answer to "improve in a loop without raising effort": **yes - with a role-separated loop**
(author-independent critic writes spec-derived FAILING tests, fixer clears them, no padding). It beat
both the single baseline and the naive loop here. The working lever was independent SIGNAL, not effort
or ceremony - which both confirms supergoal's "surface hidden requirements" and refines the blanket
"loops don't help" (naive don't; critic->fixer does). Directional (n=2, 1 case); replicate before
treating as proven. Cost stays ~4-6x a single run.

See `results.md` for per-pass hidden-test vectors, the proxy-stall incident, and full caveats.
