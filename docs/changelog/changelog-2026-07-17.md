# Changelog 2026-07-17

## Final no-skill rerun confirms cand1; v0.9.0 released

**Decision**: ship cand1 (regression reconciliation restored + ephemeral-workspace fast path) as
v0.9.0; merge dev-v2 to main.

- Final gate (owner-requested): rerun the no-skill baseline on the exact cell where cand1 won —
  csstree at medium. Result 76/79 @463s, consistent with the first baseline draw (75/79 @437s).
  Baseline is stable below full solve at n=2; cand1's 79/79 @400s stands as a reproducible
  quality-AND-time win, the first in this repo's eval history.
- Comprehensive standings (6 baseline / 5 recon / 5 cand1 valid task-runs, low+medium):
  f2p cand1 253/265 > recon 251 > baseline 248 (baseline 324/344 incl. basemed2); agent time
  cand1 ≈ baseline (−1.4%), recon +27%. Full data: `autoresearch/classic-260716-2120/`.
- Known open items carried forward: (1) debug-shaped tasks (termenv) show a small consistent
  cand1 loss vs baseline (−1 low, −3 medium; n=1 per cell) — five-gate scaffolding pays off where
  the solution surface is wide, not where a failing test already pins the fix; candidate future
  work is a debug-mode trim, evidence-gated. **[WITHDRAWN same day — see autopsy below.]**
  (2) Input tokens remain ~2x baseline in the
  all-files-embedded benchmark setup; mostly an embed artifact (97% cache hits), real usage loads
  references progressively.

## Debug-mode A/B closed at the Phase 1 gate: termenv loss = shape-sampling noise

