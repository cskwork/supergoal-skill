# FeatAdd generator — naturalistic debug instances from feature-induced regressions

BugPilot-style (Microsoft debug-gym): instead of injecting synthetic bugs, a builder agent implements
a real feature and unintentionally breaks existing tests. The broken (feature-applied) state becomes a
debugging task; the newly-failing tests are fail-to-pass; a second agent's fix is the gold solution.
Bugs are naturalistic (a plausible agent introduced them) and biased toward root-cause-vs-symptom
structure — the regime where supergoal's DEBUG hidden-contract gate operates (see
`docs/experiments/2026-07-17-debug-luna-ab/REPORT-heldout-FINAL.md`). This exists because the scraped
SWE-bench sympy corpus is nearly exhausted of difficulty-matched held-out instances (most ceiling or
floor), so a powered (n>=6) confirmatory debug set has to be generated.

## Why this over scraped bugs

Mining the 18-instance sympy pool (2026-07-17) found exactly ONE clean exception-owner discriminator
(21379); the rest ceiling (baseline solves unprompted) or floor (nobody solves). Perturbation bugs are
OOD/less discriminative (arXiv 2504.21798). FeatAdd yields hard, naturalistic bugs at scale.

## Pipeline (`gen.sh <feature-id>`)

1. base test snapshot of the target module (passing set P0)
2. BREAK: `codex exec` builder implements the feature (tests excluded) -> feature.diff
3. compute B = P0 minus (passing after feature); guard 1 <= |B| <= 6
4. ORACLE: `codex exec` solver fixes the regression without reverting the feature -> fix.diff
5. validate: oracle restores all B, zero P1 regressions, non-empty fix
6. package: DeepSWE task where the env image layers feature.diff on `sympy-swe-base:v1`, B is
   fail-to-pass, P1 is pass-to-pass, fix.diff is the gold solution

Discards (no source diff, |B| out of range, oracle can't restore B, P1 regression) are honest — a
feature that breaks nothing or breaks unfixably is not a usable instance.

## Prereqs

- `/tmp/sympy-gen` = a sympy checkout (extract once: `docker create sympy-swe-base:v1` + `docker cp
  <cid>:/app/. /tmp/sympy-gen`) with a venv: `python3 -m venv .venv && .venv/bin/pip install
  mpmath==1.3.0 pytest hypothesis`.
- `codex` authenticated (`~/.codex/auth.json`); model default `gpt-5.6-luna`.
- `sympy-swe-base:v1` image present (shared base for env layering).

## After gen.sh (per instance)

```bash
docker build -t featadd-<id>:v1 /tmp/deep-swe-sg/tasks/featadd-<id>-<id>/environment
# dual-validate (zero model tokens): oracle reward=1, nop reward=0 with all f2p failing
pier run -p /tmp/deep-swe-sg/tasks/featadd-<id>-<id> --agent oracle -o /tmp/val-<id>-oracle -q -y
pier run -p /tmp/deep-swe-sg/tasks/featadd-<id>-<id> --agent nop    -o /tmp/val-<id>-nop    -q -y
```

Only instances passing the dual gate AND a baseline discrimination screen (baseline < 100%, not a
floor) enter an A/B. Then run baseline / v0.9.0 / v0.9.1 / candidate arms as in the debug-luna rig.

## Status

Pipeline verified end-to-end (2026-07-17): base snapshot -> `codex exec` break -> B computation ->
discard logic all run correctly against local sympy. Codex generation runs after any concurrent A/B
finishes (shared rate-limit ceiling).

**Yield finding (load-bearing):** the first catalog (additive prompts — "Add support for X", "Add a
helper") produced 0 keepers across 3 features: a strong model (gpt-5.6-luna) implements additive
features cleanly WITHOUT breaking existing tests (B=0), and one produced no diff at all. FeatAdd only
yields regressions when the feature MODIFIES existing behavior that current tests exercise. The catalog
was therefore rewritten to behavior-modifying prompts ("Change function F's evaluation in place so
that ...", targeting heavily-tested core/polys/relational/piecewise paths). Rule for new features:
change an existing evaluation path in place, do not add an opt-in branch guarded to the old behavior.
Expect a discard rate > 50% even so — rejection sampling is inherent; run several features per keeper.
