# 2026-06-07 — Eval-skill accuracy fixes + gpt-5.5-low crash/harness test

Continues `changelog-2026-06-06.md` (diagnosis + INLINE fix + v2 scorer + Experiments A/B).

## What

1. **Made the eval methodology itself accurate** — ported the one-off run.mjs fixes into the skill's
   HARNESS-EVAL reference so future evals don't repeat the inaccuracies.
2. **Tested crash-specificity + harness value on gpt-5.5 low reasoning** to answer "is the crash only on
   spark, and does the harness matter on another model".

Changed:
- `reference/harness-eval.md` — 7 accuracy fixes: reachable + uncapped scoring (correct solution can
  reach >=80; no dimension capped below 10); gradient correctness over per-test pass fraction + record
  each check individually (not one all-or-nothing pass); strip eval-internal files from the harness
  reference; new "Runtime fit" section (single non-interactive process => INLINE, never force a
  multi-agent verifier loop into one context window); crash/turn/cost capture matched to the adapter
  (codex-exec emits `command_execution`, a crash is a recorded LOSS); cases must DISCRIMINATE
  (all-pass ceiling = inconclusive, not a tie/win); clarified the RevFactory yamls are specs needing
  authored fixtures (only case-015 runnable). Expanded the Reject list accordingly.
- `docs/experiments/2026-06-06-harness-eval-spark-high-lsp-v2/run.mjs` — added `SG_EVAL_EFFORT` and
  `SG_EVAL_HARNESS_SKILL` (A/B a different SKILL.md for the harness arm).

New:
- `docs/experiments/2026-06-07-harness-eval-gpt55-low/` — gpt-5.5 low-reasoning run (results.md,
  result-fixed.json, result-orig.json, SKILL.original.md, raw logs).

## gpt-5.5-low results (case-015, v2 scorer)

| run | arm | score | tests | crashed | tokens | wall-clock |
|---|---|---:|---|---|---:|---:|
| fixed skill | baseline | 79 | 6/9 | no | 786K | 211 s |
| fixed skill | harness | 79 | 6/9 | no | 418K | 152 s |
| original skill | baseline | 81 | 7/9 | no | 437K | 190 s |
| original skill | harness (pre-fix) | 79 | 6/9 | no | 353K | 142 s |

**Q1 — is the crash spark-specific? No.** It is a high-reasoning × heavy-payload effect. On gpt-5.5-low
even the original (pre-fix) harness completed cleanly — 47-line log, 0 `reference/`/`templates/` reads,
0 sandbox-rejected debug procs, 0 full-file rewrites — because low reasoning is terse and never unspools
the whole ~332 KB skill tree or the obsessive self-verify loop that exhausted spark-high's window. So you
cannot say "only spark"; the driver is reasoning effort + un-fixed payload. The INLINE fix prevents it at
any effort. (gpt-5.5-**high** with the original skill would be the confirming crash run; not tested.)

**Q2 — does the harness matter on gpt-5.5-low? As cost, not quality.** Both arms tie on outcome
(6-7/9, ~79-81, within run-to-run noise), but the harness uses ~half the tokens and ~25-30% less
wall-clock for the same result. On an easy-for-the-model, low-effort config the harness does not lift
quality (baseline already solves it) but it is cheaper. It clearly matters in the hard/high-reasoning
regime (spark-high: crash/63 -> clean/82, cheaper than baseline).

## Domain-knowledge cases (averaged) — `docs/experiments/2026-06-07-harness-eval-domain/`

Built 2 self-contained DOMAIN cases (billing tax/discount engine, shipping rate engine), each with an
explicit `RULES.md`; visible tests deliberately omit the subtle rules so the agent must apply the spec.
Fixtures validated (reference passes all; stub passes only visible: billing 4/8, shipping 3/7). Ran
baseline vs harness on spark-high, v2 scorer, INLINE skill.

| case | baseline | harness | baseline tok | harness tok |
|---|---|---|---:|---:|
| billing-tax | **80, 8/8** | 76, 6/8 | 1.81M | 0.91M |
| shipping-rates | 78, 7/7 | 78, 7/7 | 0.81M | 1.03M |
| (case-015, Exp B) | 81, 7/9 | 82, 6/9 | 4.05M | 2.71M |

Domain-only avg: baseline 79 / pass-frac 1.00, harness 77 / 0.875. All-3 avg: baseline 79.7 / 0.926,
harness 78.7 / 0.806. **Zero crashes across all arms** (INLINE fix holds).

