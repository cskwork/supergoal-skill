# PLAN - agent-browser QA default

## Approval

- Status: approved-by-user
- Record: 2026-07-15; user approved completion, commit, push, merge to main, and a minor release.

## Intent

- Goal: one global driver policy; agent-browser first, Playwright CLI only for a documented limitation.
- Completion promise: concise agent instructions, enforced fallback evidence, green contracts; max 3 iterations.

## Steps

1. Add `reference/agent-browser.md`; demote `reference/playwright-cli.md` to fallback-only.
2. Update the router, QA roles/references, templates, README, and debugging network commands.
3. Change `qa-gate.sh` and contract tests to enforce the policy.
4. Run focused and repository-wide contract checks.

## Acceptance checklist

- [x] Agent-facing QA routes default to agent-browser.
- [x] Playwright CLI requires a concrete fallback reason.
- [x] QA-only and shared templates agree.
- [x] Existing contracts remain green.

## Tools & Skills

- `skill-creator`, installed `agent-browser` skill, official agent-browser README, shell contract suite.

## Verification strategy

- Before proof: `TEST-RED.md` and `DISCOVERY.md` record the Playwright-only baseline and red contracts.
- Steps 1-3 -> criteria 1-3; step 4 -> criterion 4.
- Trusted commands: `QA_DRIVER_ONLY=1 bash tests/gate-scenarios.test.sh`; bounded all-contract batch.

## Grounding ledger

- Default commands -> installed skill + official upstream README -> concise `reference/agent-browser.md`.
- Fallback integrity -> silent fallback is unverifiable -> gate requires a concrete `Fallback:` reason.
