# Generated-harness eval (Option 1): does a TASK-SPECIFIC generated harness beat no-harness?

The generic supergoal skill showed no lift. New hypothesis: generate a harness *for this task* first, then
A/B no-harness vs generated-harness. Phase 1 (generate): a focused `codex exec` reads ONLY RULES.md +
visible tests + the stub and writes `harness/checklist.md` + `harness/selftest.mjs` (a spec-derived
verifier; it never sees the hidden tests). Phase 2 (A/B solve, scored on the SAME hidden+visible suite as
every prior experiment): A = one solve pass with visible tests only; B = solve with visible tests + the
generated harness, self-checking against `selftest.mjs` (1 bounded repair if it stays red).

Model gpt-5.3-codex-spark high, v2 scorer. Fairness guards: generator sandbox excludes the hidden test;
the generated `harness/` dir is removed before scoring; both arms scored identically.

## billing-tax (the case the generic single-process harness lost 6/8)

| arm | score | tests | tokens | wall | notes |
|---|---:|---|---:|---:|---|
| no-harness | 80 | 8/8 | 1.02M | 88 s | one pass |
| **gen-harness** | 80 | **8/8** | 2.09M | 178 s | generate 0.94M + build 1.15M; selftest passed, no repair |

**Exact tie - all 8 tests AND all 10 dimension scores identical** - while gen-harness spent ~2x tokens and
~2x wall-clock. This is a STRONGER negative than fan-out: there the verifier crashed (so "the mechanism
didn't really run" was an excuse). Here the generator produced a genuinely rigorous task-specific verifier
(its checklist named every subtle rule - banker's rounding, per-line tax, line-discount-before-order,
order-discount-on-subtotal-only, shipping-after-tax-untaxed; its selftest asserted them with concrete
values including 0.5->0 banker's ties), the build satisfied it (selftest green, no repair), hidden passed
8/8 - and it STILL produced zero lift over no-harness.

## lsp / case-015

| arm | score | tests | tokens | wall | notes |
|---|---:|---|---:|---:|---|
| no-harness | 85 | **9/9** | 2.05M | 153 s | one pass |
| **gen-harness** | 81 | **7/9** | 6.30M | 364 s | generate 1.61M + build 4.69M; selftest passed, no repair |

**gen-harness LOST**: 7/9 vs baseline 9/9 (81 vs 85) at ~3x tokens and ~2.4x wall-clock. The two failed
hidden rules were "completion filters by prefix and exposes function signatures" and "parser recovers from
syntax errors and still reports semantic diagnostics".

The revealing part: the generated checklist DID name both rules (#7, #9, #10) and the selftest DID assert
them (R4 syntax-recovery, R6 prefix+signature) - and `selftest_final = true`, i.e. the build satisfied the
generated verifier. Yet the real hidden tests for those same rules failed. The generator operationalized
each rule with ONE concrete, looser assertion (e.g. R6: "prefix 'ad' returns the `add` symbol and its
label matches /add\(a,b\)/"); the solver satisfied that specific proxy and stopped, while the hidden test's
stricter operationalization of the same rule failed. This is Goodhart: the generated verifier became the
target, the solver overfit to it, and "selftest green" was a FALSE completion signal that let it stop short
of the prose spec. The baseline, with only RULES.md prose + visible tests, attended to the full rule and
implemented it generally enough to pass 9/9.

(Honest caveat: the lsp harness arm has been noisy across experiments - 6/9 single-process, 9/9 fan-out,
7/9 here - so this 7/9 is partly run variance. The robust fact: baseline is consistently 9/9; harness
forms are noisy and average below it. The Goodhart mechanism is an evidenced contributor to THIS 7/9, not
the entire explanation.)

## Combined (2 cases)

| | no-harness | gen-harness |
|---|---:|---:|
| avg score | 82.5 | 80.5 |
| avg pass-fraction | 1.00 | 0.889 |
| avg tokens | 1.54M | 4.20M (~2.7x) |
| wall-clock | lower | 2.0-2.4x |
| crashes | 0 | 0 |

## What this means

- A correct, rigorous, TASK-SPECIFIC generated verifier produced **zero lift on billing (exact tie) and a
  net LOSS on lsp**, at ~2.7x the tokens. No harness form tested (generic skill, fan-out, generated
  verifier) ever beats a strong baseline on these fully-specified tasks.
- WHY, sharpened: a harness adds value by surfacing requirements. When the spec is fully given as RULES.md,
  a strong high-reasoning baseline already extracts all of it, so there is nothing to surface - the
  generated verifier just re-packages the same information at extra cost. Worse (lsp), it can HURT: a
  generated verifier is a lossy proxy of the spec, and "make the selftest pass" invites overfitting to the
  proxy plus a false done-signal, so the solver can end up BELOW a baseline that read the prose directly.
- The only regime where a harness could win is the inverse: requirements that are NOT given as a clean spec
  - implicit/undocumented domain rules in a real repo (LEGACY / LEARN-DOMAIN), where the baseline cannot
  extract the spec for free. A self-contained one-shot eval with a RULES.md structurally cannot reproduce
  that, which is exactly why every experiment here under-tests the skill's intended advantage.

Artifacts: `result-billing-genharness.json`, `result-lsp-genharness.json`, `run.mjs`, `raw/`.
Generated harnesses preserved at `/tmp/sg-genharness-eval/sandboxes/<case>/gen/harness/`.
