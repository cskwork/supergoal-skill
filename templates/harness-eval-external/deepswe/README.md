# DeepSWE External Harness Eval

Use this lane when local fixtures ceiling out or when the user asks for an independently replayable,
public source-code task. DeepSWE supplies public repositories, pinned base commits, isolated task
containers, and verifier artifacts.

## Decision

Do not claim `u3` proves a harness win. `u3` proves the fixture discriminates: visible checks can pass
while hidden authorization/cache checks fail. A harness win needs paired public benchmark artifacts.

## Default Public Pilot

Primary task: `happy-dom-abort-pending-body-reads`

- Benchmark task: `https://deepswe.datacurve.ai/data/v1/tasks/happy-dom-abort-pending-body-reads`
- Upstream repo: `https://github.com/capricorn86/happy-dom`
- Base commit: `82a0888cb2c87a6123e05424b528f8e8c9b3e426`
- Benchmark ref used for this manifest: `3cda4081fed96103a6395de39c85e9b20275e307`
- Why this first: it is a real TypeScript async lifecycle bugfix with pending body reads, abort behavior,
  multipart parsing, navigation cleanup, and preservation checks. The 2026-07-03 Codex pilot showed
  public verifier headroom (`f2p=1/14`, `p2p=165/165`) without relying on private LMS code.

Important: the 2026-07-03 Codex pilot is a setup artifact, not a valid paired correctness result. The
harness arm was manually interrupted after elapsed time was observed. Use Happy DOM as the default public
task because it has meaningful domain headroom; do not cite that interrupted run as proof of harness lift.

## Protocol

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
  happy-dom-abort-pending-body-reads \
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
pier run -p /tmp/deep-swe/tasks/happy-dom-abort-pending-body-reads \
  --agent mini-swe-agent \
  --model openai/gpt-5.5

pier run -p /tmp/deep-swe-supergoal/tasks/happy-dom-abort-pending-body-reads \
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

## Controls

- Same benchmark ref, task id, upstream base commit, model, agent, and environment for both arms.
- Original DeepSWE task body hash recorded for the harness arm.
- Baseline gets no supergoal reference.
- Harness gets only the approved supergoal files embedded by the adapter.
- Hidden tests, verifier code, and solution patches are not copied into the prompt.
- A costlier harness loses unless correctness or partial reward improves enough to justify the overhead.
- `cliffy-config-file-parsing` remains a secondary broad feature task, not the default low-effort pilot;
  it previously exceeded the low-turn budget without a patch under the Claude adapter.