**Decision**: H4 confirmed; no role-loop change; v0.9.0 stands. Open item (1) above is withdrawn.
Evidence: `docs/experiments/2026-07-17-debug-mode-ab/AUTOPSY.md` (read-only autopsy of the
existing `/tmp/sg-deepswe-eff3/` rollouts, no new runs — as the PLAN's Phase 1 prescribed).

- All 3 cand1med f2p misses trace to ONE line: its `Styled` preserve-resets branch delegates to
  `TruncateANSI(open+s, ANSIWidth(s), ...)` whose first line is `if width <= 0 { return "" }`, so
  `Styled("")` returns `""` instead of open+reset — and the gold tests derive their expected
  `startSeq` from `Styled("")`. The reapply logic itself was correct (got == want-with-true-startSeq
  in all three, compound `1;0;31` included).
- The failing "delegate-to-truncator" shape appeared in exactly 2 of 7 termenv arms: one
  full-ceremony arm (recon-low, 29/35) and one fast-path arm (cand1med, 31/35) — anti-correlated
  with the fast path across efforts (cand1-low passed 33/35). Failure keys to the sampled
  implementation shape, not the protocol. H1 (iterations), H2 (planning), H3 (verify altitude) all
  rejected on trajectory evidence: cand1med planned, integration-tested (most preserve tests of any
  arm), diff-reviewed (caught 2 real issues), ran the full suite repeatedly. No arm tested
  `Styled("")`; the passers were saved by architecture, not verification.
- Premise correction: termenv is a **feature-add** task (instruction.md: "Add preserve-resets and
  ANSI-safe truncation to termenv. Create an ansi subpackage..."), mislabeled as debug in the
  v0.9.0 records. The "fast path loses on debug" nuance is unsupported; the durable lesson is
  methodological — a ~29% implementation-shape sampling mode makes n=1 cell deltas of ±3 f2p
  unattributable; require n≥3 seeds before theorizing about any single-cell swing.
- Rejected alternative: a flag-noop invariant rule ("opt-in flag must not change output for inputs
  that don't exercise it") would have caught cand1med's instance but not recon-low's — 1-of-2 on
  one task is below the evidence bar; parked, not shipped.
- Secondary shared finding: all 7 arms fail `TestTruncate_DoesNotSplitOSCSequence_WhenWidthZero`
  the same way (early return at `width <= 0`; gold treats width 0 as normal flow) — task-level
  difficulty, protocol-independent.

## Debug-lever A/B (luna): first significant debug-skill win — DEBUG hidden-contract gate

**Decision**: keep cand3 (`debug-cand1` @ 5b794bd, +~30 lines SKILL.md/role-loop.md/qa-auditor.md).
Full report: `docs/experiments/2026-07-17-debug-luna-ab/REPORT.md`; pre-registration `PREREG.md`.

- Rig: 9 SWE-bench sympy real bugs converted to DeepSWE v1.1 tasks (oracle/nop dual-gated,
  py3.11 images), codex gpt-5.6-luna medium; 4 tasks survived the 1-seed ceiling screen.
  Iteration 0: no-skill 0/12, v0.9.0 0/12 resolved (3 seeds each) — maximal headroom.
- Loop (autoresearch classic, autopsy-driven): cand1 gate 1/12 → cand2 operationalized 2/12 →
  cand3 attention-structured 5/12 screening. CONFIRMATORY on fresh seeds: **5/12, vs both
  baselines 5-0, stratified permutation p=0.020 each; p2p regressions 0; csstree guardrail
  clean (same-model comparator)**.
- Key rationale chain: the binding constraint was attention structure, not content — identical
  checks jumped 2→5/12 when given SKILL.md top placement + a literal `GATE.*` output contract +
  a greppable action ("grep patched functions and symmetric siblings for raw literal returns").
  Mechanism attributed: 24909 counterfactual (S.One normalization flips a failed patch) proved
  check-3 sufficient BEFORE cand3 ran; cand3 then solved it 5/6 vs 0/9 for all other arms.
- Honest caveats recorded in the report: equal-compute control (content-free extra-pass line)
  itself lifts 0→3/12 (p=0.10) — cand3 vs ctrl is +2 nominal, p=0.32, so the content-specific
  component is mechanism-proven but not yet statistically separated; task-adaptation risk means
  generality needs a held-out debug set; +20% agent time.
- Rejected along the way: confirming cand1/cand2 at 1-2 discordant pairs (no power — the 07-17
  autopsy lesson applied prospectively); the gpt-5.5-era 79/79 guardrail band (cross-model
  comparison invalid; re-measured same-model).
- Infra fixes (not scored): py3.12 distutils removal broke 2021 sympy imports → py3.11 base;
  docker address-pool exhaustion from orphaned pier networks after killed runs → prune.

## Held-out generalization A/B + v092 candidate: mechanism generalizes, score underpowered, baseline still wins

**Decision**: gate mechanism generalizes on a held-out real bug but is NOT statistically proven; the
`v092` exception-owner edit is directional-only — KEEP on branch `debug-cand-exc-owner` (`e522c30`),
do NOT merge dev-v2. Full report: `docs/experiments/2026-07-17-debug-luna-ab/REPORT-heldout-FINAL.md`.

- Ran FOLLOWUPS-A: before(v0.9.0 `350eb96`) vs after(v0.9.1 `0715158`) on held-out sympy real bugs
  never touched by any lever. Round 1 (20212/24066/24213): CEILING — baseline 3/3 all, no
  discrimination (held-out was novelty-matched, not difficulty-matched). Round 2 fresh instances
  21171 (floor, 0/3 all) + 21379 (subs→PolynomialError, the one discriminator).
- **Mechanism, 15/15 deterministic**: on 21379 the patch SITE fully predicts pass/fail — fix
  `core/mod.py` (invariant owner, the frame that RAISES) → pass with `S.One`; fix `hyperbolic.py`
  (symptom site where `%` surfaces) → fail. Zero owner↔pass violations across baseline+v090+v091+v092.
  The gate's check-1 targets exactly this decision, on a task it was never tuned on.
- **Baseline-first re-confirmed with a mechanism**: baseline 3/3 (reliably finds the owner); v090 1/3,
  v091 2/3 — both skill versions leak to the symptom site a majority of runs and underperform
  no-skill. On this task invoking supergoal did worse than not.
- **n=3 is noise — demonstrated live**: the same gate swung v091 2/3 (seeds 1-3) → v091b 0/3 (seeds
  4-6). Pooled gate = 2/6. Any single 3-seed cell is uninterpretable (07-17 termenv lesson reproduced).
- **v092 edit** (generalize check-1 owner rule from RecursionError to ANY raised exception —
  raises-vs-surfaces; length-neutral, no new check; SKILL.md GATE.owner example aligned; contract
  tests 154+86+12+4 green): paired A/B v091 vs v092 on fresh seeds 4-6 gave 0/3 → 2/3 on 21379,
  mechanism-consistent, but 2 discordant pairs p≈0.5 — underpowered. Doesn't crack the floor task
  (21171 = missing-kwarg printer bug, a different failure class). Directional keep, not a proven win.
- **Secondary finding**: DEBUG observe-first-at-symptom-boundary (`reference/debugging.md`) may anchor
  agents at the surface site, partly causing the symptom-fixation the gate corrects — candidate future
  edit (hand observe-first off to traceback origin for exception bugs).
- **Why not proven / next build**: clean difficulty-matched held-out sympy instances are nearly
  exhausted (most ceiling or floor; ~1 discriminator). A powered confirmatory run needs a BugPilot-style
  FeatAdd hard-instance generator (agent adds a feature that breaks existing tests) rather than more
  scraped sympy bugs.
- Rejected: merging v092 on directional evidence (violates the repo's own not-proven discipline +
  task-adaptation caution); fishing more seeds for significance on one task (optional-stopping,
  pre-registered against).

## Powered non-inferiority A/B -> MERGE v092 as a safe refinement; FeatAdd generator built

**Decision**: merged `debug-cand-exc-owner` (`e522c30`) into dev-v2 as a safe, directionally-supported
refinement (NOT a proven win). Built a reusable FeatAdd hard-instance generator for the next powered
campaign. Report: `docs/experiments/2026-07-17-debug-luna-ab/REPORT-heldout-FINAL.md` (Phase 3).

- **Why non-inferiority instead of a WIN test**: mining the 18-instance sympy pool found ~1 exception-owner
  discriminator (21379); the rest ceiling/floor. v092's WIN can't be powered from scraped bugs. But v092
  only changes behavior on raised-exception bugs (off-regime neutral), so a broad run powers
  NON-INFERIORITY instead. User chose this hybrid path.
- **Result** (14 tasks x 3 seeds = 42 paired, v091 vs v092, reward.json direct): v091 26/42, v092 28/42;
  38/42 concordant; discordant 3 (v092) vs 1 (v091); McNemar exact two-sided **p = 0.625**. 12/14 tasks
  perfectly concordant (8 ceilings both 3/3, 4 floors both 0/3); 21379 in-regime v092 2/3 vs v091 0/3;
  24909 both 2/3 (seed disagreement = n=3 noise, same rate, NOT a systematic regression).
- **Merge rationale**: user pre-committed to merge iff non-inferior (no systematic regression) AND
  in-regime directional benefit -- both hold. Plus length-neutral, contract-clean (154+86+12+4 green),
  principled generalization (RecursionError -> any raised exception). Explicitly a safe refinement, not a
  proven correctness win (p=0.625; original gate merged at p=0.020). A proven win still needs a powered
  in-regime set.
- **FeatAdd generator** (`templates/harness-eval-external/featadd/`): BugPilot-style -- builder agent adds
  a feature that breaks existing tests, oracle agent fixes it, broken state becomes a naturalistic debug
  task (B=fail-to-pass, fix=gold), env image layers feature.diff on `sympy-swe-base:v1`. gen.sh +
  package.py + features.tsv (4 exception-prone seeds) + README. Env verified (local sympy + venv, pytest/
  junit parsing). Exists because scraped sympy is exhausted of difficulty-matched held-out; next campaign
  generates a powered in-regime set to test the gate broadly + v092's WIN.
