# GOAL - agent-browser QA default

## Original Request

> have option in qa globally to playwright cli currently default playwright cli but make default
> https://github.com/vercel-labs/agent-browser agent browser then playwrigth cli as option when agent
> browser cannot qa properly or as fallback. keep wording succint because skill used by agent only

## Spec

Make agent-browser the global QA/DEBUG/LEGACY browser driver. Keep playwright-cli only as an explicit
fallback with a recorded reason. Update agent-facing routing, procedures, templates, gates, and tests.

## Success Criteria

- [x] Agent-facing QA routes default to agent-browser - verify: `tests/workflow-contract.test.sh`
- [x] Playwright CLI is accepted only with a concrete agent-browser fallback reason - verify: `QA_DRIVER_ONLY=1 bash tests/gate-scenarios.test.sh`
- [x] QA-only and shared templates use the same policy - verify: `tests/qa-only-contract.test.sh`
- [x] Existing repository contracts remain green - verify: bounded all-contract batch recorded in `QA.md`

## Decision Gates

| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | choose fallback evidence | resolved | Silent fallback cannot prove the default was attempted | Require `Fallback:` naming the agent-browser limitation | gate scenario 6 |
