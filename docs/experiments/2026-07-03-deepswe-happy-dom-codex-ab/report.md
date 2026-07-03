# DeepSWE Happy DOM Codex A/B - 2026-07-03

## Decision

Invalid as a paired correctness A/B. The baseline result is valid, but the harness arm was manually
interrupted, so its verifier score is diagnostic only. This run proves the initial setup was not a clean
reliability test; it does not prove the harness is better or worse on correctness.

## Task

- Benchmark: DeepSWE v1.1 local clone at `/tmp/deep-swe-sg`.
- Task id: `happy-dom-abort-pending-body-reads`.
- Task URL: `https://deepswe.datacurve.ai/data/v1/tasks/happy-dom-abort-pending-body-reads`.
- Source repo: `https://github.com/capricorn86/happy-dom`.
- Base commit: `82a0888cb2c87a6123e05424b528f8e8c9b3e426`.
- Category/language: bugfix, TypeScript.
- Requirement surface: pending request/response body reads and multipart `formData()` must abort on
  shutdown/navigation replacement; buffered responses remain readable; discarded timers/RAF clear.

## Runner Controls

- Agent: Codex CLI `0.142.5`.
- Model: `gpt-5.5`.
- Reasoning effort: `low`.
- Baseline command used `--ignore-user-config --ignore-rules`; no installed skills were visible.
- Harness command used the same flags and the prepared harness prompt under
  `/tmp/deep-swe-supergoal-happy-20260703/tasks/happy-dom-abort-pending-body-reads/instruction.md`.
- Both arms started from clean copies of the same public Docker image source tree.
- Verifier: DeepSWE task verifier in
  `public.ecr.aws/d3j8x8q7/swe-bench-202605:kh7c2re7cvbseq7xz6samd1xr182y1dc-v1.1`.
- Adapter caveat: Codex workspace sandbox made `.git` read-only, so official committed `HEAD` capture
  would be empty. This run scored the working-tree diff for both arms.
- Stop-policy caveat: no fixed timeout was declared before the run. The harness arm was stopped manually
  after it exceeded the baseline runtime, so it cannot be treated as a clean completed arm.

## Results

| Axis | Baseline | Harness diagnostic | Delta |
|---|---:|---:|---:|
| Binary reward | 0 | 0 | 0 |
| Hidden f2p pass rate | 1/14 = 7.14% | 1/14 = 7.14% | 0.00 pp |
| Preserve p2p pass rate | 165/165 = 100% | 165/165 = 100% | 0.00 pp |
| Partial score | 0.9273743017 | 0.9273743017 | 0 |
| Tokens | 176,591 | 213,917 | +37,326 (+21.1%) |
| Wall clock from log birth/mtime | 328s | 589s interrupted | +261s (+79.6%) |
| Patch size | 14,954 bytes | 17,549 bytes | +2,595 bytes |
| Process outcome | completed | manually interrupted | invalid paired arm |

## Verifier Artifacts

- Baseline patch: `/tmp/sg-codex-happy-baseline-score/artifacts/model.patch`.
- Baseline reward: `/tmp/sg-codex-happy-baseline-score/verifier/reward.json`.
- Baseline CTRF: `/tmp/sg-codex-happy-baseline-score/verifier/ctrf.json`.
- Baseline raw run log: `/tmp/sg-codex-happy-baseline-score/verifier/run.log`.
- Harness patch: `/tmp/sg-codex-happy-harness-score/artifacts/model.patch`.
- Harness reward: `/tmp/sg-codex-happy-harness-score/verifier/reward.json`.
- Harness CTRF: `/tmp/sg-codex-happy-harness-score/verifier/ctrf.json`.
- Harness raw run log: `/tmp/sg-codex-happy-harness-score/verifier/run.log`.

## Interpretation

Because the harness arm was interrupted, this run must not be used as a correctness win/loss. The
diagnostic verifier run on the partial harness patch happened to tie the baseline score, but that is not a
fair paired result.

The useful evidence is narrower: the initial external-benchmark setup was too loose. Future runs need a
declared stop policy before execution, or they need to run both arms to natural completion. Manual
interruption after observing elapsed time should be recorded as a setup failure, not as harness quality.

## Rejected Conclusions

- Do not claim `u3` as a harness win. It proves fixture discrimination, not paired skill lift.
- Do not claim the Happy DOM harness arm improved or failed correctness. The harness arm was manually
  interrupted, so the partial-patch verifier score is diagnostic only.
- Do not use the earlier Cliffy run as a skill result. Both arms hit exploration/max-turn limits and made
  no patch under the Claude adapter.

## Next Test

Make this task the default public DeepSWE pilot, but rerun it with the manifest stop policy declared
before launch. Use the same timeout, adapter, patch-capture rule, and verifier for both arms. Adoption
requires a positive correctness delta from completed or predeclared-budget-timeout arms, without manual
post-hoc interruption.
