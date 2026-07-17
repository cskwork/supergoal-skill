# Held-out generalization A/B — autopsy (2026-07-17, round 2)

Before/after: v0.9.0 (`350eb96`, no DEBUG hidden-contract gate) vs v0.9.1 (`0715158`, gate).
Held-out = sympy real bugs never touched by any lever iteration. Model codex `gpt-5.6-luna`,
medium effort, 900 s, pier/Docker. Rewards read directly from `verifier/reward.json`.

## Round 1 (FOLLOWUPS A pool): CEILING — inconclusive

20212 / 24066 / 24213 at seed 1: baseline 3/3, v090 3/3, v091 3/3 (all reward=1, all f2p 1/1,
zero p2p failures). A strong no-skill baseline solves all three unprompted → no headroom, no
discrimination possible. This neither confirms nor refutes the gate; it re-confirms baseline-first
(strong baselines absorb scaffolds on tasks within capability). The FOLLOWUPS A held-out set was
matched on NOVELTY, not DIFFICULTY — the lesson is that held-out must be difficulty-matched to the
gate's operating regime (hard convention/recursion/structural bugs where baseline < 100%).

## Round 2 (difficulty-matched fresh instances): headroom found

Fresh unused instances 21171, 21379 (never in training or round-1 held-out). Seed 1:

| task | baseline | v090 (before) | v091 (after) |
|---|---|---|---|
| 21171 latex SingularityFunction | 0/1 | 0/1 | 0/1 (all fail — floor candidate) |
| 21379 subs PolynomialError | 1/1 | **0/1** | **1/1** |

### 21379 seed-1 mechanism (patch autopsy — this is the load-bearing evidence)

Bug: `exp(sinh(Piecewise((x,y>x),(y,True))/z)).subs({1:1.0})` raises `PolynomialError`. Root cause:
`Mod.eval` (`sympy/core/mod.py`) calls `gcd(p,q)`, which throws on non-polynomial (Piecewise)
operands. Oracle fix: catch `PolynomialError` in `Mod.eval`, set `G = S.One`.

- **v091 (gate, SOLVED, 45-line diff):** patched `sympy/core/mod.py` — the exact invariant owner.
  Wrapped `G = gcd(p, q)` in `try/except PolynomialError: G = S.One`. Used the module's canonical
  singleton `S.One`, not raw `1`. This is precisely what the gate's **check-1 (fix at the invariant
  owner)** and **check-3 (canonical form: `S.One` over `1`)** demand.
- **v090 (pre-gate, FAILED, 112-line diff):** patched the SYMPTOM site
  `sympy/functions/elementary/hyperbolic.py` instead — added a `_mod_pi` helper catching the error
  and returning `None`, threaded through SIX caller sites (`_eval_is_real`/`_eval_is_positive`/… of
  sinh/cosh/tanh). This is exactly the DEBUG failure mode check-1 targets: "a patch that guards a
  caller, wrapper, or reporting path outside the enumerated cycle is not done: refix at the owner."
  It fixed the reported repro path but the hidden F2P test failed → reward=0.
- **baseline (no skill, SOLVED, 61-line diff):** also found `mod.py`. So the task is not
  gate-exclusive; the notable pattern is that the OLD skill (v090) actively steered the agent to the
  symptom site and did WORSE than no-skill, while the gate (v091) recovered to owner-fix.

Significance: this is not a bare score delta — it is the same owner-vs-symptom failure mode the gate
was built to prevent, reproduced on an instance the gate's wording was never tuned on, with the gate
preventing it. That is mechanistic evidence for generalization.

**Caveat (decisive): n=1.** Per the 2026-07-17 termenv autopsy, a ±1 single-cell delta is
sampling-shape noise, not a result. The patch-level mechanism is not noise, but the SCORE needs
seeds 2-3 to show whether v090→symptom / v091→owner replicates or was one lucky draw. 21171 is a
seed-1 floor (all arms fail) — needs 2 more seeds to classify as floor (like 24102) vs occasionally
solvable.

Status: seeds 2-3 running. Decision deferred to the 3-seed table.
