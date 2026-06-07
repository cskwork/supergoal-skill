# HARNESS-MAKE eval: does a harness DESIGNED by HARNESS-MAKE beat no-harness?

Closes the gap the gen-harness eval left open. gen-harness generated a spec-derived *verifier*; here the
design phase runs **HARNESS-MAKE proper** - a `codex exec` that reads `reference/harness-make.md` +
`harness-patterns.md` and the case, then emits a task-specific role pipeline to `.harness/pipeline.json`.
Phase 2 executes that generated pipeline as fresh codex roles sharing the sandbox, vs a no-harness
baseline. Same v2 scorer, same hidden+visible suite. The design phase never sees the hidden tests; the
executed roles are told to verify vs the REAL tests, never a generated proxy (anti-Goodhart).

Model gpt-5.3-codex-spark high.

## billing-tax

| arm | score | tests | tokens | wall | notes |
|---|---:|---|---:|---:|---|
| no-harness | 80 | 8/8 | 1.73M | 139 s | one pass |
| **HARNESS-MAKE** | 80 | **8/8** | 3.89M | 395 s | design 0.36M + planner 1.06M + implementer 1.24M + adversarial-reviewer 1.21M |

**Exact tie - all 8 tests AND all 10 dimensions identical - at ~2.25x tokens and ~2.8x wall-clock.**

The mechanism worked perfectly. `design_ok = true`: HARNESS-MAKE designed a sound, non-trivial 3-role
pipeline - **planner -> implementer -> adversarial-reviewer** - whose briefs name `RULES.md` + the real
visible tests as the single source of truth (no invented proxy checklist), correctly call out the subtle
rules (minor-unit math, per-line bps discount, category tax, `max(0, subtotal - orderDiscount)`, shipping
placement), and execute cleanly (no crashes) to 8/8. So this is direct evidence, not a degraded run: a
genuinely good HARNESS-MAKE design produced **zero lift** over a no-harness baseline at more than double
the cost.

## lsp / case-015

| arm | score | tests | tokens | wall |
|---|---:|---|---:|---:|
| no-harness | 85 | 9/9 | 3.96M | 239 s |
| **HARNESS-MAKE** | 80 | **7/9** | 11.62M | 860 s |

**HARNESS-MAKE lost** - 7/9 vs 9/9 (80 vs 85) at ~2.9x tokens and ~3.6x wall-clock. `design_ok=true`; it
designed a 4-role pipeline (planner -> implementer -> qa-reviewer -> adversarial-reviewer) with TWO review
roles - and still missed the exact same two hidden rules the gen-harness verifier missed: "completion
filters by prefix and exposes function signatures" and "parser recovers from syntax errors and still
reports semantic diagnostics". The two review roles caught nothing the baseline got for free by reading the
whole prose spec in one context. Plausible mechanism: role decomposition fragments attention across slices
and loses the holistic spec coverage a single-context baseline keeps. (The planner role alone burned 4.16M
tokens; the run cost 11.6M total.)

## Combined (n=2)

| | no-harness | HARNESS-MAKE |
|---|---:|---:|
| avg score | 82.5 | 80 |
| avg pass-fraction | 1.00 | 0.889 |
| avg tokens | 2.85M | 7.76M (~2.7x) |
| wall-clock | lower | 2.8-3.6x |
| crashes | 0 | 0 |

## What this means

- This is the first **direct** measurement of HARNESS-MAKE (kept earlier on "no direct evidence"). Over
  n=2 it reproduces the universal pattern: **tie on billing, loss on lsp, never a win**, at ~2.7x tokens
  and up to 3.6x wall-clock. Same verdict as single-process, fan-out, and the generated verifier - now
  with a clean, crash-free, well-designed pipeline each time, so the failure is structural, not execution.
- The result is clean precisely because nothing went wrong - the design was sensible and anti-Goodhart,
  the execution was crash-free, the tests all passed. There was simply no headroom: the spec was explicit,
  so the baseline already extracted it, and a well-designed pipeline only re-packaged the same work.

## Caveats

- n=1 (billing). lsp/case-015 not yet run under HARNESS-MAKE.
- This tests HARNESS-MAKE's output **as a one-shot coding harness on a self-contained, explicitly-specified
  task** - a subset of its stated purpose (designing *reusable* agent teams / skill systems for ongoing
  workflows). It does not measure the reuse value of a persisted harness across many tasks.

Artifacts: `result-billing-harnessmake.json`, `run.mjs`, `raw/`. Generated pipeline preserved at
`/tmp/sg-harnessmake-eval/sandboxes/billing-tax/design/.harness/pipeline.json`.
