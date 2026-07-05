# DeepSWE External Harness Eval

Use this lane when local fixtures ceiling out or when the user asks for an independently replayable,
public source-code task. DeepSWE supplies public repositories, pinned base commits, isolated task
containers, and verifier artifacts.

## Decision

Do not claim `u3` proves a harness win. `u3` proves the fixture discriminates: visible checks can pass
while hidden authorization/cache checks fail. A harness win needs paired public benchmark artifacts.

## Forced Default Suite

For difficult SWE or harness-effectiveness claims, do not stop at a single public task unless the user
explicitly names one. Run the forced default DeepSWE suite:

1. `etree-xml-diff-patch`
2. `cliffy-config-file-parsing`
3. `yjs-map-conflict-detection`

Use the suite runner so the same full-cycle baseline/harness protocol is applied to each task:

```bash
node templates/harness-eval-external/deepswe/run-default-suite.mjs \
  --agent codex \
  --model gpt-5.5 \
  --reasoning-effort low \
  --codex-auth-json auto \
  --timeout-seconds 900 \
  --run-root /tmp/sg-deepswe-default-suite
```

One paired run per task is directional only, but it is the minimum default for this lane because it catches
single-task ceiling effects and regressions. A proven claim still needs repeated seeds.

## Default Public Tasks

Primary scoring task: `etree-xml-diff-patch`

- Benchmark task: `https://deepswe.datacurve.ai/data/v1/tasks/etree-xml-diff-patch`
- Upstream repo: `https://github.com/beevik/etree`
- Base commit: `4032e04c8f2e2f35e43ce5d772fcef14a5df4d74`
- Benchmark ref used for this manifest: `3cda4081fed96103a6395de39c85e9b20275e307`
- Why this first for scoring: it is a larger Go feature task covering XML diff, patch application,
  reverse patches, three-way merge, and summaries. It is intentionally broader than the saturated Happy
  DOM bugfix, so it is the default candidate for baseline-headroom/effectiveness runs.

Smoke task: `happy-dom-abort-pending-body-reads`

- Benchmark task: `https://deepswe.datacurve.ai/data/v1/tasks/happy-dom-abort-pending-body-reads`
- Upstream repo: `https://github.com/capricorn86/happy-dom`
- Base commit: `82a0888cb2c87a6123e05424b528f8e8c9b3e426`
- Benchmark ref used for this manifest: `3cda4081fed96103a6395de39c85e9b20275e307`
- Why keep it: it is a real TypeScript async lifecycle bugfix with public source and verifier artifacts,
  so it is useful for checking that Pier, Codex auth, patch capture, and reports work end to end.

Important: the 2026-07-03 Codex pilot is a setup artifact, not a valid paired correctness result. The
harness arm was manually interrupted after elapsed time was observed. A later no-interrupt full-cycle run
completed both arms, but current Codex `gpt-5.5` low reasoning saturated the task: baseline and harness
both reached `reward=1`, `f2p=14/14`, `p2p=165/165`. Use Happy DOM only as a public full-cycle smoke
task, not as proof of harness lift under saturated settings.

## Protocol

Preferred path: use the full-cycle runner. It pins the benchmark, prepares the harness arm, runs baseline
then harness serially through Pier, enforces the declared stop policy, and writes `manifest.json`,
`summary.json`, `report.md`, logs, and Pier job artifacts.

```bash
node templates/harness-eval-external/deepswe/run-full-cycle.mjs \
  --task etree-xml-diff-patch \
  --agent codex \
  --model gpt-5.5 \
  --reasoning-effort low \
  --codex-auth-json auto \
  --timeout-seconds 900 \
  --run-root /tmp/sg-deepswe-etree-full-cycle
```

Use `--dry-run` first to inspect the exact commands without spending model time. Use `--force` only for a
`/tmp/...` run root or a repo-local `docs/experiments/...` run root; the script refuses broader deletion
targets.

Codex runs default to `--reasoning-effort low` in this lane. That holds the compute budget equal across
baseline and harness arms. If baseline reaches perfect public verifier score, the runner reports
`not_proven_no_headroom` instead of a generic win/loss. A scoring run should not stop at a no-headroom
task; use the harder default task or another held-out DeepSWE task until baseline headroom is visible.
The runner also defaults to `--codex-auth-json auto`: when `OPENAI_API_KEY` is absent and
`~/.codex/auth.json` exists, it passes `CODEX_FORCE_AUTH_JSON=1` into Pier without logging the secret.
It also records a non-secret `chatgpt.com` allowlist hint because Codex auth.json uses the ChatGPT Codex
transport rather than the API-key transport.

