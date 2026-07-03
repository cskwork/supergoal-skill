# DeepSWE Happy DOM Full-Cycle A/B - 2026-07-03

## Decision

Raw runner decision: `not_proven`.

Updated taxonomy classification from the same completed metrics: `not_proven_no_headroom`.

This is a valid no-manual-interrupt full-cycle run, but it is not evidence that the harness improves
correctness. Baseline already reached the public verifier ceiling. The raw run was produced before the
runner learned the no-headroom decision label.

## Run

- Benchmark: DeepSWE v1.1 local clone at `/tmp/deep-swe-sg`.
- Benchmark ref: `3cda4081fed96103a6395de39c85e9b20275e307`.
- Task id: `happy-dom-abort-pending-body-reads`.
- Task URL: `https://deepswe.datacurve.ai/data/v1/tasks/happy-dom-abort-pending-body-reads`.
- Source repo: `https://github.com/capricorn86/happy-dom`.
- Agent/model: Codex / `gpt-5.5`.
- Reasoning effort: `low`.
- Stop policy: `900s` agent budget per arm, `4500s` outer runner timeout, manual interruption invalid.
- Run root: `/tmp/sg-deepswe-happy-dom-full-cycle-auth-egress`.

## Results

| Arm | Outcome | Reward | F2P | P2P | Partial | Cost | Wall clock | Patch bytes |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| baseline | completed | 1 | 14/14 | 165/165 | 1 | $2.736928 | 531s | 22,974 |
| harness | completed | 1 | 14/14 | 165/165 | 1 | $3.091722 | 884s | 15,707 |

## Interpretation

Happy DOM remains useful as the default public full-cycle pilot because it exercises a real open-source
TypeScript lifecycle bug with independent DeepSWE verification. Under the tested Codex settings, however,
it no longer has correctness headroom: both arms solved it completely.

The harness arm produced a smaller patch but took longer and cost more. That is not an effectiveness win
without a correctness or partial-reward lift. Future effectiveness claims need harder held-out public tasks
or weaker/lower-budget settings where the baseline does not saturate.

## Artifacts

- Full-cycle summary: `/tmp/sg-deepswe-happy-dom-full-cycle-auth-egress/summary.json`.
- Full-cycle report: `/tmp/sg-deepswe-happy-dom-full-cycle-auth-egress/report.md`.
- Baseline job: `/tmp/sg-deepswe-happy-dom-full-cycle-auth-egress/jobs/baseline-happy-dom-abort-pending-body-reads-20260703-140555`.
- Harness job: `/tmp/sg-deepswe-happy-dom-full-cycle-auth-egress/jobs/harness-happy-dom-abort-pending-body-reads-20260703-140555`.
