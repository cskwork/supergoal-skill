# Scaffold lift, debugging-eval design, and skill efficiency — research synthesis (2026-07-17)

**Question.** Two axes: (1) how to make a supergoal skill-on/skill-off A/B show a *meaningful* difference
on debugging, and (2) how to make the skill simpler, cheaper, and higher-scoring. Grounded in 2024–2026
SWE-bench-style agent research and cross-checked against supergoal's own 8-eval record.

**Provenance / honesty note.** Run via the `deep-research` workflow: 5 angles → 25 sources → 125 claims →
top-25 adversarially verified. Credits ran out **during** the Verify phase, so only 5 claims received the
full 3-vote adversarial pass; 1 was refuted; 19 are primary-source claims with direct quotes that did
**not** get adversarial votes. Confidence is tiered accordingly. The synthesis step failed and was done
by hand from the raw claim set + repo evidence.

---

## Confidence tiers

- **HIGH** — 3-0 adversarial vote in this run, or corroborated by supergoal's own replicated evidence.
- **MEDIUM** — primary source with a direct quote, but not adversarially verified in this run (credit cutoff).
- **REFUTED** — failed adversarial verification; do not rely on.

---

## Q1 — Where scaffold/skill lift is real vs strong baselines, and which task classes discriminate

### The baseline-first result is the mainstream finding, not a supergoal failure (HIGH)

- **Scaffold lift shrinks as the base model strengthens.** In the CCA ablation (SWE-Bench-Pro, 100-inst
  subset), "advanced context management" is **+6.6 pts on Claude 4 Sonnet (42.0→48.6) but +0.6 on Claude
  4.5 Sonnet (51.0→51.6)." The *same* component's value depends on backbone generation. `arxiv 2512.10398`.
  → This is the external explanation for supergoal's "no lift on explicit-spec across 8 evals": strong
  baselines absorb scaffold value. It is expected, not a defect.
- **Minimal scaffolds match elaborate ones on explicit-spec SWE tasks.** mini-SWE-agent — ~100 lines,
  bash-only, linear history — scores **>74% on SWE-bench Verified**, roughly matching feature-rich
  harnesses. `github.com/SWE-agent/mini-swe-agent` (MEDIUM).
- **Older scaffolds don't beat cheap baselines either.** "AI Agents That Matter": LDB/LATS/Reflexion do
  not beat a warming baseline on HumanEval (warming GPT-4 93.2% @ $2.45 vs LATS 88.0% @ $134.50) — a 50×
  cost spread for no accuracy gain. `arxiv 2407.01502` (MEDIUM). A fixed 3-phase Agentless pipeline beat
  autonomous agents on SWE-bench Lite (32.0% @ $0.70). `arxiv 2407.01489` (MEDIUM).

### Where lift IS real — three levers, all mapping to supergoal (HIGH/MEDIUM)

1. **Hard, contamination-resistant tasks.** CCA reaches **59.0% Resolve@1 on SWE-Bench-Pro** (GPT-5.2),
   claimed above prior scaffolds and vendor commercial results; Sonnet+CCA 52.7% edges Opus+proprietary
   52.0%. Self-reported, single-paper, not replicated. `arxiv 2512.10398` (HIGH for the number, MEDIUM
   for the "outweighs model tier" reading — 0.7 pp, no significance test).
   → Lift appears on *hard* tasks. Confirms supergoal's "hard label ≠ headroom; you need genuine
   baseline struggle."
2. **Input enrichment (problem-statement pre-exploration), not output gating.** Enriching only the
   problem statement via lightweight codebase pre-exploration — no scaffold change — gives **+20%
   resolution / +27 issues on SWE-bench Verified**, and **replicates across 3 LLMs** (DeepSeek R1 +9.6%,
   GPT-5-mini +7.7%, Qwen3-Coder +13.1%). No Claude tested. `arxiv 2603.05744` (HIGH; both claims 3-0).
   → This is the **strongest replicated lift in the whole set**, and it is *input-side*, not a
   verification gate. supergoal does this implicitly in Frame/explore but never measures it as a lever.
