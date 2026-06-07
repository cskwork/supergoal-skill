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

**Conditionally adopt; value is real but it's the forced compute, not the mechanism.** Two framings:
(1) vs the realistic one-shot default the skill WINS on u1 - it forces the verification a single pass
skips and catches the prototype-pollution vuln the baseline ships as a false-GREEN (3.3 vs 2.3), at
~6x tokens. Forcing useful compute is legitimate value. (2) vs an equal-compute naive loop the role
SEPARATION adds nothing (naive 4/4 >= role-loop 3.3/4) - the active ingredient is the extra passes,
so the structure could be leaner. Net: useful where a one-shot leaves an easy-to-miss correctness/
security gap; pure overhead where the one-shot already solves it (002/003/015, canonical u2). Full
analysis: `results.md`.
