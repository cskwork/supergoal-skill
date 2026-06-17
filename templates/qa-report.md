<!--
QA-ONLY human report. Fill from the qa-auditor summary. Keep it readable by a non-engineer.
Prose in the user's language; keep the four `##` anchor headings in English (the gate greps them)
and keep file paths/commands verbatim. No credentials, no raw DB rows, no PII.
-->

# QA report - <objective>

- Date: <YYYY-MM-DD>   Target: <url/env>   Driver: <playwright-cli | CLI smoke>
- Comparison: <functional | data-integrity | before-after | ab | env>
- Verdict: <PASS | FAIL | PARTIAL>   Actions used: <action_count>/<action_cap>

## What worked

<plain-language list of scenarios/checks that passed, each with its evidence path>
- <scenario> -> PASS (`qa/to-be-<view>.png`)

## What didn't

<scenarios/checks that failed, each with the observed vs expected and evidence>
- <scenario> -> FAIL: expected <x>, saw <y> (`qa/as-is-<view>.png`)

## What I discovered

<concrete findings worth the user's attention: a UI value that disagreed with the DB source of truth,
a broken edge case, an A/B / before-after difference, a data-integrity gap. One finding per bullet.>
- <finding> (evidence: `qa/<file>`)

## How to re-run

<the exact way to reproduce this check next time, so it is repeatable>
- Suite: `.domain-agent/qa/<suite>.md`
- Command / spec: `<re-run command or qa/<suite>/<flow>.spec.ts>`
- DB checks: <named checks; read-only; connection from <env|config path>>

<!-- If the action cap was hit: list what remains so a follow-up run can continue. -->
