# Skill-Lift Measurement — Deep Research Report

Date: 2026-07-01
Question: how do you empirically PROVE a coding SKILL.md beats a no-skill baseline, with data,
on genuinely hard tasks? (build/fix/review focus.)

Method: 5-angle web fan-out, 23 sources fetched, 111 claims extracted, top 25 adversarially
verified (3-vote, kill on 2/3 refutes). 21 confirmed, 4 refuted. Confirmed claims below carry
their source; refuted/contested claims are listed separately so they are never cited as fact.

---

## TL;DR — the three numbers that matter

1. **Curated skills DO measurably beat baseline, by the exact method we want.**
   SkillsBench (arXiv:2602.12670, Feb 2026, ~77 authors incl. Dawn Song) ran 87 tasks under
   *matched no-Skills vs curated-Skills* conditions with *deterministic verifiers* and 7,308
   trajectories. **Curated Skills raised average pass rate 33.9% -> 50.5% (+16.6pp, 25.5%
   normalized gain).** This is paired A/B + machine-checkable ground truth — our target design —
   and it comes out positive. `[CONFIRMED 3-0]`

2. **The harness matters MORE than the model on hard tasks.**
   The same LLM scores **42% -> 78% on SWE-bench by changing only the scaffold/harness** (36-pt
   swing); on SWE-bench Pro, scaffolding is a **22+ point swing while swapping frontier models
   barely moves the number** (six frontier models land within ~0.8 pt of each other).
   (particula.tech, citing Nate B. Jones.) `[CONFIRMED 3-0]`

3. **n=3 cannot prove anything about a small delta.**
   To detect a **3-percentage-point** absolute difference at 80% power / 5% significance you need
   **~969 independent questions**; Anthropic recommends evals hold **>=1,000** (Evan Miller,
   "Adding Error Bars to Evals", arXiv:2411.00640). For a matched-pair test,
   `n_per_arm = 16 * sigma^2 / MDE^2`; a worked example (sigma=0.18, MDE=0.04) needs **324 paired
   examples/arm**, and **<100 paired is below the resolution of a credible test.** `[CONFIRMED 3-0]`

**Consequence for supergoal:** the repo's own evals concluding "Not proven / tie" are consistent
with a skill that genuinely helps — because every internal pilot ran on explicit-spec tasks (ceiling)
at n=1-3 (statistically blind). The problem measured was our *measurement*, not (yet) the skill.

---

## 1. A/B methodology & statistical rigor (how to prove it)

- **Use paired (matched) A/B on identical tasks.** SkillsBench: "we evaluate every task under
  matched no-Skills and curated-Skills conditions" with deterministic verifiers. Pairing is the
  design that isolates the skill from task-to-task noise. `[CONFIRMED 3-0]`
- **Paired-difference analysis is a "free" variance reduction.** Anthropic's error-bars paper
  gives the paired SE verbatim: `SE_{A-B,paired} = sqrt(SE_A^2 + SE_B^2 - 2*SE_A*SE_B*Corr(s_A,s_B))`
  and recommends inference on question-level paired differences over population summaries.
  Positive correlation between arms (same task, same difficulty) shrinks the variance you must
  overcome. `[CONFIRMED 3-0]` (arXiv:2411.00640)
- **Sample size floor.** ~969 questions to resolve a 3pp gap at 80% power; >=1,000 recommended.
  Matched-pair: `n_per_arm = 16*sigma^2/MDE^2`. Detecting *half* the effect needs ~4x the samples
  (quadratic). `[CONFIRMED 3-0]`
- **Pass@k is unstable / potentially misleading** as the headline metric; prefer a properly
  estimated pass-rate with CIs, and report run-to-run variance. `[CONFIRMED 3-0]`
- **Bayesian option:** a Dirichlet-posterior framework over outcome categories gives calibrated
  uncertainty on small samples (useful when 1,000 runs is infeasible). `[CONFIRMED 3-0]`
- Report a **per-seed vector**, not just the mean — the repo already learned this the hard way
  (case-015 flipped win->tie on re-run at n=1).

## 2. LLM-as-judge design & known biases (grade honestly)

- **LLM-judge alone is unreliable for hard code.** The best judge (GPT-4-turbo) **misjudges ~50%
  of wrong Java implementations as correct** (Crupi/Tufano et al., IEEE TSE 2025, arXiv:2507.16587:
  "correctly classifies 72% of correct implementations but misjudges 50% of the wrong ones").
  `[CONFIRMED 3-0]`
- **Ground the judge in execution.** Augmenting an LLM judge with a code-execution tool raised
  agreement with ground truth **from <42% to ~72%** (Findeis et al., via arXiv:2510.24367).
  Real tests > text grading. `[CONFIRMED 3-0]`
