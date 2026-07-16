# Changelog 2026-07-16

## Regression-reconciliation A/B: first fixture deleted as non-discriminating

**Change**: deleted the `sideeffect-004-shared-format` fixture and the inconclusive A/B run
artifacts (results/summary/manifest/report) from
`docs/experiments/2026-07-15-regression-reconcile-ab/`. Kept `driver.mjs` (the parameterized
old-vs-new-vs-bare A/B harness) for reuse with a harder fixture.

- Why deleted: the fixture could not produce a meaningful result. It variant-validated
  (starter fails / naive-shared-edit false-GREENs / scoped fix passes), but in live runs at
  gpt-5.5-low all 18 units - old skill, new skill, AND the bare no-skill control - made the scoped
  fix and left the shared helper untouched. The fixture was too small (5 files, direct-import
  consumers, a telegraphing comment) to reproduce the target failure mode (a diff outgrowing the
  plan across files/iterations), so it discriminated nothing.
- Kept: the `8c01712` rules change (contract-test-backed, not under question) and `driver.mjs`.
- Next: a harder fixture that reproduces the failure mode - larger surface, consumers coupled
  through indirection (registry / serialized contract / re-export barrel) so a grep of the changed
  symbol misses them, no telegraphing. Design fork pending user direction (synthetic-large vs real
  external benchmark vs staged).

## DeepSWE runner: token + agent-time metrics, --skill-repo; 3-arm efficiency A/B started

**Change**: `templates/harness-eval-external/deepswe/run-full-cycle.mjs` now (a) records per-arm
`metrics` — agent-only wall clock from the pier trial's `agent_execution` timing plus
environment/agent-setup/verifier decomposition, and `n_input/cache/output_tokens` + `cost_usd` from
pier job `stats` — in summaries, deltas, and the report table; (b) accepts `--skill-repo <path>` so
the harness arm can embed skill files from any checkout. New experiment
`docs/experiments/2026-07-16-supergoal-efficiency-ab/` runs baseline vs skill@v0.8.0 (`287c628`) vs
skill@regression-reconciliation (`8c01712`) on the 4 tasks the paused 2026-07-15 run never finished,
at codex gpt-5.5 **low** effort.

- Why the metrics fix: the old runner compared arms on the outer `pier run` duration, which bundles
  Docker image build (cache-dependent, arm-independent noise) and verifier time with agent work, and
  it dropped token usage entirely — so "supergoal efficiency" was unmeasurable. Pier already
  aggregates codex `token_count` events into job stats; the runner just never read them.
- Why `--skill-repo` instead of per-worktree runners (2026-07-15 design): one fixed runner for all
  arms removes the runner-byte-identity proof obligation and lets the measurement fix apply to every
  arm; rejected alternative — patching the runner into each worktree — duplicates the fix and can
  drift.
- Why low effort despite the "low floors etree" note: the question changed from correctness lift to
  time/token efficiency; correctness columns are recorded but flagged as weak evidence at low.
- Why etree is excluded: already scored at medium in the paused run, and known to floor at low
  (f2p 0/52 smoke), so it cannot inform either axis.

## Ephemeral-workspace fast path landed; regression reconciliation restored

**Change**: role-loop gains an ephemeral-workspace fast path — in a single-task container/CI
checkout with no artifact reader, the five gates keep their order but hold state in context instead
of vault files: no run worktree/branch, no GOAL/PLAN/QA/run-state files or changelog dirs, one
full-suite run at Exact Verify, no commit-gate/qa-gate, root-only RULES.md check. Landed on dev-v2
as revert-of-1e4e72c (restores diff-driven regression reconciliation) + cherry-pick 2651fe0.

- Evidence (autoresearch/classic-260716-2120, DeepSWE 3 tasks, codex gpt-5.5 low): the unmodified
  skill doubled input tokens and added ~1/3 agent time vs no-skill baseline; csstree rollouts showed
  the cause is unconditional ceremony turns (RULES tree-find, worktree add/remove, vault+changelog
  writes, repeated status/diff sweeps, double full-suite run, commit gate) — baseline 25 tool calls
  vs v080 55 / recon 37. The fast path cut agent time 24% vs recon (1,270s vs 1,673s, within +3.8%
  of baseline) at equal-or-better f2p on every task (143 vs 139 total).
- Why reconciliation is restored despite the 2026-07-15 revert: that revert followed a tie at
  fixture scale; today's external benchmark is the first discriminating signal and the recon
  lineage beat v0.8.0 on quality 2-of-3 (cliffy 37/37 vs 0/37), and the landed combination
  (reconciliation + fast path) is the exact tested winner. Undo = revert the two commits.
- Rejected alternative: landing the fast path without reconciliation — that combination was never
  measured; landing only tested combinations keeps the evidence chain honest.
- Open axis: input tokens stay ~2.2× baseline (97% cached); embed diet projected at 5-7% saving,
  below the 20% keep bar, so the loop closed at iteration 1 (plateau by expected value).
- Medium spot check (owner asked for a comprehensive pick-and-use view): cand1 full-solved csstree
  79/79 beating baseline on quality AND time (400s vs 437s) — first supergoal arm to do so; termenv
  (debug proxy) showed no lift (31/35 vs baseline 34/35, repeated small loss across both efforts).
  Comprehensive totals (5 valid task-runs): f2p cand1 253 > recon 251 > baseline 248; agent time
  cand1 −1.4% vs baseline, recon +27%. Verdict: keep cand1 as the shipped variant; watch the
  debug-task weakness (n=1 per cell).
