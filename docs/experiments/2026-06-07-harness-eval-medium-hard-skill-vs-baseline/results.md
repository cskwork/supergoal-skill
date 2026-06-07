# Harness eval: supergoal skill vs plain baseline — medium, hard, expert

Question: does the supergoal skill beat a no-skill baseline? Measured with vs without the
skill on the same fixtures, scored on ground truth (`node --test` on the real source +
injected hidden tests), label-blind (machine scorer).

Three regimes, drawn from the RevFactory corpus:

| regime | case | tier | baseline | harness | quality b/h | harness cost vs baseline | crash | winner |
|---|---|---|---|---|---|---|---|---|
| codex gpt-5.5 @ low | case-003 refactoring | medium | 14/14 (n=2) | 14/14 (n=2) | 80 / 80 | **4.7x tokens, 9x time** (4-pass role-loop) | no | tie — harness costlier |
| codex gpt-5.5 @ low | case-002 async-race | hard | 8/8 (n=2) | 8/8 (n=2) | 85 / 83 | **2.1x tokens, 2.2x time** (4-pass role-loop) | no | tie — harness costlier |
| codex spark @ high | case-015 LSP | expert | 11/12 (n=1) | 11/12 (n=1) | 85 / 85 | **0.66x tokens, 0.69x time** (1-pass skill-ref) | no | tie — harness ~30% cheaper |

Claim status: **Not proven** (no machine-check win, no quality win, in any regime).

## What each regime showed

- **Medium / hard @ gpt-5.5 low — ceiling.** gpt-5.5 already solves both cleanly without
  help. case-002's hidden tests target the real traps (different keys must stay concurrent;
  all concurrent callers must reject on a shared failed load) and the baseline passed every
  one. The skill's role-separated loop reached the identical result for 2-5x the cost. No
  false-GREEN either arm.
- **Expert @ spark high — still a tie, but the skill pays for itself.** A weaker model on a
  harder case finally left a gap: both arms miss the same hidden requirement (parser error
  recovery that still reports semantic diagnostics) — 11/12 each, quality 85 each. The skill
  did not close that gap. What it did: the single-pass skill-ref arm reached the same outcome
  for ~34% fewer tokens and ~30% less wall-clock, and did **not** crash — the high-effort
  context-window crash documented for the pre-INLINE skill (harness log 191-267 lines, leaked
  eval yaml, repeated full rewrites) did not recur (clean 110-line log).

## Read

The supergoal skill **does not improve correctness or quality over a capable baseline on
explicit-spec tasks** — every cell is a tie, across medium, hard, and expert. This matches the
repo's standing thesis (baseline-first; harness never beats a strong baseline on explicit-spec
work). Where it adds value is narrower and real:

1. **Crash-proofing at high reasoning effort.** The INLINE discipline keeps the agent from
   binge-loading the skill tree and looping a self-verifier into a context-window crash. The
   one prior regime where the harness "won" was really the fixed skill not crashing vs the old
   skill crashing — an intra-harness fix, confirmed clean here.
2. **Cost discipline in single-pass form.** As a skill reference (not the multi-pass loop), it
   trims ~30% off a weaker/high-effort model for the same result.

The cost direction flips across rows because the **harness design differs**, not only the
regime: the low-effort rows ran the skill's now-default **role-separated loop (4 codex passes)**,
which is inherently 2-5x; the spark-high row ran the **single-pass skill-ref** arm (1 pass) for
comparability with the prior case-015 runs. So: the 4-pass loop buys no correctness on
explicit-spec tasks and costs multiples; the 1-pass skill-ref ties and can be cheaper.

## Caveats

- Small n (low-effort n=2/arm; spark-high n=1/arm). Directional, not a general percentage.
- Two harness designs across regimes (role-loop vs skill-ref) — cost is not apples-to-apples
  between the low and high rows; correctness/quality (all ties) is.
- All three are explicit-spec tasks (the requirements are in the prompt). The skill's critic
  step is built to surface *hidden* requirements; on fully-specified tasks there is little
  hidden to surface, which is exactly where a baseline already wins. A genuinely
  under-specified task is the untested regime where the critic could plausibly separate.
- spark-high used a single-pass skill-ref arm, so the critic that might have caught the missing
  parser-recovery behavior never ran. Role-loop @ spark-high is the natural follow-up.

## Reproduce

- Low-effort matrix: `2026-06-07-harness-eval-medium-hard-skill-vs-baseline/orchestrate.sh`
  (`run.mjs`, `SG_EVAL_CASE=002|003`). Fixtures + hidden tests embedded in `run.mjs`; validate
  with `SG_EVAL_VALIDATE=1 SG_EVAL_CASE=00x node run.mjs`. Results: `result-002.json`,
  `result-003.json`.
- Expert spark-high: `2026-06-07-harness-eval-015-lsp-spark-high/orchestrate.sh`. Result:
  `result.json`. Skill ref stripped to `SKILL.md + README + reference + agents` (no `templates/`)
  to remove the high-effort wander/crash trigger.