- **Control the documented biases.** GPT-4 has the strongest **self-preference bias (0.520)** of 8
  judges tested `[CONFIRMED 3-0]`; the CALM framework enumerates **12 bias types** (position,
  verbosity, self-preference, bandwagon, authority, ...) `[CONFIRMED 3-0]`; **position/order bias is
  a severe failure mode** `[CONFIRMED 3-0]`; judges **over-rate lower-perplexity (more familiar)
  outputs** `[CONFIRMED 3-0]`. Mitigations: blind/label-swap, use a *different-family* judge, keep
  a deterministic verifier as the real oracle and use the LLM only for the quality rubric.

## 3. Hard benchmarks with clean pass/fail (avoid the ceiling)

| Benchmark | Frontier pass rate | Why hard / signal | Status |
|---|---|---|---|
| **SWE-bench Pro** | frontier (Opus 4.1, GPT-5) **~23%** vs **70%+** on Verified | long-horizon real repo fixes; two hidden-test grading; huge headroom | `[CONFIRMED 3-0]` |
| **SWE-bench Verified** | 70%+ frontier; scaffold swing **42%->78%** | human-filtered solvable subset; still discriminates via scaffold | `[CONFIRMED 3-0]` |
| **Terminal-Bench** (ICLR 2026, arXiv:2601.11868) | Claude Opus 4.5 Terminus2 **57.8%±2.5%**, Claude Code **52.1%** | end-to-end CLI tasks; scaffold swing large (Gemini-2.5-Pro +17% with Terminus2 vs OpenHands) | `[CONFIRMED]` |
| **SWE-Lancer** (OpenAI, arXiv:2502.12115) | frontier cannot solve most; **$1M** unearned | 1,400+ real Upwork tasks, triple-verified E2E tests, monetary signal | `[CONFIRMED 3-0]` |
| **Aider polyglot** | — | multi-language edit-format stress; objective test pass | source captured |

- **Objective grading is outcome-based unit tests**, not self-report. `[CONFIRMED 3-0]`
- **Caveat — weak tests leak false positives.** On SWE-bench, human-written PR tests are often too
  weak: a patch can pass all tests without fixing the issue. `[CONFIRMED 3-0]` -> supergoal's
  "hidden test" discipline is the right countermeasure; keep hidden suites strong.

## 4. Verification gates & scaffold lift

- Verdent's agentic scaffold resolved **76.1% pass@1 / 81.2% pass@3** on SWE-bench Verified,
  beating models' native scaffolds — evidence that gate-driven scaffolding is where the points are.
  `[CONFIRMED via source]`
- HAL harness ran **21,730 rollouts x 9 models x 9 benchmarks** — the scale real agent A/B takes.
  `[CONFIRMED]`
- The scaffold-lift numbers (§TL;DR #2) are the load-bearing argument for investing in the skill at
  all: on hard tasks, harness > model.

---

## Refuted / contested (DO NOT cite as fact)

- ~200 trials to distinguish a 1.3pp gap — **refuted 0-3.** (Use the confirmed 969-for-3pp instead.)
- SWE-bench Pro "low-40s public / GPT-5 15.7%" — **refuted 1-2**: mixes two incompatible snapshots.
  (Public-set per-model numbers are individually real on the Scale leaderboard, but the composite
  claim conflates public and commercial sets. Use the confirmed "~23% Pro vs 70%+ Verified".)
- Terminal-Bench "63%, all frontier <65%" as present-tense fact — **refuted 1-2**: accurate only as a
  Jan-2026 snapshot. (Use the confirmed Opus 4.5 57.8% Table-2 figure.)
- "LLM-judge quality strongly model-dependent, small models fail" — **refuted 1-2.** (Use the
  confirmed GPT-4-turbo-50%-misjudge + execution-grounding-42%->72% instead.)

## Sources (confirmed-claim backbone)

- arXiv:2602.12670 — SkillsBench (paired skill A/B, deterministic verifiers, 33.9->50.5%)
- arXiv:2411.00640 — Adding Error Bars to Evals (Miller/Anthropic; 969, paired SE, power)
- particula.tech / Nate B. Jones — scaffold 42->78%, Pro 22+pt scaffold swing
- arXiv:2509.16941 — SWE-bench Pro (~23% vs 70%+)
- arXiv:2502.12115 — SWE-Lancer ($1M, E2E-verified)
- arXiv:2601.11868 — Terminal-Bench (ICLR 2026)
- arXiv:2510.24367 — LLM-as-judge for SE (execution grounding 42->72%)
- arXiv:2507.16587 — IEEE TSE 2025 (GPT-4-turbo misjudges 50% wrong code)
- verdent.ai — 76.1% pass@1 scaffold
- claude.com/blog skill-creator — Anthropic's own benchmark-mode for measuring skill lift

Raw verification log: task output `wrm4wl970` (per-claim 3-vote evidence with primary-source quotes).
