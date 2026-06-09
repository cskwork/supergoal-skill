# QA-ONLY mode - exercise + verify a running app, write no code

Use when the user wants QA, data verification, or a data comparison and explicitly NOT a code change:
"QA만", "qa only", "검증만 해줘", "데이터 정합성 확인", "API 수정 전후 확인", "A/B 테스트", "데이터 비교".

QA-ONLY drives an already-running app (and a read-only DB) like a user, records what worked / what
didn't / what it discovered in a human report, and persists a reusable, indexed QA suite so the same
check re-runs fast later. It writes NO production code, runs NO build, creates NO worktree, and runs
none of the default-loop phases (no Build/Critic/Fixer). It is read-only except
the run folder and the `.domain-agent/qa/` suite.

If the request actually needs a fix or feature, this is the wrong mode — route to DEBUG/LEGACY and use
QA there as a phase. QA-ONLY never edits product code, even to "quickly" fix what it finds; it reports
the finding and stops.

## Pipeline

`Intake -> Target & Access -> Scenario checkpoint -> Exercise -> Cross-check -> Report -> Persist`

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Capture QA goal, scenarios, comparison type, acceptance | `brief.md`, `state.json` | scenarios + comparison type stated |
| Target & Access | Resolve running-app target (URL/env, NOT built from repo), browser driver, read-only DB access, action budget | `brief.md` | target reachable; driver + DB access named; `action_cap` set (default 100) |
| Scenario checkpoint | Show scenario list + budget + comparison type; let the user narrow | run note | user confirms or narrows; proceed unless told to wait |
| Exercise | Drive the app through scenarios via `qa-auditor`, capped | `verification.md` `## QA`, `qa/`, `state.json` | each scenario pass/fail recorded; combined `action_count` written to `state.json`, `<= action_cap` |
| Cross-check | Read-only DB checks via `db-reader`: auth, source-of-truth expected values, dataset/env diff | `verification.md` `## QA`, `qa/` | each check pass/fail + small diff recorded; no raw dumps |
| Report | Human-friendly result | `report.md` | `## What worked`, `## What didn't`, `## What I discovered`, `## How to re-run` present |
| Persist | Save reusable suite, index it | `.domain-agent/qa/<suite>.md`, `index.md` | suite + re-run steps saved; no secrets/PII; path gitignored |

## Target & Access

- **Target.** QA-ONLY tests an existing running app. Ask for the URL/environment (e.g. `http://localhost:3000`,
  staging). Only start a local server if the user asks; never build product code to get one. Static
  single HTML opens via `file://`.
- **Browser driver.** `agent-browser` is the default driver (preflight + record `agent-browser doctor`,
  same as `reference/qa.md`). When an authenticated/real logged-in session is required, switch to
  **attach-to-browser** (Playwright CLI; `https://github.com/cskwork/attach-to-browser-skill`) and record
  it on the `Tool:`/`Fallback:` lines. See `reference/qa.md` "Authenticated sessions".
- **DB access.** Read-only, DB-independent, via `reference/db-access.md`. Used for: fetch test
  auth/credentials, verify UI values against the DB source of truth, and run dataset/environment diffs.

## Comparison types

State one in `brief.md` `Comparison:`; it picks what the Cross-check phase compares.

| `Comparison:` | Compares | How |
|---|---|---|
| `functional` | scenario outcome vs expected behavior | drive the golden + edge path; assert each step |
| `data-integrity` | UI value vs DB source of truth | read the value on screen, query the DB, diff |
| `before-after` | a saved baseline suite vs the app now (regression after an API/code change) | re-run a persisted `.domain-agent/qa/<suite>.md`; diff against its baseline |
| `ab` | variant A vs variant B (A/B test arms) | run the same scenario on each arm; diff outcome/data |
| `env` | environment A vs environment B | run the same scenario/query on each; diff outcome/data |

## Action cap (anti-context-overload)

