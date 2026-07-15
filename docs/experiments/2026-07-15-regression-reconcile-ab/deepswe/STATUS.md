# DeepSWE old-vs-new harness A/B — STATUS (paused mid-run 2026-07-16)

Status: **incomplete — 3 of 10 arm-runs scored; not proven.** Paused for session wrap-up.
The detached run may still be writing to `/tmp/sg-deepswe-ab/` (see Stop below).

## Design

Isolates the 2026-07-15 regression-reconciliation change on a real, evaluator-graded benchmark.

- Arms: harness@**old** skill (`eb1b5c7`, git worktree `/tmp/sg-skill-old`) vs harness@**new**
  skill (`8c01712`, current checkout). No no-skill baseline (question is old-vs-new).
- Isolation: `templates/harness-eval-external/deepswe/` is byte-identical at both commits (no runner
  confound). The harness arm embeds only SKILL.md + role-loop.md + delivery-gate.md + qa-auditor.md;
  the old→new delta reaching the arm is exactly `role-loop.md` (+11: diff reconciliation, test-scope
  floor, scope-extension handling) and `qa-auditor.md` (+9/-2: same). SKILL.md/delivery-gate.md unchanged.
- Runtime: codex `gpt-5.5`, reasoning **medium**, 900 s/arm, serial, per-task paired interleave.
- Why medium (not low): the low smoke floored etree (f2p 0/52); the suite's difficulty evidence is
  measured at gpt-5.5 medium/high/xhigh, so low gives no headroom. Medium is the discriminating point.
- Grading: DeepSWE repo-owned verifier (reward/ctrf), f2p (feature) + p2p (regression) + partial.

## Interim results (3/10 arm-runs)

| task | arm | f2p | p2p (regression) | partial | reward | runtime |
|---|---|---|---|---|---|---|
| etree-xml-diff-patch | new | 52/52 | 15/15 | 1.000 | 1 | 9m20s |
| etree-xml-diff-patch | old | 0/52 | 15/15 | 0.224 | 0 | 8m35s |
| cliffy-config-file-parsing | new | 37/37 | 451/451 | 1.000 | 1 | ~ |
| cliffy-config-file-parsing | old | *pending* | | | | |
| csstree / skrub / termenv | both | *not run* | | | | |

## Honest read (do not over-claim)

- etree's f2p 0-vs-52 looks dramatic but is **bimodal n=1 variance**: on this task f2p is all-or-nothing
  (land the compiling API → ~all pass; miss it → 0). Both arms ran full effort (~8-9 min, no timeout);
  old just didn't cross the threshold this once. The prior luna/medium run had BOTH arms at ~50/52, so
  etree is solvable by both skill versions — a 0-vs-52 split is a coin-flip artifact, not a 20-line-diff effect.
- On the axis the change actually targets — **p2p (regression) — etree tied 15/15**. No regression event
  occurred to differentiate the arms. The guardrail is inert when nothing regresses (correct behavior).
- cliffy-new preserved all **451** p2p; the old-cliffy pair (large regression surface) is the first real
  chance to see a p2p divergence. It had not finished when paused.
- Consistent with this repo's baseline-first record (`docs/experiments/README.md`): no skill lever has
  shown significant lift over a strong baseline on explicit-spec tasks. A regression guardrail's value
  only appears on regression-prone tasks; proving it likely needs repeated seeds and/or a task where an
  arm actually regresses p2p — beyond a single-seed 5-task pass.

## Resume / Stop / Collect

- **Stop the detached run** (kill is blocked for the agent; run these yourself with the `!` prefix):
  `! pkill -f deepswe-ab` then `! pkill -f "deepswe/run-full-cycle"`
- **Collect scores:** `for f in /tmp/sg-deepswe-ab/*/summary.json; do echo "$f"; grep -E '"f2p_passed"|"p2p_passed"|"partial"|"reward"' "$f" | grep -v delta | head -4; done`
- **Resume the remaining tasks:** edit `TASKS=(...)` in `run-ab.sh` to the unfinished tasks, ensure
  Docker is up + `/tmp/sg-skill-old` worktree exists (`git worktree add /tmp/sg-skill-old eb1b5c7`),
  then `bash run-ab.sh`. Runs use `--force`, so re-running a task overwrites cleanly.
- Raw per-arm output + patches: `/tmp/sg-deepswe-ab/<arm>-<task>/` (survives session, not reboot).
