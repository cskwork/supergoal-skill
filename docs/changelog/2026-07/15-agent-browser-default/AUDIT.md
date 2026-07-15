# Independent audit — agent-browser default

## Summary

Intent: make agent-browser the default global QA/DEBUG/LEGACY browser driver and permit
playwright-cli only as a reasoned fallback. Verdict: **REQUEST CHANGES**.

The primary routes and concise agent instructions now name agent-browser first, and all requested
trusted checks pass. The enforcement contract is still bypassable, and three active reusable-QA
instructions retain Playwright-spec-only wording.

## Major findings

1. **The gate accepts ambiguous and conflicting driver records.**
   `templates/qa-gate.sh:88` selects only the first `Tool:` line, while lines 94 and 96 accept a
   prefix rather than an exact normalized value. The unchanged template value at
   `templates/QA.md:26` (`Tool: agent-browser | playwright-cli`) therefore passes. A QA section with
   both `Tool: agent-browser` and `Tool: headless Chrome` also passes. This violates the discovery
   requirement to reject duplicate, combined, and suffixed tool values. The focused scenario suite
   has no cases for those inputs.

2. **A vague Playwright fallback passes as concrete evidence.**
   `templates/qa-gate.sh:103-105` requires only three alphanumeric characters after removing the
   agent-browser name. `Fallback: agent-browser no go` exits 0, so preference-like or content-free
   text can satisfy a policy that requires a concrete limitation/reason.

3. **Active global guidance still steers repeatable QA to Playwright specs.**
   `reference/qa-only.md:116,123`, `reference/domain-context.md:55`, and
   `templates/domain-agent/qa/README.md:8-9` still require/name a Playwright spec path without
   limiting it to fallback runs. These are runtime instructions, not historical records, and conflict
   with the default-driver policy.

## Positive findings

- Agent-facing routes and core QA references consistently make agent-browser the default and label
  playwright-cli fallback-only.
- The wording in the main agent prompts is concise.
- Reference integrity reports no orphan persona or reference scope; the new agent-browser reference is
  reachable.
- No whitespace errors were found.

## Exact command results

| Command | Result |
|---|---|
| `QA_DRIVER_ONLY=1 bash tests/gate-scenarios.test.sh` | exit 0; 19 passed, 0 failed |
| `bash tests/qa-only-contract.test.sh` | exit 0; 88 passed, 0 failed |
| `bash tests/workflow-contract.test.sh` | exit 0; 23 passed, 0 failed |
| `bash tests/reference-integrity.test.sh` | exit 0; 4 passed, 0 failed |
| `git diff --check` | exit 0; no output |
| Gate probe: `Tool: agent-browser | playwright-cli` | exit 0; `QA GATE PASS` (unexpected) |
| Gate probe: duplicate `Tool: agent-browser` + `Tool: headless Chrome` | exit 0; `QA GATE PASS` (unexpected) |
| Gate probe: `Tool: playwright-cli` + `Fallback: agent-browser no go` | exit 0; `QA GATE PASS` (unexpected) |

## Required correction

Require exactly one exact normalized `Tool:` value, exactly one fallback line only for playwright-cli,
and a concrete limitation/failure reason. Add adversarial scenarios for template placeholders,
duplicate/combined/suffixed tools, duplicate fallback lines, and vague reasons. Make reusable-suite
wording driver-neutral, with Playwright specs explicitly limited to fallback runs.

## Verdict

**REQUEST CHANGES** — default routing is present, but fallback enforcement and global policy
consistency are not yet proven.
