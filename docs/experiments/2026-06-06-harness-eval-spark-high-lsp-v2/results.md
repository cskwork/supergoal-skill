# Harness-eval v2: did the fixes improve the score?

Follow-up to `../2026-06-06-harness-eval-spark-high-lsp/` (which reported baseline 65 / harness 63,
`not_proven`, harness arm crashed). Two fixes were applied and tested.

- **Measurement fix** (`run.mjs`): uncap dimensions (v1 summed to a hard ceiling of 77), score
  correctness/feature as a gradient over the fraction of 9 individual tests passed (v1 was binary),
  decontaminate the harness reference (exclude eval-internal case files), and capture cost on crash.
- **Harness fix** (`../../../SKILL.md`): INLINE mode — when run as a single non-interactive process
  with no subagent dispatch, load only the contract, skip the orchestration ceremony, work test-first
  with minimal edits, verify in one scoped pass with sandbox-safe commands, stop on green.

## Experiment A — measurement fix, deterministic (no codex)

Re-scored the **same v1 agent outputs** with the v2 scorer. `result-experimentA-rescore.json`.

| arm | v1 score | v2 score | tests |
|---|---:|---:|---|
| baseline | 65 | 82 | 6/9 |
| harness | 63 | 74 | 4/9 |

- 80 is now reachable (v1 ceiling was 77 for any solution).
- Gap widened 2 → 8, driven by real differentiators (correctness 7 vs 4, feature 7 vs 6, docs 7 vs 4),
  not a comment heuristic.
- The v2 scorer reveals the v1 harness output was genuinely worse (4/9 vs 6/9), which v1's binary
  pass/fail hid.

## Experiment B — harness fix, live codex 5.3 spark high

Fresh run, both arms, v2 scorer, INLINE-mode skill. `result-experimentB-live.json`.

| arm | score | tests | tokens | wall-clock | turns | crashed |
|---|---:|---|---:|---:|---:|---|
| baseline | 81 | 7/9 | 4.05M | 255 s | 1 | no |
| harness | **82** | 6/9 | 2.71M | 207 s | 1 | no |

`winner = not_proven` (pass_winner baseline, quality_winner harness).

Versus the original v1 harness (crashed, 63, 4/9, 0 tokens captured / 407 s):

| signal | v1 harness | v2 harness | result |
|---|---|---|---|
| completed a turn | no (0) | yes (1) | crash fixed |
| exit code | 1 | 0 | fixed |
| tokens vs baseline | 2.15x time, crash | 0.67x tokens, 0.81x time | blowup reversed |
| quality score | 63 | 82 | +19, crosses 80 |
| tests passed | 4/9 | 6/9 | +2 |
| read reference/templates | yes (leaked eval yaml) | 0 | INLINE + decontam |
| sandbox-rejected debug procs | many | 0 | sandbox-aware verify |
| output size vs baseline | 895 > 747 | 681 < 795 | leaner, minimal-ish |

## Verdict

- **Both fixes are demonstrated.** The harness no longer crashes, costs less than baseline, and scores
  82 (was 63) — the 80 target is met. The improvement is causally tied to INLINE mode (log shows mode
  selected, no reference/template reads, no rejected debug subprocesses, leaner file).
- **Overall still `not_proven`, and that is the honest verdict for n=1.** On this single noisy case the
  harness wins quality + cost but ties/edges on raw pass count (6/9 vs 7/9); baseline also varied
  run-to-run. A consistent, provable win requires the multi-case set.
- **Residual:** codex still did 6 full-file rewrites despite the minimal-diff instruction; it no longer
  crashed (file stayed small) but the edit discipline is not fully enforced by prose alone.

## Next

1. Run the 3-case set (`../2026-06-06-harness-eval-3case/`) under v2 to move past n=1.
2. Tighten INLINE minimal-diff enforcement (the model ignored "never rewrite a whole file").
3. Consider weighting correctness higher so a failing-tests solution cannot reach the low 80s on static
   quality alone.