3. **Restructuring *when* the agent attends — the crown jewel for supergoal's thesis.** mini-SWE ablation
   (50-inst SWE-bench Verified): base 62.0%; adding the instruction to the initial prompt **+2 pts
   (64.0%)**; prompting per-step reflection on past trajectory **+14 pts (76.0%)**. Structuring *when*
   attention lands delivered ~6× the gain of the instruction as content. `arxiv 2511.13646` (MEDIUM).
   → This is the external analog of supergoal's **5/12 vs 3/12**: same checks, +3 from restructuring
   attention (SKILL.md top placement + literal `GATE.*` contract) over adding the same content. The
   literature independently reports the same shape.

### Task classes that discriminate (MEDIUM)

- **Latent-correctness / discoverable-but-unstated contracts** discriminate; **fully hidden contracts do
  not.** SWE-bench Verified *deliberately removed* instances whose contract is conveyed nowhere in the
  problem statement (e.g. an exact warning string settled in PR discussion) because they are "nearly
  impossible for ANY agent regardless of scaffold." `openai.com/.../introducing-swe-bench-verified`.
  → Exactly supergoal's **24102** (0/12 across all arms). The discriminating band is *unstated in the
  prompt but recoverable from the codebase/sibling idiom* — which is precisely the LATENT-CORRECTNESS
  doctrine already in `harness-eval.md`.
- **Multi-manifestation bugs** discriminate a repro-diversity gate. A single bug-reproduction test
  captures "only one manifestation of an issue, producing partial fixes"; fail-to-fail BRTs actively
  mislead. `arxiv 2607.00990` (MEDIUM). SWE-Doctor's fix is *diverse, multi-faceted* BRTs + runtime
  grounding, winning 10/10 backend×benchmark combos (MEDIUM, 0 valid votes — treat as directional).
  → This is the design rationale for the DEBUG gate's **check-2 (structurally different second repro)**.
  The literature says a single-repro gate is net-negative; a diversity gate is the mitigation.

### REFUTED

- "Underspecified failures correlate with over-exploration / repeated identical fix attempts" — **1-2,
  refuted.** Do not build a discriminator on the premise that long trajectories mark underspec failure.

---

## Q2 — Constructing debugging instances that discriminate at small n, and small-n statistics

### Instance construction (MEDIUM)

- **SWE-smith:** 4 bug-generation strategies (LM rewrite, procedural AST mutation, PR undo/invert,
  patch-combination), kept only if the patch **breaks ≥1 passing test** (Fail-to-Pass validation).
  Difficulty-stratified subsets sharply separate a strong agent: easy/med/hard = **58.6 / 41.0 / 17.0%**;
  overall 36% solve over 8,686 instances. `arxiv 2504.21798`.
- **Difficulty is best tuned by problem-statement information content**, not by changing the bug —
  withhold contract/repro info to raise difficulty. `arxiv 2504.21798`. Leaking the eval test *into* the
  prompt makes agents skip writing their own repro (127/500 vs 379/500, −66%) and *lowers* performance.
- **BugPilot "FeatAdd":** build hard, naturalistic debugging instances by having agents **implement a
  feature that unintentionally breaks existing tests** — no scraped PRs needed; more naturalistic than
  perturbation, and 2% better SFT signal at half the data. Perturbation bugs are OOD/less discriminative.
  `microsoft.github.io/debug-gym/blog/2025/10/bug-pilot`.
  → Note: supergoal's **termenv** was itself a feature-add that broke behavior (autopsied 07-17). FeatAdd
  formalizes exactly that shape — and it is the failure mode the deleted `sideeffect-004` fixture *could
  not* reproduce.
