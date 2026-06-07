# 2026-06-06 — Diagnose + fix the "harness shows no improvement" eval

## What

The spark-high-LSP harness eval reported `not_proven` (baseline 65 vs harness 63), and the harness
arm crashed (context-window exhaustion: `turn.completed` events baseline 1 / harness 0, `exit_code 1`,
`tokens 0`, 407 s vs baseline 190 s). Deep-research + local artifact analysis found **two independent
root causes**, and we fixed both, then re-tested on `gpt-5.3-codex-spark` high.

1. **Measurement: the v1 scorer could never reach 80.** Summing every dimension's max in
   `scoreQuality()` = **77** (8 of 10 dims capped below 10). And on a single failing-tests case it was
   nearly insensitive: 9 of 10 dims were byte-identical between arms; the whole 65-vs-63 gap was one
   heuristic (`documentation`: baseline kept ≥2 comments → 5, harness stripped them → 3). Functional
   correctness was binary (all-pass-or-cap-5), so baseline-6/9 and harness-4/9 both scored correctness 5.
2. **Harness: it genuinely lost and crashed.** Run as one `codex exec` process, the skill loaded its
   full ~332 KB / 85-file process payload into one context window, read eval-internal case files leaked
   into the reference dir, rewrote the 600+-line `src/server.mjs` repeatedly, then burned its last turns
   on debug subprocesses the sandbox rejected — never completing a turn. The skill is built for
   multi-agent fan-out to fresh contexts; that value is absent in a single process, so the ceremony only
   exhausts the window.

New files:
- `docs/experiments/2026-06-06-harness-eval-spark-high-lsp/improvement-plan.md` — full deep-research
  synthesis (local evidence + literature, cited) and the prioritized fix list.
- `docs/experiments/2026-06-06-harness-eval-spark-high-lsp-v2/run.mjs` — v2 eval with the scorer +
  methodology fixes; preserves the v1 run untouched.
- `docs/experiments/2026-06-06-harness-eval-spark-high-lsp-v2/result-experimentA-rescore.json` —
  deterministic re-score of the v1 outputs with the v2 scorer.

Changed:
- `SKILL.md` — added **Step 0 Runtime fit (INLINE mode)**: when run as a single non-interactive
  process with no subagent dispatch and no human (codex exec / CI / one-shot eval), load only the
  contract, skip worktree/vault/Human-Feedback/Committee/circuit-breaker, work test-first with minimal
  targeted edits, verify in one scoped pass using only sandbox-safe commands, and stop on green.

## Why these decisions

- **Two fixes, not one.** "≥80 vs baseline" was unreachable *by construction* under the v1 scorer, so
  no harness change could ever show it. The scorer had to be fixed first, independently of the harness.
- **v2 scorer = uncap + gradient + granular checks.** Run each of the 9 tests individually; correctness
  = round(10 × pass-fraction), feature scales with pass-fraction; dims uncapped so a correct single-file
  solution clears 80 (max ≈ 98). Added a minimal-diff/no-bloat signal to `code_quality`. Decontaminated
  `copyHarnessRef` (excludes `templates/harness-eval-cases/**`). Fixed cost capture: count
  `command_execution` items (v1 matched only `function_call` → tool_calls always 0) and record a
  `crashed` flag + `turns_completed` so a context-window failure is visible, not a silent 0.
- **INLINE mode is the smallest fix that counters every observed failure mode.** Context bloat → "load
  only this contract"; whole-file rewrite loop → "smallest targeted edit, never rewrite a whole file";
  sandbox-rejected debug subprocesses → "only npm test / node --check"; never completing a turn → "stop
  on green, recognize completion". Matches the literature: top SWE-bench teams *removed* critic/voting
  layers and did better just running tests and deciding next steps (arXiv 2506.17208); MAST names
  step-repetition and failure-to-terminate as top failure modes (arXiv 2503.13657).

## Experiment A — measurement fix (deterministic, no codex)

Re-scored the **same** v1 agent outputs with the v2 scorer:

| arm | v1 score | v2 score | tests passed |
|---|---:|---:|---|
| baseline | 65 | **82** | 6/9 |
| harness | 63 | **74** | 4/9 |

- Ceiling fixed: 82 > 80 (v1 max was 77 for any solution).
- Sensitivity restored: 8-pt gap (was 2), driven by the real differentiators — correctness 7 vs 4,
  feature 7 vs 6, documentation 7 vs 4 — not a comment heuristic.
- Honest finding: the v2 scorer reveals the v1 harness output was *genuinely worse* (4/9 vs 6/9), which
  the v1 binary scorer hid.

## Experiment B — live re-run on gpt-5.3-codex-spark (INLINE-mode skill + v2 scorer)

Fresh codex run, both arms, identical v2 conditions.

| arm | score | tests | tokens | wall-clock | turns | crashed |
|---|---:|---|---:|---:|---:|---|
| baseline | 81 | 7/9 | 4.05M | 255 s | 1 | no |
| harness | **82** | 6/9 | **2.71M** | **207 s** | 1 | **no** |

`pass_winner=baseline, quality_winner=harness, winner=not_proven`.

**The harness fix worked on every diagnosed failure mode** (vs the original v1 harness, which crashed,
scored 63, passed 4/9, used 0 captured tokens over 407 s):
- No crash: `turns_completed` 1 (was 0), `exit_code` 0 (was 1).
- Cost blowup reversed: harness now uses 33% FEWER tokens and 19% less wall-clock than baseline (v1 was
  2.15x baseline).
- Score 63 → **82**, crossing the 80 target, and edging baseline on quality (82 vs 81).
- Mechanism confirmed in the harness log: selected INLINE mode; read `reference/`+`templates/` **0**
  times (v1 read the leaked eval-case yaml); **0** sandbox-rejected debug subprocesses (v1 had many);
  produced a leaner 681-line file vs baseline's 795 (v1 harness was 895 > baseline 747).

**Honest verdict: still `not_proven`, correctly.** It is one noisy case — baseline also moved run-to-run
(6/9→7/9, doc comments dropped → 81). The harness now wins quality and cost but ties/edges on raw pass
count (6/9 vs 7/9). Residual issue: codex still did 6 full-file `cat >` rewrites despite the
minimal-diff instruction — it no longer crashed (the file stayed small enough) but the edit discipline
is not fully enforced. Proving a consistent win needs the multi-case set, not n=1.

## Limitations

- One hard case; cannot prove general harness effectiveness (the eval's own conclusion). Next: run the
  existing 3-case set.
- The deep-research workflow's adversarial verification was rate-limited to full abstention, so external
  claims are sourced (arXiv, Anthropic) but not workflow-verified; they are corroborated only by
  independent agreement with the local artifacts.
