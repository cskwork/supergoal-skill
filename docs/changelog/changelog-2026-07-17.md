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
