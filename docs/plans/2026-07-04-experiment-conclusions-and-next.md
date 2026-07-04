# supergoal skill-vs-no-skill — conclusions and next experiment (2026-07-04)

Testbed: Docker-free SWT-Bench-Lite rig — 15 validated real sympy bugs, weak model (Claude Haiku 4.5),
metric = TRUE fail-to-pass (candidate test FAILS on buggy code AND PASSES once the gold patch is applied),
graded out-of-band and deterministically (agent self-report ignored). Rig in
`docs/experiments/2026-07-04-swt-assertflip-realbug-ab/`.

## What the experiments PROVED

- **Baseline-first holds.** Across 7 A/B cells (toy + real, one-shot + execution-loop, sonnet + haiku,
  3-way, and today's domain-general critic-loop) no skill/harness lever produced a statistically
  significant fail-to-pass lift over a bare no-skill baseline at alpha=0.05.
- **The debug-method / assert-flip lever is closed.** shipped-method vs no-skill: haiku n=15 p=0.124
  (interim n=10 looked like +15.7pp p=0.10 but it dissolved with more data — noise). assert-flip adds 0.
- **The independent-critic role-loop lever is closed for explicit-spec tasks.** A DOMAIN-GENERAL critic
  (independence + empirical fail-to-pass enforcement + spec re-derivation; zero injected domain facts) vs
  no-skill: n=15 **53% -> 60%, diff=+0.067, p=0.572 (NULL).** Per-instance it is a wash — helps hard bugs
  (22005 1->3, 23191/23262 0->1) but the critic's rewrites BREAK tests the bare agent already nailed
  (21055/21627 3->1). This independently reproduces `SKILL.md`'s own caveat (line 136): "on explicit-spec
  tasks this role separation did NOT beat equal-compute forced verification."
- **The proven lever is equal-compute FORCED VERIFICATION, not role separation.** Re-reading the spec and
  attacking edges at equal compute is what helps; adding a separate critic persona does not.
- **No-skill is not even cheaper.** At haiku the no-skill arm cost the MOST ($18.25 vs 13.84-14.48) because,
  lacking a method, agents loop more (higher cache-read). So the skill arms are cheaper AND directionally
  higher — just not significantly higher on this task class.

## What the experiments did NOT prove

- **70b0365 (current main/dev SKILL.md) > v0.3.8 (released) head-to-head.** The refinements between them
  (3-pass improve core: full-spec / edge-cases / final-verify; IntentGate routing; critic gating a9ba38e)
  were NOT A/B-benchmarked against v0.3.8. They are evidence-CONSISTENT design improvements, not test-proven
  speedups. Do not ship a "beats baseline by X%" performance claim.
- **That skills are useless.** The rig is an EXPLICIT-SPEC task class (the bug report states the correct
  behavior), which is exactly where baseline-first predicts zero headroom. The experiments say nothing about
  under-specified / latent-correctness work, where the critic escalation is designed to bite.

## Version recommendation

Use **70b0365 = current main/dev SKILL.md** (already deployed). It is the evidence-aligned endpoint:
baseline-first preserved, critic escalation gated OPT-IN (not always-on — today's arm S shows the critic
regresses working tests on explicit-spec), the equal-compute forced-verification core most developed, and
the empirical caveat baked in as a guardrail. v0.3.8 is superseded (thinner 1-pass verify core, pre-gating);
ee7296b is an intermediate (pre-gating). No shipped-skill-behavior file changed in this session, so merging
dev -> main only adds experiment records; the deployed skill is unchanged.

## Next experiment (to actually demonstrate a meaningful difference)

The lever can only show lift where the baseline lacks something a transferable procedure supplies. That is
NOT explicit-spec repro-writing. To get a fair chance at a significant result, change the TESTBED, not the
skill:

- **Build an under-specified / latent-correctness testbed.** Tasks where the correct behavior is NOT stated
  in the prompt: hidden edge cases, unstated invariants, error/recovery paths, boundary/degenerate inputs,
  compatibility constraints — the requirements the equal-compute improve loop + opt-in critic are meant to
  surface. Grade by a held-out ground-truth suite the agent never sees (same out-of-band, deterministic
  discipline as this rig).
- **Arms:** no-skill baseline vs supergoal (improve loop + opt-in critic escalation ON). Pre-register S vs 0,
  stratified permutation, p<0.05 -> real lift.
- **Keep every lever DOMAIN-GENERAL.** Do NOT inject task-specific domain knowledge into any arm — a general
  skill must win by transferable procedure alone, or the result doesn't generalize (this session's first
  arm-S attempt was killed for hardcoding sympy facts into the critic).
- **Power:** 15 instances x R3 gave p=0.12 even for a +12pp effect; to detect moderate effects reliably,
  budget more instances (>=25-30) or a larger expected effect. Cost reference: the haiku 3-way was ~$47;
  a 2-arm under-specified run of similar size is ~$20-40.

Rig is reusable: `lib.py` (SWT_SCR env-driven), `setup_worktrees.py`, `grade_*.py`, `analyze_*.py`,
`*_wf.js`. provenance: wf_f53fc4e0-3d1 (3-way), wf_7cbf4d3d-2df (domain-general critic-loop).