- **R2E-Gym:** 8.1K procedural environments, problem statements backtranslated from commit diffs; hybrid
  execution + execution-free verifiers reach Best@26 = 51% (vs 47.4% regression-test-only). "Toxic" repro
  tests invert the signal — passing wrong patches, failing right ones. `arxiv 2504.07164`.

### Ground-truth is noisy — hidden tests are mandatory (MEDIUM)

- Raw fail-to-pass has a large false-positive component: augmented tests flagged **28.4% (Lite) / 15.7%
  (Verified)** of "passing" patches as actually wrong. `arxiv 2506.09289`.
- Raw GitHub-issue instances are contaminated: 38.3% underspecified, 61.1% unfair tests, **68.3% filtered
  out** in SWE-bench Verified. `openai.com/.../introducing-swe-bench-verified`. Even curated SWE-Bench-Pro
  was audited at **~30% broken** (200 auto + 249 human of 731), and OpenAI retracted its recommendation.
  `openai.com/.../separating-signal-from-noise`.
  → supergoal's oracle/nop dual-gating + hidden checks are the right defense; keep them.

### Small-n statistics (MEDIUM — corroborates supergoal's existing rig)

- **Paired per-instance analysis reduces variance for free** (pairing subtracts 2×covariance); use
  question-level paired differences, not aggregate scores. Miller/Anthropic, "Adding Error Bars to Evals."
  `arxiv 2411.00640`. → validates supergoal's McNemar + sign-flip design.
- **Averaging multiple runs per instance is the biggest small-n lever.** Paired + averaging shrinks the
  minimum detectable difference on HumanEval (N=164) from **12% → 2–4%**; paired-only or averaging-only
  each give 8%. `arxiv 2512.21326`. → supergoal currently runs ~1 sample/instance/seed; adding
  within-instance averaging is what moves n≥6 from "barely powered" to "actually powered."
- **pass^k** (probability of success on *all* k i.i.d. trials) is the reliability complement to pass@k.
  tau-bench, `arxiv 2406.12045`. → co-report with f2p for the DEBUG gate, whose value is consistency.
- **Cost/time must be co-primary.** 50× cost spread for no gain (AIATM). → supergoal's four-axis
  accounting is correct.
- **Infra config alone shifted Terminal-Bench 2.0 by 6 pp (p<0.01)** — larger than many scaffold claims.
  `anthropic.com/engineering/infrastructure-noise`. → a 5/12-size signal can be pure infra artifact
  unless both arms are pinned to identical resource config. Add this as an explicit control.

---

## Q3 — Token-efficient, higher-scoring skill/gate design

### Every injected token is a cost, independent of content (HIGH pattern / MEDIUM numbers)

- **Context rot:** recall degrades non-uniformly as input grows, difficulty held constant, across 18
  models / 4 families. `research.trychroma.com/context-rot`, `anthropic.com/.../effective-context-engineering`.
- **Instruction adherence collapses with instruction count:** at 500 simultaneous instructions the best
  of 20 frontier models hits only **68%** following accuracy. IFScale, `distylai.github.io/IFScale`.
- **Token count alone degrades reasoning:** padding a task to 3000 tokens dropped accuracy **0.92 → 0.68**
  across 5 LLMs, far below context limits. `arxiv 2402.14848`.
  → Direct implication: **adding more gate checks or prose will *lower* adherence to the ones that
  matter.** The DEBUG gate at 3 checks + literal contract is near the sweet spot; a 4th/5th check likely
  costs more than it buys. This is the single strongest argument for "attention structure, not content."

### Skill mechanics already favor supergoal (MEDIUM)

- **Installed skills preload only name + description; the body loads on judged relevance.** So the
  always-paid cost of an installed skill is its metadata, not its body.
  `anthropic.com/.../equipping-agents-for-the-real-world-with-agent-skills`.
  → supergoal's "~2× input tokens" is an embed/benchmark artifact (repo changelog: 97% cache hits), not a
  real standing cost. Real standing cost = the one description line.
