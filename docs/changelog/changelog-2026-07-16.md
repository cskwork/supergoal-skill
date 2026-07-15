# Changelog 2026-07-16

## Regression-reconciliation A/B: correctness tie at fixture scale, change kept

**Change**: ran the old-vs-new skill A/B for the 2026-07-15 diff-driven regression reconciliation
(`8c01712`) and recorded the result (`docs/experiments/2026-07-15-regression-reconcile-ab/`);
authored the `sideeffect-004-shared-format` fixture (shared helper with unmentioned consumers,
false-GREEN trap) and registered it with a discrimination CAUTION in the fixtures README.

- Result: old = new = bare baseline, all at ceiling on the default coding pair (002/003) and on
  the authored 004 discriminator (30 scored units, 0 crashes, 0 false-GREEN). Per the
  harness-eval contract the correctness delta is reported **Not proven** with the runnable-corpus
  ceiling named. Cost showed no consistent premium for the new rules (+27% tokens on the default
  pair, −4% on 004).
- Why keep the change: the targeted failure mode (diff outgrowing the plan on complex multi-file
  tasks) cannot occur in single-shot small-repo sandboxes, so absence of a measured win here is
  expected, not evidence against; the behavior is pinned by 11 contract greps
  (`tests/role-loop-contract.test.sh`, 154 passing) and costs nothing measurable.
- Method notes: first launch at sonnet default effort saturated instantly (ceiling probe kept in
  the experiment dir); rerun at the proven low/low configuration (codex gpt-5.5, effort low).
  A bare no-skill control was added when both skill arms tied, which showed the fixture scale -
  not the skill - was the binding constraint.
- Rejected: iterating the 004 fixture harder within this run (each round ~30-45 min of eval
  wall-clock for a fixture-calibration question, not a skill question). Recorded the two named
  hardening steps in the report's follow-up instead.
- Rejected: claiming the tie proves the new rules are free of value - the honest scope is
  "no measurable delta at this fixture scale, no measurable cost regression".
