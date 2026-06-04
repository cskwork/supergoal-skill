# Changelog 2026-06-05

## QA-ONLY mode: no-code QA / data-comparison run with a human report and a reusable indexed suite

### Decision

Add a sixth mode, **QA-ONLY**, for when the user wants QA, data verification, or a data comparison and
explicitly NOT a code change ("QA만", "검증만", "데이터 정합성", "API 수정 전후 확인", "A/B"). It exercises an
already-running app (and a read-only DB) like a user, writes no production code, creates no worktree, and
runs none of the implementation gates (Validate/Human Feedback/Committee/Deliver). Pipeline:
`Intake -> Target & Access -> Scenario checkpoint -> Exercise -> Cross-check -> Report -> Persist`.

New `reference/qa-only.md` is the mode spec. Key design points:

- **No-code, read-only.** Tests an existing running target (URL/env), never builds product code to get
  one. A finding is reported, not fixed; if a fix is needed it routes to DEBUG/LEGACY.
- **Browser driver.** `agent-browser` by default; **attach-to-browser** (Playwright CLI,
  `cskwork/attach-to-browser-skill`) when a real authenticated session is required. Recorded on the
  existing `Tool:`/`Fallback:` lines so `qa-gate.sh`'s non-agent-browser check is reused unchanged
  (`reference/qa.md` gained an "Authenticated sessions" subsection).
- **DB access is read-only and DB-independent** (`reference/db-access.md`): operations (get-auth,
  get-expected, diff) bind to a DB-intelligence skill if installed (mysql -> aidt-mysql-cli, postgres ->
  postgres-intelligence) else the raw CLI (`mysql`/`psql`/`sqlite3`). SELECT-class only; creds from
  env/config, never hardcoded/logged; small diffs only, never raw rows or PII.
- **Two separate read-only subagents** (`agents/qa-auditor.md` drives the app, `agents/db-reader.md`
  reads the DB) so DB raw rows/PII never enter the browser agent's context. Handoff is
  conductor-mediated through the vault: for data-integrity, `db-reader` writes a small sanitized
  `qa/expected.md` (`field -> expected value`) that the conductor relays to `qa-auditor` for the UI diff;
  auth is handed off transiently in the prompt and never written to a file.
- **Action cap (default 100).** Each browser interaction and each DB query is one action; the conductor
  splits the budget between the two agents and sums to `state.json.action_count`. At the cap a subagent
  stops and reports remaining; the gate fails if `action_count > action_cap`. Keeps a run scoped so the
  user does not get lost in an unbounded crawl.
- **Human report is the one verbose deliverable.** `report.md` (from `templates/qa-report.md`) under
  English anchor headings `## What worked` / `## What didn't` / `## What I discovered` / `## How to
  re-run`, prose in the user's language, readable by a non-engineer.
- **Repeatable + indexed.** The run persists a reusable suite to `.domain-agent/qa/<suite>.md` (scenarios,
  comparison type, DB checks by name, baseline values, re-run command / Playwright spec) indexed in
  `index.md` `## QA Suites`, so "re-run the <feature> QA" routes instantly. Same domain-pack rules:
  gitignored, no secrets/PII.

New terminal gate `templates/qa-only-gate.sh <vault> <browser|cli>` (QA-ONLY runs no delivery gate):
report anchors present, the shared `qa-gate.sh` browser/CLI evidence passes, `action_count <= action_cap`
(default cap 100), and if a DB was used it is marked read-only with no write SQL recorded
(INSERT/UPDATE...SET/DELETE/MERGE/TRUNCATE/DROP/ALTER/CREATE backstop).

Spine/overlay wiring: `SKILL.md` (mode row + note, reduced-vault note, reference map + template-script
rows, description trigger), `reference/pipeline.md` (QA-ONLY phase table), `reference/experts.md`
(qa-auditor + db-reader dispatch rows), `reference/domain-context.md` + `templates/domain-agent/index.md`
(`qa/` suites + `## QA Suites` routing), `README.md` (mode row + example).

### Reasoning