Manual path:

1. Clone and pin DeepSWE.

```bash
git clone https://github.com/datacurve-ai/deep-swe /tmp/deep-swe
git -C /tmp/deep-swe checkout 3cda4081fed96103a6395de39c85e9b20275e307
```

2. Install the public runner.

```bash
uv tool install datacurve-pier
```

3. Prepare the harness arm. This copies one task and prepends the shipped supergoal reference to
   `instruction.md`; it does not alter verifier files or reference solutions.

```bash
node templates/harness-eval-external/deepswe/prepare-supergoal-arm.mjs \
  /tmp/deep-swe \
  /tmp/deep-swe-supergoal \
  etree-xml-diff-patch \
  .
```

4. Declare the stop policy before either arm runs. Manual post-hoc interruption invalidates paired
   correctness. A budgeted timeout is valid only when the timeout, patch-capture behavior, and scoring
   treatment are written into the run metadata before launch.

```yaml
stop_policy:
  timeout_seconds: 900
  valid_outcomes: [completed, budget_timeout, error]
  manual_interrupt: invalid_paired_correctness
  capture_patch_on_budget_timeout: true
  score_patch_after_terminate_timeout_or_error: true
```

5. Run baseline and harness with the same agent, model, environment, seed policy, and stop policy. The
   commands below
   use the leaderboard-style `mini-swe-agent`; a Codex-native run is allowed only if both arms use the same
   adapter and the report records that choice. If the adapter cannot commit because `.git` is read-only,
   capture the working-tree diff for both arms after the process terminates, times out by the declared
   budget, or errors; do not score `HEAD` for one arm and a working tree for the other.

```bash
pier run -p /tmp/deep-swe/tasks/etree-xml-diff-patch \
  --agent mini-swe-agent \
  --model openai/gpt-5.5

pier run -p /tmp/deep-swe-supergoal/tasks/etree-xml-diff-patch \
  --agent mini-swe-agent \
  --model openai/gpt-5.5
```

6. Record the artifacts for every seed:

- `verifier/reward.json`
- `verifier/ctrf.json`
- `verifier/test-stdout.txt`
- `verifier/run.log`
- `model.patch`
- Pier trajectory metadata
- `harness-metadata.json`
- stop policy and actual process outcome: `completed`, `budget_timeout`, `error`, or `invalid_manual_interrupt`

The full-cycle runner records `runner_timeout` separately when the outer safety timeout kills Pier. That
outcome is `Not proven`; it is not a valid completed or budget-timeout arm.

## Scoring

Report:

- Baseline pass rate: `baseline_reward_sum / baseline_runs`
- Harness pass rate: `harness_reward_sum / harness_runs`
- Absolute lift: `harness_pass_rate - baseline_pass_rate` in percentage points
- Relative lift: `absolute_lift / baseline_pass_rate` when baseline is non-zero
- Partial reward delta when `reward.json` exposes pass fractions
- Token, duration, and tool-call deltas

Minimum language:

- `n=1`: fixture smoke only, `Not proven`.
- `n>=3 paired seeds`: directional pilot.
- `n>=6 paired seeds`: first point where the paired sign-flip test can reach p < 0.05; use paired
  McNemar for binary pass/fail and report the exact p-value.
- Manual interruption after observing progress: invalid paired correctness. Report only diagnostic
  artifacts and rerun with a predeclared timeout.
- Completed tie where baseline is already perfect: `not_proven_no_headroom`. Report it as a valid
  full-cycle reliability check only, then run harder public tasks before claiming harness effectiveness.

## Controls

- Same benchmark ref, task id, upstream base commit, model, agent, and environment for both arms.
- Original DeepSWE task body hash recorded for the harness arm.
- Baseline gets no supergoal reference.
- Harness gets only the approved supergoal files embedded by the adapter.
- Hidden tests, verifier code, and solution patches are not copied into the prompt.
- A costlier harness loses unless correctness or partial reward improves enough to justify the overhead.
- `happy-dom-abort-pending-body-reads` is smoke only after the completed no-interrupt Codex run saturated
  both arms.
- `cliffy-config-file-parsing` remains secondary; it previously exceeded the low-turn budget without a
  patch under the Claude adapter.
