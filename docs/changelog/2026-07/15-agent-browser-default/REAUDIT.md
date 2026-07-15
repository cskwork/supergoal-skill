# Independent re-audit — agent-browser default

## Summary

Verdict: **REQUEST CHANGES**.

The audit bypasses are fixed: all six direct adversarial probes now exit 1, the focused driver gate
passes 26/26, and active reusable-QA guidance is driver-neutral with Playwright specs limited to
documented fallback runs. The requested QA-only contract is still red, so the change set cannot receive
a PASS verdict.

## Remaining finding

`bash tests/qa-only-contract.test.sh` exits 1 with 87 passed and 1 failed. The failing assertion expects
`reference/qa-only.md` to contain the normalized phrase `coverage, uncovered areas, and residual risks`.
The current text at `reference/qa-only.md:115-116` says `coverage, uncovered areas, residual risks`, so
the contract and the reusable-suite wording no longer agree exactly.

This is the only failure in the requested check set. No implementation was edited during this re-audit,
and `QA.md` was not updated because the re-audit verdict is not PASS.

## Exact command results

| Command | Result |
|---|---|
| `QA_DRIVER_ONLY=1 rtk bash tests/gate-scenarios.test.sh` | exit 0; 26 passed, 0 failed |
| `rtk bash tests/qa-only-contract.test.sh` | exit 1; 87 passed, 1 failed; `qa-only persists impact coverage` missing `coverage, uncovered areas, and residual risks` in `reference/qa-only.md` |
| `rtk bash tests/workflow-contract.test.sh` | exit 0; 23 passed, 0 failed |
| `rtk bash tests/reference-integrity.test.sh` | exit 0; 4 passed, 0 failed |
| `rtk git diff --check` | exit 0; no output |

## Independent bypass probes

Each probe used non-empty `qa/as-is-1040.png` and `qa/to-be-1040.png` evidence and invoked
`templates/qa-gate.sh <probe-vault> browser` through an `rtk bash` probe harness.

| Probe | Result | Gate message |
|---|---|---|
| `Tool: agent-browser \| playwright-cli` | exit 1 | unsupported driver; value must be exactly `agent-browser` or `playwright-cli` |
| duplicate `Tool:` lines | exit 1 | `## QA must contain exactly one 'Tool:' line` |
| `Tool: agent-browser via wrapper` | exit 1 | unsupported driver; value must be exact |
| duplicate `Fallback:` lines on `playwright-cli` | exit 1 | `playwright-cli runs must contain exactly one 'Fallback:' line` |
| `Fallback:` present on `agent-browser` | exit 1 | `agent-browser runs must contain no 'Fallback:' line` |
| `Fallback: agent-browser no go` | exit 1 | fallback needs a concrete agent-browser limitation/failure reason |

## Reusable-QA wording check

The prior wording finding is corrected:

- `reference/qa-only.md:114-125` defaults reusable reruns to saved agent-browser steps; a Playwright
  spec is saved only for a documented fallback.
- `reference/domain-context.md:53-56` requires driver-neutral rerun steps and permits Playwright spec
  paths only for documented fallback runs.
- `templates/domain-agent/qa/README.md:7-10` uses the same driver-neutral/fallback-only policy.
- `reference/qa.md:132-135` asks for an agent-browser batch/script by default and a Playwright spec only
  when fallback is required.

## Verdict

**REQUEST CHANGES** — enforcement and reusable-QA wording now satisfy the audit, but the required
QA-only contract must return to green before PASS.
