# Discovery — agent-browser as the default QA driver

## Decision

Browser QA must use [`agent-browser`](https://github.com/vercel-labs/agent-browser) by default.
`playwright-cli` is permitted only after `agent-browser` cannot complete reliable QA. Record exactly one
driver in `QA.md`:

```text
Tool: agent-browser
```

or, for an evidence-backed fallback:

```text
Tool: playwright-cli
Fallback: agent-browser failed: <command/error or unsupported capability>
```

Preference, familiarity, or convenience is not a fallback reason. The upstream CLI already supports the
capabilities this workflow requires: snapshots, screenshots/diffs, network request detail, tabs, saved
auth state, CDP connection, console/errors, and viewport control.

## Current state

The primary reference, core QA docs, agent prompts, templates, gate, and main scenarios now implement the
intended direction. Residual audit gaps remain: stale “Playwright spec path” wording in
`reference/qa-only.md`, `reference/domain-context.md`, and `templates/domain-agent/qa/README.md`; the gate
accepts suffixed or duplicate `Tool:` values because it checks only the first prefix match; and the
role-loop contract does not yet assert that `qa-auditor` also avoids `agent-browser` setup/invocation.

## Required changes

| Area | Exact files | Required change |
|---|---|---|
| Primary driver reference | `reference/agent-browser.md` (new), `reference/playwright-cli.md` | Add the primary install/command/auth/evidence guide for `agent-browser`. Reduce the Playwright document to fallback-only instructions; remove “ONLY driver”, the `agent-browser` ban, and “no Fallback needed”. Keep any Playwright version pin scoped to fallback. |
| QA workflow | `reference/qa.md`, `reference/qa-only.md` | Make `agent-browser` the first attempted driver and require a concrete `Fallback:` reason for `playwright-cli`. Replace driver-specific commands accurately: `network requests` / `network request <requestId>`, `tab` / `tab <tN|label>`, `state save/load`, `connect <port>`, and `set viewport`. Update `Tool:` examples, auth, exit-gate, and repeatable-script language. |
| Debug and orchestration | `reference/debugging.md`, `reference/role-loop.md` | Replace Playwright-only observation and verification instructions with `agent-browser` commands/default evidence; mention Playwright only as the documented fallback. |
| Reusable QA assets | `reference/domain-context.md`, `templates/domain-agent/qa/README.md` | Replace “Playwright spec path” with a driver-neutral repeatable script path, or specify an `agent-browser` batch/shell script with a Playwright spec only on fallback. |
| Agent-facing entry points | `README.md`, `SKILL.md`, `agents/debugger.md`, `agents/qa-tester.md`, `templates/GOAL.md`, `templates/PLAN.md`, `templates/QA.md`, `templates/domain-agent/qa/nav-map.md`, `templates/qa-report.md` | Preserve the in-progress direction, then reconcile wording with the new canonical reference. `templates/QA.md` must make the placeholder clearly replaceable (`Tool: <agent-browser | playwright-cli>`) and state that `Fallback:` is omitted for the default and mandatory for Playwright. |
| Enforcement | `templates/qa-gate.sh` | Accept exact `Tool: agent-browser` as the normal PASS. Accept exact `Tool: playwright-cli` only with a non-empty, in-section `Fallback:` naming the failed `agent-browser` attempt/capability. Reject missing, duplicate, combined, or substring-spoofed tool values and unsupported drivers. Keep as-is/to-be and contrast evidence rules unchanged. |
| Shared gates | `templates/qa-only-gate.sh`, `templates/commit-gate.sh` | No separate driver parser is needed; both already delegate to `qa-gate.sh`. Verify that the revised result propagates through each gate. |
| Gate scenarios | `tests/gate-scenarios.test.sh` | Invert the current single-driver cases: `agent-browser` + evidence passes; Playwright without a fallback reason fails; Playwright with a concrete fallback reason passes. Add duplicate/ambiguous `Tool:`, empty fallback, substring spoof, and non-QA-section masking cases. Change unrelated valid fixtures (contrast and completion scenarios) to `agent-browser`. |
| QA-only contract | `tests/qa-only-contract.test.sh` | Replace assertions for the Playwright-only owner/pin/auth contract with the agent-browser primary reference/install/auth contract plus Playwright fallback contract. Make the standard browser/DB fixtures use `agent-browser`; add one explicit valid fallback fixture. |
| Workflow/role contracts | `tests/workflow-contract.test.sh`, `tests/role-loop-contract.test.sh` | Assert `Tool: agent-browser` as the UI exit contract and updated role-loop wording. Keep the auditor browser-free by rejecting both `agent-browser` setup/invocation and `playwright-cli` fallback setup/invocation there. |

Historical `docs/changelog/**` and `docs/experiments/**` records should remain unchanged unless a file is
actively used as runtime instruction; they describe prior policy rather than the current contract.

## Risks and acceptance checks

- **Residual wording drift:** reusable-suite docs still imply every repeatable run is a Playwright spec,
  which can steer agents away from the default driver.
- **Contract drift:** current `qa-only`/workflow contract assertions contain wording not present in their
  target docs, so they fail even though the intended policy is visible.
- **Fallback loophole:** shell validation can require a reason but cannot prove it is truthful. Define valid
  triggers (installation/environment failure, reproducible driver failure, unsupported required capability)
  and make `qa-auditor` reject vague reasons.
- **Parser ambiguity:** the current substring check would accept misleading values containing a sanctioned
  name. Require exactly one normalized `Tool:` value and, for Playwright, exactly one concrete `Fallback:`.
- **Unsafe mechanical replacement:** agent-browser uses request IDs and stable tab IDs/labels, not
  Playwright indices; command-for-command replacement must follow the mappings above.
- **Reproducibility:** choose and record a tested `agent-browser` version/install policy; an unpinned global
  install can drift independently of contract tests.
- **Sensitive state:** saved auth state, HAR, and request detail can contain tokens or PII; retain the existing
  evidence-scrubbing and no-secret rules in the new reference.

Acceptance: `bash tests/run-all.sh` passes; targeted gate scenarios prove default PASS, unsupported-driver
FAIL, undocumented Playwright FAIL, documented Playwright fallback PASS, and propagation through QA-only
and commit gates; `rg -n "only.*playwright|playwright-cli.*only|No agent-browser|Tool: playwright-cli"`
finds only explicitly labeled fallback guidance/fixtures or historical records.

Audit-time checks: `tests/gate-scenarios.test.sh` passed its driver scenarios and
`tests/role-loop-contract.test.sh` passed; `tests/qa-only-contract.test.sh` had five wording-contract
failures, and `tests/workflow-contract.test.sh` had one wording-contract failure. Full-suite success is
therefore not yet proven.
