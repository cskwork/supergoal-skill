# Does the supergoal skill measurably beat baseline? Diagnosis + a testable fix

Date: 2026-07-01
Question (user): improve the supergoal skill so it actually performs better than
NOT using it, with measurable, data-based evidence, on the build / fix / review modes.

This document consolidates three evidence streams (the repo's own prior A/B evals,
external literature, and a fresh web-research pass), states the honest diagnosis,
and defines the one fix this experiment tests. Results are appended after the run.

## TL;DR

- The skill does **not** reliably beat a strong baseline on explicit-spec coding
  tasks: prior repo evals repeatedly land on `Not proven` (tie at 2-5x cost).
- Its only measured correctness win is vs the realistic **one-shot** default on
  **under-specified, latent-correctness** tasks (a bug that "looks right and passes
  the visible tests"). Even there, an **equal-compute naive loop with no skill beat
  the role-loop** (u1: naive 4.0/4 >= role-loop 3.3/4 > baseline 2.3/4) - so the
  active ingredient was the extra verification passes, not the role separation.
- External literature independently confirms both halves of that finding (below).
- Pinpointed defect: the role-loop **serializes coverage through one critic pass** -
  the fixer only fixes what the critic's tests assert, so a requirement the single
  critic misses (u1 null-source) is never fixed. The naive loop re-reads the whole
  task each pass and fixes everything.
- This experiment tests one targeted fix (`harness_v2`): the critic runs an explicit
  per-parameter **degenerate-input sweep**, and the verifier runs a **whole-spec
  completeness sweep**. Success = `harness_v2` closes the gap to the equal-compute
  naive loop under a conservative significance rule. If it does not, we report
  `Not proven` and do not touch the shipped skill.

## 1. What the repo already proved (own A/B corpus)

- Explicit-spec tasks tie at 2-5x cost, even at expert tier:
  `docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/` -
  case-003 14/14=14/14, case-002 8/8=8/8, case-015 11/12=11/12; overall `Not proven`.
- The only signal regime is under-specified latent-correctness, and even there the
  win is compute, not the mechanism:
  `docs/experiments/2026-06-07-harness-eval-underspecified-n3/` - u1 deepMerge:
  baseline 2.3/4 (ships the prototype-pollution + null-source bugs 3/3 as false-GREEN),
  role-loop 3.3/4, **equal-compute naive loop 4.0/4** (0 false-GREEN). u2 csv ties
  everywhere (canonical behavior a baseline fills unprompted).
- Delivery-gate patch improved proof QUALITY but not correctness on tied cases:
  `docs/experiments/2026-06-28-supergoal-delivery-gate-effect/` - `partially proven`.
- The methodology itself (`reference/harness-eval.md`) already mandates the
  equal-compute control, per-check (not aggregate) scoring, and `Not proven` defaults.

## 2. External evidence (web research, 2026-07-01; 25 sources, 21/25 claims confirmed)

Confirms the diagnosis and sets the proof bar:

- **Equal-compute confound is real.** "Rethinking the Value of Multi-Agent Workflow:
  A Strong Single Agent Baseline" (arXiv 2601.12307): a well-tuned single agent matches
  or beats planner/critic multi-agent workflows once compute is held equal - apparent
  gains stem from extra compute, not structure. Matches the repo's naive >= role-loop.
- **The skill's true value = catching false-GREEN.** UTBoost (arXiv 2506.09289):
  15.7% of "resolved" patches on SWE-bench Verified and 28.4% on Lite are actually
  wrong (false-pass) because the visible gates are thin. Hidden/held-out tests are
  what expose this - exactly the skill's critic/verify lever.
- **Harness effect is large and model-independent.** A fixed model under different
  harnesses swings up to ~6x on the same benchmark (arXiv 2603.28052); the Google
  "New SDLC with Vibe Coding" paper (May 2026) reports a harness-only change moving a
  Terminal-Bench 2.0 agent from outside Top 30 to Top 5, and a +13.7-point LangChain
  gain from prompt/tool/middleware only. So structure CAN matter - the question is
  whether THIS structure beats equal compute.
- **Aggregate pass-rate hides regressions.** Degrading one layer moved an aggregate
  only -1.7 to -5.9pp while the isolated slice dropped -25 to -91pp (arXiv 2606.11686)
  -> score each check individually, never one all-or-nothing number.
- **Proof bar (adopt).** Claim a win only when the BCa bootstrap CI on paired per-seed
  deltas lies entirely above zero AND a sign-flip permutation test gives p<0.05
  (arXiv 2511.19794). Never trust raw LLM-judge scores (bias-correct via Rogan-Gladen;
  style/formatting bias 0.76-0.92 dominates - arXiv 2511.21140, 2604.23178). This eval
  sidesteps judge bias by scoring on deterministic hidden unit tests, not an LLM judge.
- **Caution.** A "better" prompt can HURT objective metrics (one study: extraction
  100% -> 90%). So the fix is gated behind the eval and a v1-vs-v2 regression check.

## 3. Diagnosis

The role-loop's only correctness lever is surfacing requirements ABSENT from the
prompt. It underperforms equal compute because a single critic pass serializes
coverage: the fixer fixes only what that critic's generated tests assert. When the
critic omits a degenerate input (u1 null-source), it is never fixed. Free-form
iteration wins by re-reading the whole task every pass.

## 4. The fix under test (`harness_v2`)

Two minimal, targeted prompt-contract changes that give the role-loop the naive
loop's breadth without abandoning role separation:

1. **Critic degenerate-input sweep** - for each input/parameter, walk null / undefined
   / empty / zero-length / boundary and write a failing test for each the spec implies.
2. **Verifier whole-spec completeness sweep** - re-read the full task from scratch;
   for any stated-or-implied requirement lacking a passing test, add a spec-anchored
   test and fix src minimally (not only what the critic tested).

Arms (same model `sonnet`, `claude -p` headless runtime, ground-truth hidden scoring):
`baseline` (1 pass) / `naive` (build+3 review, no skill, 4 pass, equal-compute control)
/ `harness_v1` (current role-loop, 4 pass) / `harness_v2` (fixed, 4 pass). Case: u1
deepMerge (the case where the role-loop lost). Runtime pivot: codex-exec crashes on
this Windows host (sandbox unsupported); `claude -p` is the runtime.

## 5. What counts as proof

- **Primary metric:** hidden-test pass fraction (0-4) per seed, scored on a throwaway
  copy whose `test/` is reset to canonical visible+hidden (critic-added tests cannot
  move the denominator).
- **Secondary:** false-GREEN count (visible pass + hidden fail), cost (USD/tokens),
  and per-seed variance.
- **Decision rule:** `harness_v2` is a real mechanism win only if its paired per-seed
  delta over `naive` clears the BCa-CI-above-zero AND permutation-p<0.05 bar. Beating
  `harness_v1` shows the fix helped the role-loop; beating `naive` shows structure
  beats equal compute. Beating only `baseline` is the already-known one-shot result.
- **If not proven:** report it plainly and leave the shipped skill unchanged; the
  honest, defensible value proposition remains: forcing verification vs a one-shot on
  false-GREEN-prone tasks, high-effort crash stability, and single-pass cost trim.

## Results

(Appended after the run: per-seed vectors, arm summary, BCa CI + permutation p,
cost multiples, and the promote/`Not proven` decision.)
