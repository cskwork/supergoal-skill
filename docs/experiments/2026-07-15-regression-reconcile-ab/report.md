# Regression-reconciliation A/B — old skill (eb1b5c7) vs new skill (8c01712)

Date: 2026-07-15 → 2026-07-16
Status: **correctness delta Not proven — all conditions saturate at this fixture scale; tie reported per contract.**

## Question

Does diff-driven regression reconciliation (consumer enumeration in `reference/qa.md`,
`scope-extension` tripwire in `agents/executor.md`, diff reconciliation + test-scope floor in
`agents/qa-auditor.md` / `reference/role-loop.md`, commit `8c01712`) reduce broken existing
behavior versus the pre-change skill (`eb1b5c7`)?

## Setup

- Driver: `driver.mjs` (imports `templates/harness-eval-runner.mjs`; codex-exec adapter,
  `gpt-5.5`, reasoning `low`, 720 s/pass timeout, serial, interleaved arms).
- Arms differ ONLY in skill-ref content (`git archive <sha> SKILL.md reference agents`);
  prompts, fixtures, seeds identical. INLINE profile: build pass (consults the arm's
  SKILL.md / role-loop.md / qa.md) + verify pass (consults the arm's qa-auditor.md / qa.md).
- Hidden tests never enter any sandbox; scoring resets `test/` to canonical visible+hidden.
- Stop policy predeclared; a crash surviving retries is a recorded loss. Zero crashes occurred.

## Runs

| run | case(s) | n/arm | arm | all-pass | false-GREEN | crash | tokens mean | s mean |
|---|---|---|---|---|---|---|---|---|
| default pair | 002 async-race + 003 refactoring | 6 | old | 6/6 | 0 | 0 | 695,638 | 144 |
| | | 6 | new | 6/6 | 0 | 0 | 881,975 | 164 |
| discriminator | 004 shared-format (authored) | 6 | old | 6/6 | 0 | 0 | 812,344 | 144 |
| | | 6 | new | 6/6 | 0 | 0 | 780,178 | 148 |
| control | 004, bare (no skill, 1 pass) | 6 | bare | 6/6 | 0 | 0 | 174,275 | 54 |

Ceiling probe: the first launch used claude-p/sonnet at default effort; its first unit (002-old,
the hard case) scored hidden 1.00 (`results-sonnet-ceiling-probe.json`), so the run was restarted
at the proven low/low discriminating configuration. Codex and claude token counts are not
comparable across adapters.

`sideeffect-004-shared-format` was authored for this experiment: a shared `formatMoney` helper
with consumers the task never mentions (`report.mjs` parseability, `export.mjs` CSV columns).
Variant validation discriminates as designed — starter fails visible 2/2 / passes hidden 4/4;
editing the shared default passes visible but fails hidden 4/4 (false-GREEN); a scoped fix passes
all. In live runs, however, every agent in every condition (old / new / bare, 18 units) made the
scoped fix and left `format.mjs` untouched (`src_snapshot` audit in results files).

## Four-axis accounting

- **Correctness**: old = new = bare, everything at ceiling. The treatment's target failure mode —
  the diff outgrowing the plan across files/iterations — does not occur in single-shot,
  ≤5-file, minutes-long sandboxes at gpt-5.5-low. **Not proven**, runnable-corpus ceiling recorded
  (per `reference/harness-eval.md`: both default cases tie → report Not proven).
- **Tokens**: default pair new +26.8% vs old; 004 new −4.0% vs old (noise). Both skill arms cost
  ~4.5× bare on 004. The new rules do not add a consistent token premium beyond the harness's
  existing overhead.
- **Wall-clock**: default pair +13.9% (164 s vs 144 s); 004 +2.8% (within noise).
- **Routing**: not exercised (no router change in the diff).

## Verdict

- The new rules did not regress anything measurable and carried no consistent extra cost, but
  their correctness benefit is **not demonstrable at this fixture scale** — even a bare
  single-pass baseline preserves unmentioned consumers here.
- The shipped behavioral guarantee for the change therefore rests on the contract tests
  (11 new greps in `tests/role-loop-contract.test.sh`, 154 passing), which pin consumer
  enumeration, scope-extension reporting, diff reconciliation, and the test-scope floor into the
  role contracts.

## Limits / follow-up

- Corpus ceiling: proving a delta needs a long-horizon fixture — multi-package repo, a task whose
  smallest fix genuinely spans unplanned files, hidden consumers only reachable through 2+ import
  hops, and enough surface that a verify pass cannot re-read everything. That is an authored-expert
  fixture project, out of scope for this run.
- The 004 starter's `format.mjs` comment ("Several modules depend on the exact plain output")
  likely telegraphs the trap; removing it and deepening the import chain is the first hardening
  step if this fixture is reused.
- Both skill arms shared the generic constraint block ("visible tests are NOT a complete spec"),
  which itself pushes toward neighbor checking in every condition, bare included.
