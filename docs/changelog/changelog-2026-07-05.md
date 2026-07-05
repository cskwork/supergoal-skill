# Changelog 2026-07-05

## DeepSWE difficult-SWE suite as forced HARNESS-EVAL default

**Decision:** difficult SWE / harness-effectiveness claims now default to a three-task DeepSWE suite:
`etree-xml-diff-patch`, `cliffy-config-file-parsing`, and `yjs-map-conflict-detection`.

**Why:** the latest Spark-low paired run showed that a single task can mislead. `etree` had directional
harness lift, `cliffy` had no effect, and `yjs` regressed from a perfect baseline by one preservation
check. The right default is therefore breadth across hard public tasks, not a single scoring candidate.

**Change:** added `run-default-suite.mjs` to invoke the existing full-cycle runner once per task, write
`suite-summary.json` and `suite-report.md`, and make task selection explicit. Updated `SKILL.md`,
`reference/harness-eval.md`, the DeepSWE README/manifest, and the contract test to force this default.

**Rejected alternatives:** keeping `etree-xml-diff-patch` as the sole default would preserve the old
directional-positive story but miss no-effect/regression evidence. Making Happy DOM a default again was
rejected because it is saturated and remains smoke-only.