The skill could already QA *inside* a build/debug run, but had no way to QA *only* — every mode wrote
code, took a worktree, and ran the full delivery apparatus, which is wrong when the user just wants to
verify behavior or compare data. QA-ONLY reuses the existing QA machinery (`qa-tester` driving rules,
`qa-gate.sh` evidence checks, the domain pack's saving loop) rather than reinventing it, and adds only
what is genuinely new: a read-only DB cross-check, a comparison-type switch, an action budget, a human
report, and a persisted indexed suite for repeatability.

DB and app driving are split into two subagents (a design choice confirmed mid-task) for the same reason
the skill isolates every role: one job per agent, and — specifically here — to keep database raw rows and
PII out of the browser agent and out of the conductor. The conductor-mediated `qa/expected.md` handoff
follows the skill's "shared state is the vault, agents never read each other's transcripts" contract, and
doubles as the saved baseline a `before-after` regression run diffs against. The read-only rule is
enforced twice (agent instruction + gate SQL scan) because read-only is the safety boundary of the whole
mode. The action cap is the user's explicit anti-context-overload requirement; making it a gated number
(not just prose) means a run cannot silently sprawl. The report is the only place verbosity is wanted, so
it is the only human-tier artifact; everything else stays terse and agent-facing.

### Post-review hardening

Two read-only review agents (code-reviewer + critic) ran against the change; their real findings were
folded in before commit:

- **Attach-to-browser vs the shared QA gate (HIGH).** `qa-gate.sh` requires an `agent-browser doctor`
  preflight on every browser run, which would reject a sanctioned attach-to-browser run. Resolved without
  weakening the shared gate (its anti-silent-fallback invariant is intentional): `agents/qa-auditor.md`
  and `reference/qa.md` now require the doctor preflight to be recorded even when attach-to-browser is
  the chosen driver, so the existing gate passes an auth run unchanged.
- **DB read-only backstop gaps (HIGH/MEDIUM).** `qa-only-gate.sh` now also flags `REPLACE INTO`,
  `GRANT`/`REVOKE`, and `CALL`, and checks read-only **per `DB:` line** so a second unmarked connection
  cannot ride behind a first read-only one. `db-access.md`/`db-reader.md` enumerate the same verbs and
  add SQLite read-only open mode (`sqlite3 -readonly` / `?mode=ro`).
- **Reduced-vault contradiction (MAJOR).** `reference/vault.md` ("six files") and `reference/pipeline.md`
  ("six files only") now carry the QA-ONLY reduced-folder carve-out, matching `SKILL.md`.
- **Gate-required state fields (MAJOR).** `templates/state.json` now declares `action_count`/`action_cap`
  (the keys `qa-only-gate.sh` requires) so an agent copying the scaffold cannot miss them.
- **Smaller fixes.** report anchors matched as real headings (line-anchored, not substrings);
  `db-reader` frontmatter gains `Write` to match its documented writes; `qa-report.md` Driver line
  allows `CLI smoke`; budget-split default and `before-after` baseline-staleness notes added to
  `qa-only.md`.

### Verification

New `tests/qa-only-contract.test.sh`: 39 wiring assertions + 17 `qa-only-gate.sh` scenarios (each asserts
exit code AND an output substring) = 56/0, covering usage errors, the four report headings, missing
brief/report, action-cap over/under/default/non-numeric, attach-to-browser auth, the DB
read-only / not-read-only(incl. mixed multi-line) / write-SQL(incl. REPLACE/GRANT) cases, and CLI
app-type. Full suite re-run with no regressions: domain-context 37/0, gate-scenarios 100/0, interview
26/0, learn 11/0, learn-domain 29/0, qa-only 56/0, ui-ux 17/0, worktree 17/0 = 293 passed, 0 failed.

### Files

`reference/qa-only.md` (new), `reference/db-access.md` (new), `agents/qa-auditor.md` (new),
`agents/db-reader.md` (new), `templates/qa-report.md` (new), `templates/qa-only-gate.sh` (new),
`tests/qa-only-contract.test.sh` (new), `SKILL.md`, `reference/pipeline.md`, `reference/qa.md`,
`reference/experts.md`, `reference/domain-context.md`, `templates/domain-agent/index.md`, `README.md`.
