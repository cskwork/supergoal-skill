# DeepSWE 3-arm efficiency A/B — STATUS (2026-07-16)

Status: **CLOSED 2026-07-16 22:0x — 12/12 base arm-runs + 3 candidate arm-runs complete.
Autoresearch loop kept cand1 (ephemeral-workspace fast path) at iteration 1: f2p ≥ recon on all
tasks (143 vs 139 total), agent time −24% (within +3.8% of no-skill baseline). Landed on dev-v2
(revert of 1e4e72c + 2651fe0). Full loop record: `autoresearch/classic-260716-2120/`.**

Continues the paused 2026-07-15 old-vs-new run (`../2026-07-15-regression-reconcile-ab/deepswe/STATUS.md`),
reframed per owner request: measure **supergoal efficiency (time + tokens)** at low effort, with a
no-skill baseline added.

## Design

- Arms (per task, serial interleave):
  - `baseline` — no skill, raw DeepSWE task.
  - `v080` — harness with skill @ `287c628` (= tag v0.8.0, agent-browser QA default).
  - `recon` — harness with skill @ `8c01712` (diff-driven regression reconciliation; reverted on dev-v2).
- Single runner (current checkout, post-measurement-fix) for ALL arms; only `--skill-repo` varies.
  This removes the 2026-07-15 design's per-worktree-runner surface entirely.
- Tasks: the 4 not completed in the paused run — cliffy-config-file-parsing,
  csstree-shorthand-expansion-compression, skrub-duration-encoding, termenv-preserve-ansi-resets.
  etree is excluded: it was scored at medium in the prior run and the low smoke floored it (f2p 0/52).
- Runtime: codex `gpt-5.5`, reasoning **low**, 900 s declared budget, serial.
- Caveat carried from 2026-07-15: at low effort this suite has little correctness headroom, so f2p/p2p
  comparisons are weak evidence. The primary axes here are **agent wall-clock** and **token usage**.

## Measurement fix (2026-07-16)

`run-full-cycle.mjs` previously recorded only the outer `pier run` duration (Docker env build +
verifier included) and dropped token usage. Now each arm summary carries `metrics`:

- `agent_execution_ms` (pier trial `agent_execution` timing — agent-only wall clock),
  plus `environment_setup_ms` / `agent_setup_ms` / `verifier_ms` for decomposition.
- `n_input_tokens` / `n_cache_tokens` / `n_output_tokens` / `cost_usd` from pier job `stats`
  (aggregated from codex `token_count` events; populated even on auth.json/subscription runs
  where cost may be absent).
- Report table and paired deltas include tokens and agent time.

## Incidents

- `skrub-duration-encoding`: verifier pytest segfaults at collection (exit 139, both invocations)
  in the baseline arm — zero tests ran, so f2p/p2p read 0/130, 0/2784. Correctness columns for
  skrub are suspect (likely native-wheel/container issue, not the patch); efficiency metrics
  (agent time, tokens) are captured before the verifier and remain valid. Cross-check: if v080 and
  recon skrub arms segfault too, it is a task-environment fault; if not, baseline's patch did it.

## Results (final, 2026-07-16 21:14)

| task | arm | reward | f2p | p2p | tok in | tok out | agent | wall |
|---|---|---|---|---|---|---|---|---|
| cliffy | baseline | 1 | 37/37 | 451/451 | 2,005k | 12.5k | 482s | 526s |
| cliffy | v080 | 0 | 0/37 | 451/451 | 2,582k | 14.4k | 480s | 521s |
| cliffy | recon | 1 | 37/37 | 451/451 | 5,080k | 22.2k | 866s | 908s |
| csstree | baseline | 0 | 68/79 | 16715/16715 | 606k | 10.4k | 333s | 360s |
| csstree | v080 | 0 | 72/79 | 16715/16715 | 2,996k | 20.7k | 652s | 679s |
| csstree | recon | 0 | 73/79 | 16715/16715 | 1,333k | 13.2k | 447s | 474s |
| skrub* | baseline | 0* | 0/130* | 0/2784* | 3,787k | 15.0k | 486s | 517s |
| skrub* | v080 | 0* | 0/130* | 0/2784* | 4,283k | 21.4k | 691s | 723s |
| skrub* | recon | 0* | 0/130* | 0/2784* | 3,820k | 19.1k | 760s | 790s |
| termenv | baseline | 0 | 34/35 | 87/87 | 1,053k | 12.5k | 409s | 563s |
| termenv | v080 | 0 | 33/35 | 87/87 | 1,597k | 13.4k | 481s | 561s |
| termenv | recon | 0 | 29/35 | 87/87 | 892k | 12.8k | 360s | 440s |

\* skrub correctness void — verifier pytest segfault in all 3 arms (see Incidents). Efficiency valid.

### Aggregates over the 3 valid tasks (cliffy + csstree + termenv)

| arm | agent time sum | tok in sum | tok out sum | f2p per task |
|---|---|---|---|---|
| baseline | 1,224s | 3,664k | 35.4k | 37/37, 68/79, 34/35 |
| v080 | 1,613s (+32%) | 7,175k (+96%) | 48.5k | 0/37, 72/79, 33/35 |
| recon | 1,673s (+37%) | 7,305k (+99%) | 48.2k | 37/37, 73/79, 29/35 |

### Reading

- Efficiency: both skill arms roughly double input tokens and add ~1/3 agent time vs baseline at
  low effort. Diagnosed cause (csstree rollouts): turn count is the dominant lever — baseline 25
  tool calls vs v080 55 / recon 37 — driven by unconditional ceremony (RULES.md tree-find, run
  worktree add/remove, vault + changelog writes, repeated status/diff sweeps, double full-suite
  run, commit gate); the 44 KB skill embed (+11k tokens/turn) is the secondary factor.
- Quality (weak evidence at low effort, f2p is bimodal): recon never lost to v080 (cliffy 37 vs 0,
  csstree 73 vs 72) except termenv (29 vs 33); baseline won termenv outright (34) and matched
  cliffy at half the cost — consistent with the repo's baseline-first record.
- Improvement loop: candidate 1 (`cand1-lean-exec` @2651fe0, branched from recon) adds an
  ephemeral-workspace fast path — same five gates, state in context instead of vault files, one
  full-suite run, no worktree/changelog/commit-gate. Keep rule: f2p not worse than recon on any
  task AND ≥20% cut in agent-time or input-token sum.

## Resume / Stop / Collect

- Runner log: `/tmp/sg-deepswe-eff3/suite.log` (per-arm: `/tmp/sg-deepswe-eff3/<arm>-<task>.log`).
- Stop: `! pkill -f run-ab.sh` then `! pkill -f "deepswe/run-full-cycle"`.
- Collect: `grep ARM_DONE /tmp/sg-deepswe-eff3/suite.log` or per-run `summary.json` under
  `/tmp/sg-deepswe-eff3/<arm>-<task>/`.
- Resume: trim `TASKS=(...)` in `run-ab.sh` to unfinished tasks and rerun (`--force` overwrites cleanly).
  Worktrees: `git worktree add /tmp/sg-skill-v080 287c628`, `git worktree add /tmp/sg-skill-recon 8c01712`.