**The domain hypothesis was NOT supported.** The harness tied on shipping and LOST on billing (baseline
perfect 8/8; harness 6/8, missing banker's-rounding and discount-before-tax — it read RULES.md 44x and
ran tests 11x, but implemented two subtle rules wrong with ~half the baseline's tokens). A strong
high-reasoning baseline nails an explicit spec unaided, leaving no room for a quality lift. The harness's
repeatable value is **stability + cost** (no crashes, ~30-50% fewer tokens), NOT quality.

**Caveat:** these cases give the domain rules to the agent as an explicit `RULES.md`, so they test
*applying a stated spec*, not *discovering implicit domain knowledge* — the latter is what the skill's
domain features (ten-rules, domain-context, LEARN-DOMAIN) target. A self-contained one-shot eval cannot
reproduce buried/undocumented domain rules; a fair test needs a real repo (LEGACY/LEARN-DOMAIN).

## Fan-out eval (Option B) — `docs/experiments/2026-06-07-harness-eval-fanout/`

Built a REAL fan-out harness: the eval script is the Conductor and each role is a separate `codex exec`
(clean context) sharing the sandbox via `.vault/` files - the fresh-context fan-out single-process codex
could not do. Pipeline: plan (analyst) -> build (executor) -> adversarial verify (verifier) -> repair.
(Bug found + fixed: persona files start with `---` YAML frontmatter, which made codex treat the prompt
as a flag - "unexpected argument"; strip frontmatter + lead with a safe header.)

Billing (the case the single-process harness failed 6/8):

| arm | score | tests | tokens |
|---|---:|---|---:|
| baseline | 80 | 8/8 | 0.86M |
| single-process harness | 76 | 6/8 | 0.91M |
| fan-out harness | 80 | 8/8 | 1.47M (plan 0.89M + build 0.58M; verify crashed transiently, repair skipped) |

LSP/case-015 fan-out: baseline 85, 9/9, 4.11M tok / 250 s; fan-out harness 81, **9/9**, 4.64M tok /
1015 s (verify crashed again, same transient infra error). Fan-out recovered correctness (6/9 -> 9/9)
but lost the score (the whole 4-pt gap is one `error_handling` heuristic; both pass all 9) and cost 4x
the wall-clock.

Combined fan-out (2 cases): baseline avg 82.5, fan-out avg 80.5, both pass-fraction 1.00; baseline
cheaper. **Fan-out RECOVERS the correctness the single-process harness throws away (to baseline parity)
but never beats baseline and costs more.** The adversarial verify+repair loop crashed in BOTH fan-out
runs (consistent codex/proxy infra issue) - plan+build alone reached baseline-level pass both times.

## Generated-harness eval (Option 1) — `docs/experiments/2026-06-07-harness-eval-genharness/`

New hypothesis after the generic skill showed no lift: generate a TASK-SPECIFIC harness first, then A/B
no-harness vs generated-harness. Phase 1 = a focused `codex exec` reads ONLY RULES.md + visible tests +
the stub and writes `harness/checklist.md` + `harness/selftest.mjs` (spec-derived verifier; never sees the
hidden tests). Phase 2 = solve with/without that harness, scored on the same hidden+visible suite. Fairness
guards: generator sandbox excludes the hidden test; generated `harness/` removed before scoring.

| case | no-harness | gen-harness | baseline tok | harness tok |
|---|---|---|---:|---:|
| billing-tax | 80, 8/8 | **80, 8/8** (tie) | 1.02M | 2.09M |
| lsp/case-015 | 85, 9/9 | **81, 7/9** (loss) | 2.05M | 6.30M |

Combined: baseline 82.5 / pass-frac 1.00; gen-harness 80.5 / 0.889; tokens ~2.7x; wall-clock 2.0-2.4x;
zero crashes both arms.

**This is the strongest negative yet, because the mechanism worked perfectly.** On billing the generator
produced a rigorous task-specific verifier (checklist named every subtle rule; selftest asserted them with
concrete values incl. banker's 0.5->0 ties), the build satisfied it (selftest green, no repair), hidden
passed 8/8 — and it produced an EXACT tie with no-harness (all 8 tests AND all 10 dimensions identical) at
~2x cost. On lsp gen-harness actually LOST (7/9 vs 9/9) at ~3x cost: the generated selftest covered the two
failing rules (#7 syntax-recovery, #9/#10 prefix+signature completion) and passed, yet the real hidden
tests for those rules failed — **Goodhart**: the generated verifier is a lossy proxy of the spec, "make the
selftest pass" invited overfitting to that proxy plus a false done-signal, so the solver stopped BELOW a
baseline that read the prose spec directly. (Honest caveat: lsp harness arms are noisy across experiments —
6/9, 9/9, 7/9 — so this is partly variance; the robust fact is baseline is consistently 9/9 and harness
forms average below it.)

Sharper WHY: a harness adds value by SURFACING requirements. When the spec is fully given as RULES.md, a
strong high-reasoning baseline already extracts all of it, so a generated verifier only re-packages the
same information at extra cost — and can hurt by becoming an overfit target.

## Grand conclusion (7 experiments, 3 cases, 2 models, 4 harness forms)

The supergoal harness — single-process, INLINE, fan-out, or task-specific generated verifier — at best
**matches** a strong baseline on functional correctness and **never beats it**; it always costs more
(2-3x tokens, 2-4x wall-clock). The generated-verifier form can even do WORSE (lsp 7/9 vs 9/9) via Goodhart
overfitting to the generated proxy. Its one durable positive is the INLINE fix preventing the original
crash. Every case is self-contained with an explicit RULES.md spec — the regime SKILL.md says to skip — so
this whole line under-tests the skill's intended multi-file / implicit-domain value. The mechanism is now
clear: a harness only helps when requirements must be SURFACED; an explicit spec hands them to the baseline
for free, leaving no headroom. The only place the skill could still win is a real repo with undocumented
domain rules (LEGACY/LEARN-DOMAIN), where the baseline cannot extract the spec for free — which a one-shot
self-contained eval cannot reproduce.

## Still open
- The one untested regime: a real multi-file repo with implicit/undocumented domain rules.
- The adversarial verify+repair role never ran (transient codex infra crash both times); its unique
  value is still unmeasured, though plan+build already matched baseline.
- Fair domain test: a real repo with implicit/undocumented domain rules (the eval format hands explicit
  specs to the baseline for free, under-testing the skill's intended domain advantage).
- Confirming run: gpt-5.5-high + original skill (expected to reproduce the crash).
- Consider whether INLINE's efficiency is under-verifying subtle requirements (billing 6/8 with half the
  tokens) — add spec-derived verification, not just running the provided visible tests.

## Decision: baseline-first rewrite (strip the disproven gated ceremony)

Acting on the grand conclusion, replaced the gated build/debug machinery with a **baseline-first default
loop** and deleted only the forced ceremony the evals disproved. Scope settled over four user rounds:
keep every separate-purpose capability, strip only the build/debug gates.

**Deleted (12 files):** `templates/{human-feedback-gate.mjs, delivery-gate.sh, validate-gate.sh,
circuit-breaker.mjs, cycle-bound.mjs, state.json}`, `reference/{pipeline.md, vault.md, experts.md,
quality-gates.md}`, `agents/{verifier.md, completeness-critic.md}`. (Git-recoverable; not a separate
history rewrite.)

**Kept (explicit user carve-outs):** HARNESS-MAKE/HARNESS-EVAL utilities, SKILL-MINE, QA-ONLY, LEARN/
LEARN-DOMAIN, `code-reviewer`/`security-reviewer` agents, domain-context/-rules. Grep confirmed the
utilities are self-contained (reference only their own templates), so they survive the deletion intact.

**Rewrote** `SKILL.md` (baseline-first: frame -> surface hidden requirements -> smallest change, test-first
-> verify vs the REAL tests + prose spec, never a generated proxy -> stop on green; all modes still routable)
and `README.md` (dropped the gated-pipeline/committee narrative; documents baseline-first + the evidence).
**Patched** three kept files for dangling links to deleted items: `reference/learn-domain.md` (made the
ground/completeness steps self-contained, dropped `experts.md`/`verifier`/`completeness-critic` refs),
`reference/debugging.md` (dropped the `vault.md` ledger pointer), `agents/analyst.md` (dropped
`validate-gate.sh`, now "confirm demand/scope with the user").

**Rationale:** a harness adds value only by SURFACING requirements; an explicit spec hands them to a strong
baseline for free (no headroom), and a generated proxy verifier can actively hurt (Goodhart). The
baseline-first loop keeps the one durable lever (surface hidden rules) and the only verification that
helped (re-run the project's real tests), and drops the rest.

**Note / next:** HARNESS-MAKE was kept on "no direct evidence" — it was never itself an experiment (the
gen-harness eval generated a spec-derived *verifier*, not a HARNESS-MAKE agent-team). Open follow-up:
use HARNESS-MAKE to generate a harness-agent and A/B it vs a no-harness baseline-agent on the eval cases
to get that direct evidence.

## HARNESS-MAKE eval result (billing) - direct evidence

Ran that follow-up (`docs/experiments/2026-06-07-harness-eval-harnessmake/`). A `codex exec` ran
HARNESS-MAKE proper (read `reference/harness-make.md` + `harness-patterns.md` + the case) and designed a
3-role pipeline to `.harness/pipeline.json`; phase 2 executed it as fresh codex roles vs a no-harness
baseline, scored on the same hidden+visible suite.

billing: baseline 80, 8/8, 1.73M tok / 139 s; **HARNESS-MAKE 80, 8/8, 3.89M tok / 395 s** (design 0.36M +
planner 1.06M + implementer 1.24M + adversarial-reviewer 1.21M). **Exact tie - all 8 tests and all 10
dimensions identical - at ~2.25x tokens / ~2.8x wall-clock.** `design_ok=true`: the designed pipeline
(planner -> implementer -> adversarial-reviewer) was sound, anti-Goodhart (briefs name RULES.md + real
tests as source of truth), crash-free, and hit 8/8 - so this is a clean direct measurement, not a degraded
run. lsp/case-015 then **lost**: baseline 85, 9/9, 3.96M tok / 239 s; **HARNESS-MAKE 80, 7/9, 11.62M tok /
860 s** (~2.9x tok / 3.6x wall). `design_ok=true`, a 4-role pipeline (planner -> implementer -> qa-reviewer
-> adversarial-reviewer) with TWO review roles - and it still missed the exact same two hidden rules the
gen-harness verifier missed (prefix-filtered completion signatures; syntax-recovery semantic diagnostics).
The review roles caught nothing the baseline got for free reading the whole prose spec in one context;
role decomposition fragments attention and loses holistic coverage.

n=2 combined: baseline avg 82.5 / pass-frac 1.00; HARNESS-MAKE avg 80 / 0.889; ~2.7x tokens; up to 3.6x
wall-clock; zero crashes. **HARNESS-MAKE reproduces the universal pattern - tie then loss, never a win - at
~2.7x cost, with a clean well-designed pipeline each time (failure is structural, not execution).**

Caveats: n=2 (billing + lsp); and this measures HARNESS-MAKE output as a one-shot coding harness on
explicit-spec tasks - a subset of its stated purpose (designing *reusable* harnesses for ongoing
workflows), which a one-shot eval cannot capture.

## Live re-run: new baseline-first skill vs plain codex (case-015 LSP) - `docs/experiments/2026-06-07-harness-eval-lsp-skill-vs-baseline/`

First INLINE run of the post-rewrite baseline-first `SKILL.md` against a no-skill baseline on the hard LSP
case (spark-high, fresh sandboxes, hidden tests injected after each arm; harness arm confirmed to read
`harness-ref/SKILL.md` 3x and route via the skill).

| arm | quality | real tests | false-GREEN | tokens | wall | crashed |
|---|---:|---|---:|---:|---:|---|
| baseline | 81 | 7/9 | 2 | 1.49M | 174 s | no |
| harness | 82 | 8/9 | 1 | 2.56M | 190 s | no |

**Harness narrowly WON this single run** (pass-count + quality + one fewer false-GREEN) at 1.72x tokens.
The win is the hidden `completion prefix + signatures` rule, which baseline shipped broken and the harness
caught after recording explicit assumptions (the skill's surface/verify discipline). Both arms still miss
the hardest hidden rule (syntax recovery + semantic diagnostics).

**Still `Not proven`, and within noise.** Same model/effort/case INLINE run in Exp B was baseline 81/7/9 vs
**harness 82/6/9** - the harness arm there *lost* the test vector. Across runs of the same config the harness
arm swung 6/9 -> 8/9, so a +1-test/+1-point delta is variance, not a proven lift. Robust cross-run facts
hold: baseline extracts the explicit spec cheaply (this baseline 7/9 at 1.49M tok is the cheapest yet), the
harness always costs more, and the hardest hidden rule defeats both. What this run uniquely adds: the first
INLINE data point where the skill's verify discipline beat the baseline on the vector rather than tying/
losing - directionally the mechanism the skill claims, but n=1.

## Experiment #1: underspecified greenfield (n=3) - `docs/experiments/2026-06-07-harness-eval-underspecified/`

Tested the hypothesis that thin prompts (no RULES.md) create headroom for the skill's requirement-surfacing
step. 3 cases (csv RFC4180, lru recency, semver prerelease/build), visible=happy-path only, hidden=implicit
standard behavior injected after each arm. Pre-flight proved stubs fail visible and reference impls pass all.

| case | baseline hidden | harness hidden | b/h quality | b/h tokens |
|---|---|---|---|---|
| csv | 5/5 | 5/5 | 82/82 | 335k/687k |
| lru | 4/4 | 4/4 | 85/82 | 229k/587k |
| semver | 5/5 | 5/5 | 85/85 | 624k/1010k |
| agg | 14/14 | 14/14 | 252/249 | 1.19M/2.28M (1.92x) |

**Hypothesis REFUTED - all three are ceiling effects** (both arms 14/14). Reason: the implicit requirements
were PUBLIC domain standards already in the strong model's training, so a thin prompt doesn't hide them; the
baseline implements them perfectly unaided. The skill added zero correctness, slightly lower coarse quality,
at 1.92x tokens. Confirms the skill's own "skip for trivial tasks" guidance.

Sharpened conclusion (now n=4 fresh cases today): the only harness win all day was lsp prefix-completion -
a requirement UNDER-SPECIFIED by the visible test. Headroom exists only where the requirement is genuinely
unknown to the model. Per "update skill if proven more effective": **bar not met, no effectiveness edit made.**
Next real test = repo-local / proprietary implicit rules (LEGACY regime), where the requirement is not public
knowledge and not in the model's head.

## harness-eval corpus fixed to validated RevFactory hard/expert cases only

Per user direction, `reference/harness-eval.md` now mandates drawing every eval case from the validated
RevFactory specs in `templates/harness-eval-cases/` (the 15 seeded cases) - never inventing ad-hoc cases.
Use the discriminating tier only: expert 007-015 (interpreter, microservice, sql-engine, crdt, raft-kv,
spreadsheet, bytecode-vm, event-sourcing, lsp) + hard 002/005. Rationale: today's csv/lru/semver ad-hoc
cases all ceiling-out (14/14 both arms) and prove nothing; the RevFactory expert cases are upstream-validated
discriminators. Added a matching Reject bullet ("Inventing ad-hoc eval cases ..."). Only case-015-lsp has a
runnable fixture; the rest are specs needing fixtures authored from the case-015 fixture+scorer shape.

## Verifier-loop reconciliation (DONE)

Demoted the adversarial-verifier + repair loop from a PRESCRIBED eval stage to RECORD-ONLY, consistent with
baseline-first: `reference/harness-eval.md` (pipeline line 54 drops "Adversarial Verify -> Repair Loop";
step 4 reframed "the eval does NOT impose a verifier/repair loop - record whatever the harness ran
natively"), report template (`## Adversarial Verification Loop` -> `## Verification (harness-native + ground
truth)`), and contract test (repointed the SKILL.md pipeline assertion to the new verifier-loop-free pipeline
in harness-eval.md). Ground-truth verification (machine + hidden checks, applied equally to both arms) is
preserved. `tests/harness-eval-contract.test.sh` now **126 passed, 0 failed** (was 125/1).

Separate PRE-EXISTING dead-test debt (NOT from this session - confirmed by stashing these edits and
re-running): the baseline-first + HARNESS-MAKE removals left tests for deleted features failing -
`tests/harness-make-contract.test.sh` (0/14, removed HARNESS-MAKE), `tests/harness-contract.test.sh` (0/16,
removed HARNESS-MAKE references reference/harness-make.md etc.), `tests/gate-scenarios.test.sh` (34/69,
exit 127 = removed validate/delivery gate scripts). These assert removed code; they should be deleted or
reconciled in a dedicated cleanup.

## 5-CLI cross-harness eval (gpt-5.5 @ low) — new

`docs/experiments/2026-06-07-harness-eval-5cli-gpt55-low/` (run.mjs, orchestrate.sh, results.md,
report.md, result.json, raw/).

### What / why
User asked: same gpt-5.5 at low reasoning across five wrappers — oh-my-pi (omp), hermes, bare codex,
codex+AGENTS.md rules, codex+supergoal — on a hard RevFactory task; accurate scoring, recommend best.
Extends the 2-arm case-015 scorer to 5 arms. Same fixture/hidden-tests/9-checks/v2 scorer; the ONLY
variable is the wrapper. All five reach the SAME gpt-5.5 via the local headroom proxy (codex `/v1`,
hermes `/backend-api/codex`, omp `openai-codex/gpt-5.5`), so it is a clean A/B/C/D/E on the harness.

### Decisions / reasoning
- Reused the proven case-015 fixture+scorer verbatim; only arm-runners + per-adapter cost parsing +
  5-way reporting are new. Reuse over reinvention; keeps results comparable to prior runs.
- Arm isolation: bare/supergoal suppress global `~/.codex/AGENTS.md` via `project_doc_max_bytes=0`;
  agents arm loads it (= the user's Ten Commandments). Verified clean from transcripts (signature
  text `Ten Commandments`/`CodeGraph`/`baseline-first` present only where intended; the "supergoal"
  hits in the bare log were the sandbox PATH, not skill use).
- hermes reasoning isn't a CLI flag — orchestrate.sh backs up `~/.hermes/config.yaml`, sets
  `reasoning_effort: low`, runs, and restores on EXIT trap (verified restored to xhigh; no permanent
  mutation). codex uses `-c model_reasoning_effort=low`; omp uses `--thinking low`.
- omp `--mode json` re-emits the full accumulated message per token delta (O(n^2); 64–106 MB). The
  first run hit node's `spawnSync` maxBuffer and killed omp mid-implementation (a HARNESS bug, not an
  omp failure) — reran omp streaming stdout to a file fd and parsing only the final `agent_end` line,
  then trimming the log. The corrected omp run finished cleanly at 7/9.
- Tokens are NOT cross-CLI comparable (codex=final cumulative; omp=summed-per-turn, inflated;
  hermes=not exposed in -Q). Ranked on wall-clock + tool-calls + result instead.

### Result (n=1, directional)
4-way tie at 7/9 / quality 81: bare codex, codex+supergoal, ohmypi, hermes. codex+AGENTS.md is the sole
loser (6/9, q79) AND costliest (1.52x bare tokens, longest wall-clock, most tool calls). Every arm
shipped false-GREEN (visible 5/5, 2–3 hidden behaviors broken); `completion prefix+signatures` missed
by all five (a model/effort ceiling — prior high-effort run got it). Treatments only reshuffle WHICH
hidden test passes, never raise the count above bare.

### Recommendation
Best overall = bare codex (top result, lowest codex cost, simplest); hermes matches it with the lowest
wall-clock/fewest tool calls. Added rule/skill scaffolding adds cost without lifting the score; the
coding-rules AGENTS.md is net-negative for this task class at low effort. The real lever for the
unshipped hidden behaviors is reasoning effort, not the harness. Corroborates the existing
baseline-first finding across a broader, cross-CLI configuration. n=1 ⇒ directional, not proven.

## Looped self-improvement vs single run (bare codex, gpt-5.5 @ low) — new

`docs/experiments/2026-06-07-codex-loop-vs-single-gpt55-low/` (run.mjs, results.md, report.md,
result.json, raw/).

### What / why
User: on ONE task (case-015 LSP), compare bare codex run once vs bare codex + 3 fresh-context
review/verify/improve loops over the same code. Same model/effort/fixture/scorer as the 5-CLI eval.

### Decisions / reasoning
- loop = build pass + 3 improve passes; each improve pass is a fresh `codex exec` reading the current
  files (no shared context), told to review vs task + visible tests and fix gaps; npm test each time.
  single = build pass only. Build prompt identical across arms (loop == single + extra passes).
- Score snapshotted after EVERY pass to capture the improvement trajectory, on a throwaway COPY so the
  loop never sees hidden tests.
- YARDSTICK FIX: an initial run produced "10/9" because an improve pass added its own tests to the
  visible suite, inflating the denominator. Fixed scoreSnapshot to restore the CANONICAL visible+hidden
  tests on the scoring copy, so a loop cannot change the yardstick (test_coverage becomes a neutral
  constant). Re-ran after the fix.
- n = 3 single seeds + 2 loop seeds (loop is 4 passes/run, token-heavy).

### Result (directional)
single: 6-7/9 (mean 6.67), ~493k tok, ~181s. loop final: 7/9 both seeds, ~3.24M tok (6.6x), ~991s
(5.5x). Trajectory: s1 6->7->7->7, s2 7->7->7->7. Looping never exceeded the single-run ceiling (7/9);
only the first loop helped, and only by rescuing a below-median draft (6->7); loops 2-3 added source
lines but no score. No pass ever cleared `completion prefix+signatures` (the gpt-5.5-low ceiling); loop
finals also still miss `parser recovery`.

### Recommendation
3-loop self-improvement not worth it for spec-complete tasks at low effort: same 7/9 as one run at
5-7x cost. Its only benefit (variance reduction, rescuing a bad draft) is cheaper via re-rolling a
single run. To break above 7/9, raise reasoning effort, not loop count - re-running the same model at
the same effort plateaus at its ceiling. Same lesson as 5-CLI: spend budget on effort, not added
iteration/machinery. Corroborates baseline-first.

## Archon workflow vs plain Claude — case-015 LSP (claude-vs-claude, n=1) — new

Dir: `docs/experiments/2026-06-07-harness-eval-archon-workflow-vs-baseline/`.

### What / why
Tested whether driving an agent through an **Archon** workflow (coleam00/Archon v0.4.1, the
agentic-coding CLI that runs workflows in git worktrees) beats a plain agent on a hard task. The
harness under test is the Archon workflow itself (not the supergoal skill).

### Codex was structurally infeasible — pivoted to claude-vs-claude
Original plan was codex `gpt-5.3-codex-spark` (to match the pi cross-agent matrix). Proven impossible
on ChatGPT-subscription auth: codex then offers only the **spark** family, and Archon's bundled
`@openai/codex-sdk` always attaches an `image_generation` tool that spark rejects (**HTTP 400**).
Plain `codex exec` is unaffected (never attaches it). Not fixable by Archon version (v0.3.10==v0.4.1),
codex binary swap (0.42 -> 401; 0.137 -> 400), or `~/.codex/config.toml [tools] image_generation=false`;
non-spark models are "not supported with a ChatGPT account"; no API key per constraint. The **claude**
provider runs end-to-end locally (global auth, SQLite, no Docker/Supabase/key), so the question was
tested claude-vs-claude with model held constant = `sonnet`.

### Setup
baseline = plain `claude -p` (no Archon). harness = same sonnet model via a single-node Archon workflow
calling the bundled `archon-implement` command, `--no-worktree` in a git-init'd sandbox. Forked the
existing supergoal harness runner; only the two arm executors + cost parsing changed. Codex auth recipe
discovered (now moot): Archon needs `CODEX_*` stripped from `~/.archon/.env` so codex self-auths, plus
`CODEX_BIN_PATH` at an OAuth-capable binary. First baseline attempt was rate-limited ("session limit");
re-ran clean after reset (both arms crashed=false).

### Result (this run)
Identical machine-check vector: both 6/9 behavior + 3/3 syntax = 9/12. Quality 83 (baseline) vs 82
(harness) — one point on `error_handling`, scorer noise. Both miss the SAME 3 hidden rules (completion
prefix+signatures, local-scope definition, syntax-recovery diagnostics). Wall-clock: baseline 434 s vs
harness **546 s (+26%)**. Harness tokens not surfaced by Archon's CLI log (unmeasured, not zero); baseline
657k tok exact.

### Decision
**Not proven — no harness benefit observed.** The Archon workflow caught nothing the plain baseline
missed, tied on the test vector, was a point lower on quality, and cost more wall-clock. Confound noted:
baseline (claude CLI) loads the user's global CLAUDE.md while the Archon SDK path does not — a mild edge
to the baseline, not the harness. Consistent with baseline-first: workflow ceremony costs more without
beating a strong baseline on an explicit-spec task. (Notably the supergoal skill harness on this same
case once caught the prefix-completion rule; the Archon workflow did not.)

## Role-separated loop beats the ceiling (bare codex, gpt-5.5 @ low) — new

`docs/experiments/2026-06-07-codex-roleloop-vs-baseline-gpt55-low/` (run.mjs, results.md, report.md,
result.json, raw/).

### What / why
Follow-up to "naive loop = no lift". User picked option A: a role-separated loop that stays at low
effort but gives the loop an independent signal. role_loop = build + critic -> fixer -> verifier
(fresh context each): critic writes spec-derived FAILING tests (no src edits), fixer makes them pass
(no test edits, no padding), verifier guards regressions. Compared to single + the prior naive band on
the same case-015/gpt-5.5/low.

### Decisions / reasoning
- Yardstick fixed: score on a copy whose test/ dir is reset to canonical visible+hidden, so the
  critic's generated tests can't move the denominator or test_coverage, and Goodhart (fixer optimizing
  to wrong critic tests) would show as a canonical DROP. None observed (visible stayed 5/5).
- Lean run after a proxy stall: an initial 14-pass run hung when the headroom proxy degraded ("failed
  to refresh available models"), a pass sat ~19 min at 0% CPU. Killed it, smoke-confirmed proxy
  recovery, set per-pass timeout to 8 min, reran single x1 + role x2 (naive reused from sibling run).

### Result (directional, n=2 role)
role_loop 8-9/9 (mean 8.5, q82-85), tokens ~2.91M, ~811s. Trajectory s1 6->6->8->8, s2 8->8->9->9.
First config in the whole series to exceed 7/9 from a loop AND to hit a perfect 9/9. Beats naive_loop
(7/7, ~3.24M tok, ~991s) on BOTH outcome and cost. critic never moves the score (no src edits); fixer
carries the jump; verifier == fixer both seeds (redundant -> droppable, ~25% cheaper).

### Headline finding (refines prior conclusion)
`completion prefix+signatures` was missed by EVERY arm in every prior experiment (5-CLI, single,
naive) -> earlier called a "gpt-5.5-low capability/effort ceiling, raise effort." WRONG: role_loop s2
cleared it at the same low effort. It was a SIGNAL ceiling - no arm had a failing test for it (the
visible completion test only probes an empty prefix). The critic turned the prose requirement into a
failing test; the fixer cleared it. So the missing lever was independent signal, not effort.

### Recommendation
To beat the single-run ceiling without raising effort: role-separated loop (author-independent critic
writes spec-derived failing tests -> fixer, no padding). Confirms supergoal's "surface hidden
requirements" (made executable) is the one move that beats a strong baseline; refines "loops don't
help" to "naive loops don't; critic->fixer does." Still ~4-6x a single run's tokens. n=2/1 case ->
replicate (more seeds + a 2nd expert case) before treating as proven.

## Default loop -> role-separated (SKILL.md) — applied

Made the role-separated loop the DEFAULT for GREENFIELD/DEBUG/LEGACY in SKILL.md, per the role-loop
eval result (build -> independent critic writes spec-derived FAILING tests -> fixer clears them, no
padding -> verify vs ground truth). Added `reference/role-loop.md` (procedure + guardrails) and a
reference-map row; mapped roles to existing personas (code-reviewer/executor/qa-auditor).

Kept SKILL.md lean per user direction: it is an operational guide for a coding agent (feature/debug/
legacy/learn/...), so NO experiment paths, eval numbers, or rationale in it - those live here in the
changelog and under docs/experiments/. Core principle reconciled with baseline-first: the critic's
generated tests SURFACE hidden requirements but are NOT the acceptance oracle; final verification stays
the project's REAL tests/spec, never a self-graded proxy (this is why it is not the "generated proxy
verifier" the skill warns against).

Verified no regression: tests/harness-eval-contract.test.sh 126/0 with the edits; the other contract
suites that fail (worktree 0/17, interview 14/12, domain-context, learn, etc.) fail IDENTICALLY at HEAD
without these edits - confirmed by stashing SKILL.md and re-running - so they are pre-existing dead-test
debt from the baseline-first/HARNESS-MAKE removals, not caused by this change.

## Harness eval: skill vs baseline across medium / hard / expert

User asked for an eval on 2 medium tasks with vs without the skill. Flagged the methodology tension
(reference says only hard/expert discriminate; medium ceilings) and user chose 1 medium (003) + 1 hard
(002). Built two NEW clean-slate runnable fixtures (corpus had only spec yamls before): case-003
calculateInvoice spaghetti-refactor (starter passes 14/14; measures behavior preservation), case-002
AsyncCache in-flight-dedupe race (starter 3/3 visible, 2/5 hidden; hidden tests catch over-serialization
on a global lock + concurrent-callers-must-all-reject). Validated both starters discriminate before
spending compute (`SG_EVAL_VALIDATE=1`). New parameterized runner
`docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/run.mjs`: baseline=single bare
pass; harness=skill's default role-separated loop (build w/ stripped skill-ref -> critic -> fixer ->
verifier). Fixed the latent skill-ref leak (prior runner copied templates/; stripped to
SKILL.md+reference+agents so the harness arm can never read hidden tests/scorer).

Results (ground-truth scoring, label-blind machine scorer):
- 003 medium @ gpt-5.5/low: baseline 14/14, harness 14/14, q80/80. Harness 4.7x tokens, 9x wall-clock.
- 002 hard @ gpt-5.5/low: baseline 8/8, harness 8/8, q85/83. Harness 2.1x tokens, 2.2x wall-clock.
- Both ceiling — gpt-5.5 solves them without help; the role-loop adds only cost. No false-GREEN.

User then asked for a harder task, then specifically the spark (lower-intelligence) model. Ran case-015
LSP (expert) @ gpt-5.3-codex-spark/high, reusing the proven gpt55-low runner (single-pass baseline vs
single-pass skill-ref) with one changed variable = effort, plus the templates/ strip:
- 015 expert @ spark/high: baseline 11/12, harness 11/12, q85/85. Both miss the SAME hidden requirement
  (parser error-recovery + semantic diagnostics). Harness -34% tokens / -31% time. NO crash (clean
  110-line log vs the pre-INLINE skill's documented 191-267-line crash with leaked yaml).

Decision: Not proven in every regime — the skill never beats a capable baseline on correctness/quality
on explicit-spec tasks (consistent with baseline-first thesis). Demonstrated value is narrow: (1) the
INLINE fix prevents the high-effort context crash (re-confirmed clean at spark/high); (2) the single-pass
skill-ref form is ~30% cheaper for the same result on a weaker/high-effort model. The 4-pass role-loop
buys no correctness here and costs 2-5x; reserve it for UNDER-specified tasks where the critic has hidden
requirements to surface (the untested regime). Cost direction across rows is partly a design confound
(low rows = 4-pass role-loop; spark row = 1-pass skill-ref), called out in results.md. Caveats: small n
(low n=2, spark n=1); explicit-spec only. Did NOT promote the new 002/003 fixtures into templates/ or the
skill — pending user consent. Writeups: the two experiment dirs' results.md / report.md.

---

## docs: align README + landing with current baseline-first skill (state-only, no before/after)

User asked to update README and the landing page to the current updated supergoal skill, explicitly
"current state of the change, no mention of how it was previous, just at its current state."

SKILL.md was already the clean current spec (baseline-first, 8 modes, role-separated critic->fixer->verify
loop). The drift was in the public-facing docs:

- README.md / README.ko.md still framed the rewrite as a before/after ("why the gated machinery is gone",
  "used to run a heavy gated pipeline", "Earlier gated runs (historical)", "predate the baseline-first
  rewrite / describe the removed machinery"; examples/url-shortener tagged "earlier gated version").
- docs/index.html (landing) was wholesale stale: it advertised the REMOVED machinery as the live product
  — 7 hard gates, Human Feedback gate, Builder!=Verifier, delivery-gate.sh exit 0, circuit breaker,
  claims.md/verification.md/state.json vault, a 9th HARNESS-MAKE mode, "Decision: GO".

Changes (describe only what the skill is now):
- README*: replaced the "(why the gated machinery is gone)" section with "What it adds over a plain
  baseline"; rewrote the default-loop line to name the role-separated Frame->Build->Critic->Fixer->Verify
  steps; retitled "Evidence & history" -> "Evidence" (kept the eval grounding, dropped the historical
  pipeline archaeology); relabeled examples/url-shortener neutrally.
- index.html: meta/OG retitled to "the smallest correct change, verified"; gatebar -> verify/ground-truth;
  hero copy + console (LEGACY critic->fixer->verify, exit 0) + telemetry (hidden reqs surfaced / diff
  minimal / real suite green); ticker -> baseline-first slogans; metrics 9/7/0/68 -> 8/1/0/<=3; workflow
  claims + route-map -> the 5-step loop (Critic = red); modes 9->8 (dropped HARNESS-MAKE, repiped the rest
  to the current loop); "gate stack" section -> "Not a gate stack. Five principles."; vault -> "Bundled
  roles / load what the phase needs" with real file chips + a loop ascii; proof section reframed from
  historical gated runs to "what each lane looks like" (GREENFIELD/DEBUG/LEGACY behaviors); install pills
  literal-gates -> real tests; canvas nodes Intake..Deliver(6) -> Frame..Verify(5), red node = Critic,
  connector lines re-indexed to avoid the now-out-of-range pts[5].

Verified: grep shows no residual removed-machinery terms except the intentional "Not a gate stack"
heading; tag balance holds (article 16/16, div 69/69, pre 5/5, section 7/7, en/ko spans 63/63);
structural counts match (8 mode cards, 5 principles, 3 proof cards, 5 route steps).

## Under-specified n=3 eval + equal-compute control — the "win" was compute, not the skill

Follow-up to the medium/hard/expert ties: tested the hypothesis that the harness's only correctness
lever (critic surfaces UNSTATED requirements) needs an under-specified task. Authored 2 latent-correctness
fixtures (`docs/experiments/2026-06-07-harness-eval-underspecified-n3/`, cases u1/u2 in run.mjs), validated
3-way (stub fails / reference passes / lazy fails the discriminators) before running. baseline=single
literal pass vs harness=role-loop, gpt-5.5/low, n=3 per arm.

- u1 deepMerge: vs the 1-pass baseline, harness hidden 3.3/4 vs 2.3/4 - the gap is the prototype-pollution
  guard + null-source (baseline shipped the `__proto__` vuln 2/3 as a false-GREEN). LOOKED like a skill win.
- u2 csvLine: TIE, 5/5 both arms every seed (CSV quoting is canonical -> baseline does it unprompted).

Then ran the equal-compute control (naive build+3-review, NO skill, 4 passes = same budget as the role-loop)
on u1, n=3: naive scored 4/4 EVERY seed, 0 false-GREEN - BETTER than the skill's role-loop (3.3/4). So the
u1 gap was COMPUTE, not the skill: plain iteration catches proto-pollution + null at least as well, and the
role-loop's critic->fixer serialization actually left null unfixed 2/3. CORRECTED conclusion: across the
ENTIRE 2026-06-07 sweep there is NO regime where the supergoal role-loop beats an equal-compute no-skill
baseline. This is exactly why the equal-compute control is now mandatory in the skill (the
`harness-eval-underspecified-n3` result is cited there as the worked example).

Balanced reading (user's point, folded into the skill + writeups): the equal-compute result is a
MECHANISM note, not "the skill is useless." Vs the REALISTIC default - a single one-shot pass, which is
what a user gets by NOT invoking the skill - the skill IS useful: it forces the verification a one-shot
skips and caught the prototype-pollution vuln the baseline shipped as a false-GREEN (3.3 vs 2.3). Forcing
useful compute is legitimate value. The control only shows the active ingredient is the extra passes, not
the role-separation (naive 4/4 >= role-loop 3.3/4), so the mechanism could be leaner. Two distinct claims,
both now required in the eval methodology: (a) skill vs one-shot default, (b) mechanism vs equal compute.

## Skill update (per user request: "remember to do eval this way next time")

`reference/harness-eval.md`: added two sections - "Pick a discriminating regime" (lever =
spec-completeness x baseline strength, not difficulty tier; make the baseline struggle; latent-correctness
vs canonical; n>=3 because a +-1-test n=1 delta is noise - case-015 read 8/9-vs-7/9 one run, exact tie the
next; equal-compute control or stated cost multiple; role-loop vs skill-ref arm choice) and "Validate the
fixture discriminates BEFORE spending compute" (stub fails / reference passes / lazy fails). Reconciled the
"never invent cases" rule to sanction authored latent-correctness fixtures gated on the 3-way check. Added
the deepMerge-vs-CSV evidence inline. Added 4 Reject bullets (n=1 +-1 "win"; unequal-compute crediting;
unvalidated authored fixture). harness-eval-contract.test.sh still 126/0. Did NOT promote the new fixtures
into templates/ or change SKILL.md - methodology lives in the reference + here, per the lean-SKILL rule.

## LEARN prompt refresh (per user request: merge a new tutoring prompt into both LEARN prompts)

User supplied a revised tutoring prompt. Net-new behaviors over the prior LEARN design:
- **Core question** as a distinct opening hook - ask what problem the topic solves, then DO NOT wait;
  keep teaching, the lesson answers it. A thinking hook, not a test. This replaces the old Bridge
  "calibration question" (which the tutor waited on).
- **Exactly two questions per opening** - the core question (top) + the recap/check question (bottom);
  follow-up turns ask one recap question only. Stops mid-lesson question spray.
- **Bridge shrinks to a one-line analogy** (no calibration question).
- **Richer opening format** - top `먼저 스스로 답해볼 질문:`, a `결과:` line closing the trace, and a
  bottom `마지막으로 확인:` recap line.
- **Code topics**: explain existing code first, name bugs separately - never silently rewrite.
- Dropped the internal `atom`/`원자` jargon in favor of "smallest useful pieces" / "key-terms map",
  matching the new prompt (user-facing `원자` was already banned).

Changed:
- `docs/learn-standalone-prompt.md` (the simple/standalone prompt) - rewritten to the new design while
  keeping the file's dense house style and the standalone invariant (no files/journal/profile/sub-agents).
- `reference/learn.md` (the in-skill LEARN workflow) - merged the same behaviors but kept all workflow
  infra: USER_PREFERENCE.md read/seed, read-only explore/architect sourcing, Journal-live step, goal-tool
  boundary. Surgical edits only, so all 8 contract-pinned strings survive verbatim. Also fixed the glossary
  separator `|---|---|` -> `|---|---|---|` (rendering bug in the block being edited).
- `tests/learn-contract.test.sh` - the 4 assertions targeting SKILL.md were stale: the baseline-first
  rewrite moved LEARN teaching detail out of SKILL.md into reference/learn.md, so they had been failing
  (8/4 at baseline). Retargeted them to reference/learn.md with the new-design vocabulary
  (`smallest useful pieces`, `process trace`, `Glossary alone is not enough`,
  `avoid exposing the literal label 원자`). Did NOT re-add LEARN detail to SKILL.md - respecting the
  deliberate lean-SKILL design.

Verify: `tests/learn-contract.test.sh` 8/4 -> 12/0. Full suite pass 172 -> 176, fail 55 -> 51 (only
learn-contract changed; every other mode's pass/fail count is identical to baseline - no regression).
