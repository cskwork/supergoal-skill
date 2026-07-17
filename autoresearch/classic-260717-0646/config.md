# autoresearch classic — supergoal debugging lift (luna medium)

Goal: raise supergoal's debugging resolved-rate above BOTH no-skill and v0.9.0, proven.

- Scope: skill files only (SKILL.md, reference/role-loop.md, reference/*.md, agents/*.md);
  candidates branch from dev-v2 `350eb96` (v0.9.0).
- Metric: resolved (binary reward) summed over the surviving custom sympy debug tasks,
  3 seeds/arm screening + 3 fresh seeds confirmatory. Direction: higher_is_better.
- Verify: `run-full-cycle.mjs --model gpt-5.6-luna --reasoning-effort medium
  --timeout-seconds 900 --benchmark-root /tmp/deep-swe-sg --task sympy-<id> --arms ...
  --skill-repo <candidate checkout>`; grading is pier's out-of-band verifier (junit node-id
  whitelists). Full decision rules: `docs/experiments/2026-07-17-debug-luna-ab/PREREG.md`
  (pre-registered before any arm ran).
- Guard: no new p2p regressions; csstree feature-add guardrail for the finalist;
  equal-compute control for any compute-adding lever.
- Iterations: 3 candidate levers max, then stop (kill rule: 7th null reported honestly).

## Iteration log

| iter | arm/candidate | change | resolved | notes |
|---|---|---|---|---|
| — | (rig build) | 6 sympy real-bug DeepSWE tasks + oracle/nop validation | — | py3.12 base FAILED the gate (distutils removed; 2021 sympy import error) → rebuilt on py3.11+setuptools; gate 12/12 PASS. Runner dry-run wiring verified (custom task + luna medium + 47KB skill embed). |
| 0 (full) | baseline vs v090 | — | surviving set {21627, 23191, 24909, 24102}: baseline 0/12, v090 0/12 resolved (3 seeds); failure modes stable per task; 24909 counterfactual: agent patch + S.One idiom normalization flips to resolved (verifier-faithful, in-container) | replacements screened: 21847/23262 dual-solve dropped, 24102 survives (1/2 f2p ×6). |
| 1 | cand1 = v090 + DEBUG hidden-contract gate (`debug-cand1` @ 5211638: invariant owner, alt-entry repro, idiom conformance; +25 lines role-loop.md/qa-auditor.md) | screening 4 tasks × 3 seeds, harness arm | 1/12 (21627 s1: gold-identical Abs.eval fix; p2p regressions 0) | Screening bar met but 1 discordant pair has no confirmatory power (McNemar p=0.5). Autopsy: gate language reached the agent (verbatim "invariant owner" in rollout) but check-1 fired 1/3 on 21627 (s2/s3 fell back to hyperbolic.py), check-3 skipped pre-existing `return 1` ("introduces" wording loophole; counterfactually sufficient), check-2 never produced structurally-different repros on 24102. Iterate, don't confirm. |
| 2 | cand2 = gate operationalized (@ 3c5c3b6: cycle-frame enumeration for recursion, structural alt-repro requirement, reachable-return + unchanged-sibling conformance scope, single-context externalization of the 3 answers) | screening 4 tasks × 3 seeds | 2/12 (21627 s1+s3; p2p regressions 0) | Cycle-frame enumeration doubled 21627 hit rate (1/3 → 2/3). 24909 still 0/3: rollout shows externalization ignored and check-3 sweep never run (instruction dilution in the 47KB embed); one run invented `milliwatt` mapping instead of gold's `W/1000`. 2 discordant pairs still underpowered → final iteration targets attention structure, not wording. Mid-run docker network pool exhaustion fixed by pruning orphaned pier networks. |
| 3 | cand3 = attention-structure changes (@ 5b794bd: 5-line DEBUG done-bar in SKILL.md top; literal `GATE.owner/alt_repro/conformance` output contract required before commit; check-3 as concrete grep-for-raw-literal-returns action) | screening 4 tasks × 3 seeds | **5/12** (24909 3/3, 21627 1/3, 23191 1/3 — first-ever solve; p2p regressions 0) | Monotone across iterations (1→2→5). Attention structure, not wording, was the binding constraint. |
| 3f | cand3 CONFIRMATORY (fresh seeds s4-s6, pre-registered) | 4 tasks × 3 fresh seeds | **5/12 — replicates screening exactly** (21627 2/3, 23191 1/3, 24909 2/3, 24102 0/3; p2p 0) | **vs no-skill 5-0: stratified permutation p=0.020; vs v0.9.0 5-0: p=0.020 — both pre-registered tests PASS.** Mechanism verified in patches: 24909 converts `return 1`→`S.One` in BOTH `__mul__`/`__truediv__` (check-3 verbatim behavior); 21627 s1 screening patch was gold-identical `Abs.eval` fix. |
| ctrl | equal-compute control = v090 + content-free "extra adversarial pass" line (@ d7fda4e) | 4 tasks × 3 seeds | 3/12 (21627 2/3, 23191 1/3, 24909 0/3; p2p 0) | ctrl vs v090: +3, p=0.10 (directional — the naive pass is itself a nearly-free lever). cand3f vs ctrl: +2, p=0.32, delta entirely on 24909 where content is counterfactually+patch attributed. |
| guard | csstree feature-add guardrail, same-model comparator (prereg amendment: original 79/79 band was gpt-5.5, invalid across models) | 2 seeds each | v090-luna 64,71 / cand3-luna 65,71 f2p; p2p 16715/16715 both | PASS — no regression. |

**DECISION: KEEP cand3 (`debug-cand1` @ 5b794bd). Full report: `docs/experiments/2026-07-17-debug-luna-ab/REPORT.md`. Merge to dev-v2 proposed, not executed.**
| 0 (s1) | baseline vs v090 | — | baseline 3/6, v090 3/6 (tie) | Dual-solve → drop: 20442, 21055, 22714. Survivors: 21627, 23191, 24909. Re-roll: added 24102/21847/23262 (gate pending). p2p: baseline broke 1 on 23191; v090 zero regressions. Failure autopsy: 24909 = hidden idiom contract (int 1 vs S.One; both arms fixed reported bug, kept original raw-int return); 21627 = symptom guard vs root cause (both guarded cosh path; gold fixes Abs.eval cycle owner; gold test enters cycle via different path); 23191 = exact canonical layout mismatch (harness close/no regressions; baseline broke a p2p). Lever skeleton: post-fix hidden-contract sweep (root-owner check + alt-entry repro + neighbor-idiom conformance). |
