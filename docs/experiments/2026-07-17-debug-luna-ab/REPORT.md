# Debug-lever A/B on DeepSWE-format sympy real bugs — FINAL REPORT (2026-07-17)

**Verdict: KEEP cand3. First statistically significant debug-skill win in this repo's eval
history — resolved 5/12 vs 0/12 for BOTH no-skill and v0.9.0, one-sided stratified permutation
p = 0.020 each, on pre-registered fresh confirmatory seeds, with zero p2p regressions and no
feature-add guardrail loss.** The method-over-generic-compute component is directionally positive
(5 vs 3) and mechanism-attributed on the idiom task, but not separately significant at n=12.

Model: codex `gpt-5.6-luna`, reasoning medium, 900 s budget, pier/Docker.
Rig: 4 surviving debug tasks (of 9 built) — sympy real bugs converted to DeepSWE v1.1 format,
each oracle/nop dual-gated. Pre-registration: `PREREG.md` (written before any model run).

## The lever (cand3, branch `debug-cand1` @ `5b794bd`)

"DEBUG hidden-contract gate", +~30 lines across SKILL.md / reference/role-loop.md /
agents/qa-auditor.md, three checks with a literal output contract (`GATE.owner=`,
`GATE.alt_repro=`, `GATE.conformance=`) required before a DEBUG commit:

1. **Invariant owner** — name the violated invariant and its owning frame; for recursion,
   enumerate the traceback's repeating cycle and fix INSIDE it (often another module).
2. **Alternative-entry repro** — a second, structurally different repro (same root cause,
   different caller/compound context) must also pass.
3. **Convention conformance** — grep patched functions AND their symmetric siblings
   (`__mul__`/`__truediv__` …) for raw literal returns; convert to the module's canonical forms
   (`S.One` over `1`) when 2-3 sibling implementations do so — including pre-existing literals
   the diff merely moves or keeps.

## Results (resolved = all gold F2P pass AND no P2P regression)

| arm | resolved | per task (21627 / 23191 / 24909 / 24102) | p2p reg | mean agent s |
|---|---|---|---|---|
| no-skill baseline (3 seeds) | 0/12 | 0/3 / 0/3 / 0/3 / 0/3 | 1 (23191 s1) | 196 |
| v0.9.0 (3 seeds) | 0/12 | 0/3 / 0/3 / 0/3 / 0/3 | 0 | 198 |
| cand1 screening | 1/12 | 1/3 / 0 / 0 / 0 | 0 | — |
| cand2 screening | 2/12 | 2/3 / 0 / 0 / 0 | 0 | — |
| cand3 screening | 5/12 | 1/3 / 1/3 / **3/3** / 0/3 | 0 | — |
| **cand3 CONFIRMATORY (fresh seeds)** | **5/12** | 2/3 / 1/3 / 2/3 / 0/3 | 0 | 236 (+20%) |
| equal-compute ctrl (naive extra pass) | 3/12 | 2/3 / 1/3 / 0/3 / 0/3 | 0 | 218 |

Pre-registered tests (confirmatory data only, stratified by task, one-sided, MC 200k, fixed seed):

- cand3 vs no-skill: diff +5, **p = 0.020** — PASS
- cand3 vs v0.9.0: diff +5, **p = 0.020** — PASS
- cand3 vs equal-compute ctrl: diff +2 (entirely on 24909), p = 0.32 — nominal pass only
- ctrl vs v0.9.0 (secondary): diff +3, p = 0.10 — directional

Guardrail (feature-add, same-model comparator after prereg amendment — the original 79/79 band was
measured on gpt-5.5, invalid across models): csstree f2p v0.9.0-luna 64/71 vs cand3-luna 65/71,
p2p 16715/16715 both — **no regression, PASS.**

## Mechanism evidence (why this is method, not luck)

- **24909** (the check-3 task): counterfactual PROVEN before the lever existed — applying
  `return 1`→`S.One` to a failed baseline patch flips it to resolved under the verifier's own
  procedure. cand3 then solved it 5/6 (screening+confirmatory) while baseline/v090/ctrl went 0/9;
  cand3 patches convert BOTH `__mul__` and `__truediv__` exactly as check-3 instructs.
- **21627**: cand1's first solve was line-identical to the gold `Abs.eval` fix; baselines guarded
  the symptom module in 6/6 runs. The cycle-enumeration wording (cand2) doubled the hit rate.
- Iterations were autopsy-driven, monotone (1 → 2 → 5 of 12), and the binding constraint turned
  out to be ATTENTION STRUCTURE, not content: the same three checks jumped 2→5 when given a
  SKILL.md top-position summary, a literal `GATE.*` output contract, and a greppable action.

## Honest limits

- **Method-vs-compute is not separately proven.** A content-free "take one extra adversarial
  pass" line already lifts 0→3/12 (p=0.10) — itself a notable, nearly-free lever. cand3's +2 over
  ctrl sits on one task and p=0.32. Claim accordingly: total effect proven; the content-specific
  component is mechanism-attributed (counterfactual + patch reads) but needs a larger n to prove
  statistically.
- **Task-adaptation risk.** cand2/cand3 wording was refined against these tasks' failure modes
  (confirmatory used fresh seeds, so seed overfit is controlled; task overfit is not). External
  validity needs a held-out debug task set before claiming generality.
- Scope: luna-medium, sympy/Python, 900 s budget, 4 tasks. 24102 (parser structural case) never
  moved (0/12 everywhere) — check-2 as written does not reach it.
- cand3 costs ~+20% agent time vs no-skill on these tasks.
- Two mid-campaign infra failures were diagnosed and fixed, not scored: py3.12 distutils removal
  (rebuilt py3.11), docker address-pool exhaustion from orphaned pier networks (pruned).

## Decision and follow-ups

- cand3 (= `debug-cand1` branch, 3 commits 5211638 → 3c5c3b6 → 5b794bd) is the keeper.
  Merging into dev-v2 (as v0.9.1 candidate) is proposed, not yet done.
- Follow-up candidates (not run): (a) held-out debug tasks for external validity; (b) ablation
  gate-only vs naive-pass-only at larger n to price the content component; (c) a check-2 variant
  that actually reaches 24102-class parser bugs.

## Artifacts

- Pre-registration: `PREREG.md`. Autopsies: `AUTOPSY-it0.md`. Cells: `results.tsv` (97 rows).
- Runs: `/tmp/sg-debug-luna/runs/<seed>/<task>/` (volatile). Stats: `analyze_final.py`.
- Task generator + validation: `gen_tasks.py`, `validate_tasks.sh`, `check_validation.py`;
  images `sympy-swe-*:v1` (local Docker).
- autoresearch log: `autoresearch/classic-260717-0646/config.md`.
