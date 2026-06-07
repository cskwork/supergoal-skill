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