Each browser interaction (`open/click/type/fill/snapshot/screenshot`) and each DB query counts as one
QA action. Default `action_cap` is **100** (override per run at Target & Access for a known-large flow).
The conductor splits the budget by comparison type: `functional` gives all to `qa-auditor` (no DB);
DB comparisons reserve a small `db-reader` sub-budget and give the rest to `qa-auditor`. Each agent
honors its sub-budget and reports its count; the conductor sums them into `state.json.action_count` (this
write is the Exercise/Cross-check exit). At the cap a subagent STOPS and reports what is done and what
remains; the conductor writes the report and asks whether to continue with a fresh budget. The gate
fails if `action_count > action_cap`. The cap exists so a run stays scoped and the user does not get
lost in an unbounded crawl.

## Vault (reduced run folder)

`docs/changelog/<YYYY-MM>/<DD-qa-topic>/` with: `brief.md`, `verification.md` (machine `## QA` evidence),
`report.md` (human), `qa/` (evidence files), `state.json`. No `plan.md` — nothing is
planned-to-ship. The per-run report stays here; the reusable suite goes to the
domain pack (below).

## Report (the one human-facing deliverable)

Write `report.md` from `templates/qa-report.md`, in the user's language under English anchor headings:
`## What worked`, `## What didn't`, `## What I discovered`, `## How to re-run`. Lead with the verdict,
then per-scenario pass/fail with the evidence path, then concrete findings (e.g. a UI value that
disagreed with the DB), then the exact command/suite to re-run. Keep it readable by a non-engineer.

## Persist (repeatable + indexed)

Save the run as a reusable suite under the domain pack (`reference/domain-context.md` saving loop):

- `.domain-agent/qa/<suite>.md`: scenario list, steps, the `Comparison:` type, the DB checks (queries
  by name, never raw secrets/data), the saved baseline values for `before-after`, and the re-run
  command / Playwright spec path.
- Index it in `.domain-agent/index.md` under `## QA Suites` so "re-run the <feature> QA" routes
  instantly.
- Same rules as the domain pack: read-only repo write, gitignored path, no secrets/tokens/PII/raw rows.

On a repeatable Playwright spec, save it to `.domain-agent/qa/<suite>/<flow>.spec.ts` (first run may be
hand-driven; a re-check proposes the spec per `reference/qa.md` "Repeatable script").

A `before-after` re-run must check the saved baseline is still valid: confirm its capture date and that
the schema/contract it asserts has not moved since; if it has, re-derive the baseline before diffing so
a stale baseline does not read as a regression (or a real regression as a pass).

## Gate

`bash templates/qa-only-gate.sh <vault> <browser|cli>` exits 0 only when: `report.md` carries the four
anchor headings; the underlying `qa-gate.sh` browser/CLI evidence passes; `action_count <= action_cap`
in `state.json`; and, if a DB was used, a `DB:` line marks it read-only and no write verb
(INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE) appears in the recorded DB commands. Never edit the gate to
pass.

## Dispatch

Two separate read-only subagents keep concerns (and PII) isolated:

- `qa-auditor` (`agents/qa-auditor.md`): drives the running app; screenshots/dumps stay in its context.
- `db-reader` (`agents/db-reader.md`): reads the DB read-only; raw rows/secrets stay in its context.

Handoff is conductor-mediated through the vault, never agent-to-agent. For `data-integrity`, `db-reader`
writes a small sanitized `qa/expected.md` (a `field -> expected value` table for the fields under test —
no raw rows, no secrets, no PII); the conductor reads it and injects those small values into `qa-auditor`,
which diffs them against the UI. **Auth/credentials are the exception: handed off transiently in the
`qa-auditor` prompt, never written to any file.** For `ab`/`env`/dataset diffs with no UI, `db-reader`
returns the diff directly. The conductor receives only the two compressed summaries and assembles
`report.md`. Never drive the browser or DB from the conductor.

`qa/expected.md` does double duty: the handoff now, and the saved **baseline** a `before-after` re-run
diffs against later (it travels into the persisted suite).

## Stop conditions

- Target not reachable: report it; do not build product code to conjure one.
- A finding needs a code fix: report it as a finding and recommend switching to DEBUG/LEGACY; do not
  edit product code.
- DB only reachable with a write-capable account: still issue read-only statements only; never write.
- Action cap hit: stop, report done + remaining, ask before spending a fresh budget.
- DB credentials or PII would land in a saved file: redact; never persist secrets or raw rows.
