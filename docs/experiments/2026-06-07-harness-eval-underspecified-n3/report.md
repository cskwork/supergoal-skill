# Harness Eval Report — under-specified, n=3 (+ equal-compute control)

## Summary

- Cases: underspec-deepmerge (u1), underspec-csvline (u2) — authored latent-correctness fixtures.
- Runtime: codex-exec gpt-5.5 @ low. Arms: baseline (1 pass), harness (role-loop, 4 pass),
  naive (build+3 review, no skill, 4 pass; u1 only). n=3 per arm. Ground-truth scoring.
- Pass winner: u1 NAIVE (4.0/4) > harness (3.3) > baseline (2.3); u2 tie.
- Claim status: **Not proven.** The apparent u1 harness win is a compute artifact, not the skill.

## Machine Checks (hidden, avg of 3 seeds)

- u1: baseline 2.3/4, harness 3.3/4, naive 4.0/4. The equal-compute no-skill loop scores highest.
- u2: baseline 5/5, harness 5/5 (tie).

## Bug-Catch Matrix

- u1 prototype-pollution + null-source: baseline misses (false-GREEN 3/3). BOTH 4-pass arms fix
  proto; only the naive loop also fixes null (4/4); the role-loop leaves null 2/3. The catch tracks
  COMPUTE (passes), not the skill's critic.
- u2 CSV quoting: implemented unprompted by all arms; no discrimination.

## Cost

- u1 harness 5.8x / naive 6.4x tokens vs the 1-pass baseline. Equal-compute arms (~1.1-1.2M) are
  comparable to each other; naive scores higher for the same budget.

## Decision

**Reject the skill-win reading; not proven.** With an equal-compute control, the supergoal role-loop
does not beat plain iteration on the one case it appeared to win (3.3 vs naive 4.0), and ties
everywhere else in the 2026-06-07 sweep. Skill value that survives: high-effort crash stability and
single-pass cost reduction — not correctness from the role-loop. Full analysis: `results.md`.