- **Official budget: SKILL.md body < 500 lines**, overflow split into progressively-disclosed files.
  `platform.claude.com/.../best-practices`. supergoal SKILL.md is **130 lines** — already compliant. The
  fat is `reference/role-loop.md` (302 lines) and `reference/harness-eval.md` (445 lines).
- **Verification must be a runnable pass/fail check** or the agent stops at "looks done."
  `code.claude.com/.../best-practices`. → supergoal's literal `GATE.*` output contract is exactly this.

### Nuance: for self-tooling scaffolds, benefit can GROW with model strength (MEDIUM)

- Contra the "shrinks with strength" rule: a self-evolving scaffold inverts for weak models (GPT-5-Nano
  44%→14%, −68%) but *grows* for strong ones (Claude 4.5 Sonnet +22.6% relative). `arxiv 2511.13646`.
  → "Scaffold value shrinks with strength" holds for *context-management* scaffolds (CCA), not
  universally. The kind of scaffold matters: passive context mgmt saturates; active restructuring can scale.

---

## Recommendations

### (a) Debugging-task axes to build next into harness-eval (ranked by expected discrimination / cost)

1. **Held-out generalization set — run FIRST (cheapest, answers the biggest caveat).** The 3 untouched
   sympy instances already in `FOLLOWUPS.md` (20212 / 24066 / 24213). Confirms the hidden-contract gate
   isn't tuned to its 4 training tasks before anything else is built. No new fixtures.
2. **Multi-manifestation bugs (the axis check-2 is *designed* to win).** Bugs with ≥2 structurally
   different triggers where a single-repro fix passes the reported trigger but fails a sibling API. The
   literature (2607.00990 BRT-hurt, SWE-Doctor diverse-BRT) says a naive single-repro baseline *loses*
   here and a diversity gate wins — the cleanest discriminator for the specific mechanism supergoal
   shipped. This is where the gate should show its largest, most defensible margin.
3. **FeatAdd-induced regressions (naturalistic, reproducible from any repo).** Generate instances by
   having an agent add a feature that breaks existing tests (BugPilot). This reproduces the "diff outgrows
   the plan" failure mode the deleted `sideeffect-004` fixture missed, and matches the real termenv shape.
   Highest-value *new construction* recipe.
4. **Problem-statement info-content ladder.** Same bug, three prompt variants: full repro → symptom-only →
   misleading symptom. Difficulty tuned by withholding contract, not changing the bug (2504.21798). Cleanly
   isolates the gate's "surface the unstated requirement" lever.
5. **AVOID as non-discriminating:** fully-hidden-contract instances (impossible for all scaffolds — the
   24102 class), and pure AST-perturbation bugs (OOD, less naturalistic than FeatAdd/real bugs).

**Methodology adds:** within-instance run averaging (12%→2–4% MDE) + pass^k co-reporting; pin infra config
identical across arms (6 pp / p<0.01 noise floor); keep oracle/nop dual-gating (15.7% of "passing" patches
are actually wrong).

### (b) supergoal edits — simpler, cheaper, higher-scoring

1. **Do NOT add gate checks or prose. Freeze the DEBUG gate at 3 checks.** IFScale (68% @ 500 instr) and
   token-padding (0.92→0.68) say more content *lowers* adherence to the checks that already work. The
   proven lift was attention restructuring, not content — protect that.
2. **Keep and generalize check-2 (structurally different repro); it is the literature's #1 mitigation**
   for the single-test-partial-fix hazard. For the 24102 gap, prefer the `FOLLOWUPS C` rewording (vary the
   *grammatical role* of the failing construct) over a new check — but gate it behind the held-out set (rec
   a.1) so you don't re-tune to the training tasks.
3. **Trim the two fat reference files, not SKILL.md.** `role-loop.md` (302 lines) and `harness-eval.md`
   (445 lines) are what a working phase actually loads and pays context-rot tax on. Split `role-loop.md`
   so a DEBUG builder sees the 3-check gate + run-isolation contract *without* the WAYFINDER/vault prose.
   Biggest cheap token win; SKILL.md is already under budget.
