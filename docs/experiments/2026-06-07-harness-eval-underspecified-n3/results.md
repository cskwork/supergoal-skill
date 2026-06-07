# Under-specified harness eval (n=3) + equal-compute control: the "win" was compute, not the skill

Hypothesis: the harness's only correctness lever (critic surfaces UNSTATED requirements) should
help on under-specified tasks. Two thin-prompt greenfield cases, codex gpt-5.5 @ low, n=3 per arm,
ground-truth scoring. Three arms:

- **baseline** - single literal pass, no skill (1 pass).
- **harness** - supergoal role-loop: build(skill-ref) -> critic -> fixer -> verifier (4 passes).
- **naive** - equal-compute control: build + 3 "review & improve" passes, NO skill (4 passes).
  (Run on u1 only - the case where the harness appeared to win.)

| case | arm | hidden avg | per-seed | false-GREEN | quality | tokens | passes |
|---|---|---:|---|---:|---:|---:|---:|
| u1 deepMerge | baseline | 2.3/4 | 2,2,3 | 3/3 | 71 | 190K | 1 |
| u1 deepMerge | **naive (no skill)** | **4.0/4** | 4,4,4 | **0/3** | 78 | 1.21M | 4 |
| u1 deepMerge | harness (skill) | 3.3/4 | 3,4,3 | 2/3 | 73.3 | 1.11M | 4 |
| u2 csvLine | baseline | 5/5 | 5,5,5 | 0 | 80.7 | 179K | 1 |
| u2 csvLine | harness (skill) | 5/5 | 5,5,5 | 0 | 82 | 1.24M | 4 |

## The equal-compute control overturns the win

The harness beat the 1-pass baseline on u1 (3.3 vs 2.3). But that is a COMPUTE difference, not a
skill difference: an equal-compute naive loop with NO skill scored **4.0/4 on every seed** - better
than the skill's role-loop (3.3/4) at the same 4-pass budget, and with zero false-GREENs. So the
prototype-pollution and null-source fixes come from spending 4x the passes (more self-review), which
plain iteration captures at least as well. The skill's critic/role-separation added nothing here -
it was slightly WORSE than unstructured iteration (3.3 vs 4.0), at comparable cost.

Why the role-loop trailed: it serializes coverage through one critic pass - the fixer only fixes
what the critic's generated tests assert. When the critic didn't write a null-source test, null
stayed broken (2/3 seeds). The free-form naive loop re-reads the whole task each pass and fixed
everything, including null.

u2 (csv) ties everywhere - quote handling is canonical, baseline does it unprompted.

## Verdict - two framings (both true, they answer different questions)

**1. Skill vs the realistic default (one-shot): the skill is USEFUL.** What a user actually gets
without the skill is the single-pass baseline (2.3/4, ships the prototype-pollution vuln 2/3 as a
false-GREEN). With the skill they get 3.3/4 and the vuln caught 3/3. Nobody hand-runs a 4-pass review
loop, so vs the real alternative the skill converts a shipped security bug into a catch. Forcing the
verification a one-shot skips is a legitimate, valuable function - it just costs ~6x tokens.

**2. Skill mechanism vs equal compute: the role-separation is NOT the active ingredient.** Give a
no-skill agent the same 4 passes (naive build+review) and it scores 4/4 - as good or better than the
role-loop's 3.3/4. So the value comes from the extra verification passes the skill induces, not from
its critic->fixer->verifier structure. The structure could be leaner (a plain review loop did better).

Net: the skill earns its keep by FORCING verification compute on tasks where a one-shot leaves an
easy-to-miss correctness/security gap (u1). It is pure overhead where the one-shot already solves the
task (explicit-spec 002/003/015; canonical u2) - tie at 2-6x cost. And what survives independent of
this: high-effort crash stability (INLINE fix) and, in single-pass skill-ref form, lower cost for the
same result.

## Methodological takeaway

This is the case for the equal-compute control now mandated in `reference/harness-eval.md`: without
the naive arm, the 3.3-vs-2.3 delta reads as a skill win; with it, the win is exposed as iteration.
Always run baseline (1 pass) AND an equal-compute no-skill loop before crediting any harness.

## Caveats

- n=3, one model/effort, the naive arm on one case (u1). Directional.
- Reproduce: `orchestrate.sh` (baseline+harness); naive via
  `SG_EVAL_CASE=u1 SG_EVAL_BASELINE_SEEDS=0 SG_EVAL_HARNESS_SEEDS=0 SG_EVAL_NAIVE_SEEDS=3 SG_EVAL_RESULT_SUFFIX=-naive node run.mjs`.
  Results: `result-u1.json`, `result-u1-naive.json`, `result-u2.json`.
