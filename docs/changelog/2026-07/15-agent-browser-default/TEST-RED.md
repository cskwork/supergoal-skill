# TEST RED — agent-browser default QA driver

Run after the contract-test edits, before the agent-facing policy text was complete:

```text
rtk bash tests/gate-scenarios.test.sh
rtk bash tests/qa-only-contract.test.sh
rtk bash tests/workflow-contract.test.sh
```

Result: RED.

- `tests/qa-only-contract.test.sh`: failed 5 policy assertions. The current `agents/qa-tester.md`, `reference/qa.md`, and `reference/playwright-cli.md` did not yet state the agent-browser default, Playwright fallback-only rule, or required reason for the fallback.
- `tests/workflow-contract.test.sh`: 22 passed, 1 failed. `reference/role-loop.md` did not yet explain that QA.md must record why agent-browser could not complete reliable QA.
- `tests/gate-scenarios.test.sh`: the initial run was non-zero while the fallback validation contract was being aligned; the behavior cases cover direct agent-browser acceptance, scoped `## QA` driver selection, unsupported/headless rejection, and reasoned Playwright fallback.