4. **Add input-enrichment as a measured lever (highest-EV new experiment).** The strongest *replicated*
   external lift (+20%, 3 models, `2603.05744`) is problem-statement pre-exploration — input-side, not a
   verification gate. supergoal does this implicitly in Frame/explore; make a lightweight "pre-exploration
   brief before Plan" an explicit, A/B-measured step for DEBUG/LEGACY localization. Likely higher EV than
   any additional verification.
5. **Ship the naive extra-pass line (0→3/12, p=0.10) only where no structured gate exists** (FOLLOWUPS B).
   Weakly supported (extra passes help — AIATM/loop evidence) but dominated by structured attention; use
   it as a cheap default for modes lacking a gate, not as a competitor to the DEBUG gate.

### One-line takeaway

supergoal's own conclusions are the mainstream 2024–2026 finding: on explicit-spec tasks strong baselines
absorb scaffolds; lift is real only on **hard/latent-correctness** tasks and comes from **restructuring
attention and enriching input**, not from adding verification content. The next dollar is best spent on
(i) a held-out debug set, (ii) a multi-manifestation axis built to the gate's mechanism, and (iii) an
input-enrichment A/B — while *removing* reference-file bulk rather than adding gate checks.

---

## Sources

- `arxiv.org/abs/2512.10398` — Confucius Code Agent (CCA), SWE-Bench-Pro (HIGH; 3× 3-0).
- `arxiv.org/abs/2603.05744` — Problem-statement enrichment / pre-exploration (HIGH; 2× 3-0).
- `arxiv.org/abs/2511.13646` — Live-SWE-agent self-evolving + reflection-gate ablation (MEDIUM).
- `arxiv.org/abs/2607.00990` — SWE-Doctor / BRT-can-hurt (MEDIUM).
- `arxiv.org/abs/2504.21798` — SWE-smith construction + difficulty stratification (MEDIUM).
- `arxiv.org/html/2504.07164` — R2E-Gym / hybrid verifiers / toxic tests (MEDIUM).
- `microsoft.github.io/debug-gym/blog/2025/10/bug-pilot` — BugPilot FeatAdd (MEDIUM).
- `openai.com/index/introducing-swe-bench-verified` — Verified construction; hidden-contract removal (MEDIUM).
- `openai.com/index/separating-signal-from-noise-coding-evaluations` — SWE-Bench-Pro ~30% broken audit (MEDIUM).
- `arxiv.org/abs/2411.00640` — Miller/Anthropic, paired eval statistics (MEDIUM).
- `arxiv.org/abs/2512.21326` — Paired + averaging shrinks MDE 12%→2-4% (MEDIUM).
- `arxiv.org/abs/2407.01502` — AI Agents That Matter (cost) (MEDIUM).
- `arxiv.org/abs/2406.12045` — tau-bench pass^k (MEDIUM).
- `arxiv.org/abs/2407.01489` — Agentless 3-phase pipeline (MEDIUM).
- `github.com/SWE-agent/mini-swe-agent` — 100-line >74% baseline (MEDIUM).
- `research.trychroma.com/context-rot` — context rot (MEDIUM).
- `distylai.github.io/IFScale` — instruction-following at scale (MEDIUM).
- `arxiv.org/abs/2402.14848` — token-count degradation (MEDIUM).
- `anthropic.com/engineering/infrastructure-noise` — infra 6pp p<0.01 (MEDIUM).
- `anthropic.com/engineering/effective-context-engineering-for-ai-agents` (MEDIUM).
- `anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills` — metadata-only preload (MEDIUM).
- `platform.claude.com/.../agent-skills/best-practices` — SKILL.md <500 lines (MEDIUM).
- `code.claude.com/docs/en/best-practices` — runnable pass/fail verification (MEDIUM).
- REFUTED: "underspec failure ↔ over-exploration" (`2603.05744`, 1-2).
