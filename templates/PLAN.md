# PLAN - <topic>

Frozen plan. A fresh-context implementer reads ONLY this file (plus the latest `R-LOOP.md` section on
re-entry) and builds it - the plan must be self-sufficient. Frozen after approval; changes append a
dated `## Amendment`.

## Approval

- Status: pending | approved-by-user | auto-approved
- Record: <timestamp; the user's OK verbatim, or "autonomous run (<harness-eval|background|pre-authorized>): auto-approved">

## Intent

- Goal / constraints / tradeoffs / rejected approaches:
- Completion promise: promised outcome, required proof, stop condition, `max_iterations` (default 3)

## Steps

1. <exact file paths, symbols, expected diff shape - plain language>

## Acceptance checklist

- [ ] <copied from GOAL.md Success Criteria, including edge-case/resilience criteria - the builder
  reads ONLY this file, so the checklist must be complete here>

## Tools & Skills

- <test command(s), dev server, agent-browser, fallback driver, db client, skills to load>

## Verification strategy

- Before proof: <what proves the start state>
- Step -> GOAL.md criterion: <step n -> criterion #>
- Trusted commands: `<cmd>` (frozen_repo | evaluator_owned)

## Grounding ledger

<compact: question -> answer/source -> decision (reference/plan-grounding.md, reference/interview.md)>
