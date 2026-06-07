# DB access - read-only, DB-independent QA data

QA-ONLY (and any QA cross-check) reads a database to fetch test auth, verify UI values against the
source of truth, and diff datasets/environments. This is a read-only, dialect-independent contract:
the same QA logic works over MySQL, PostgreSQL, or SQLite.

## Read-only (hard rule)

- Issue ONLY `SELECT`/`SHOW`/`DESCRIBE`/`EXPLAIN`. NEVER any write: DML (`INSERT`/`UPDATE`/`DELETE`/
  `MERGE`/`REPLACE`), DDL (`CREATE`/`ALTER`/`DROP`/`TRUNCATE`), DCL (`GRANT`/`REVOKE`), or a writing
  stored procedure (`CALL`).
- Prefer a read-only DB account; if only a write-capable account exists, still issue read-only
  statements only. For SQLite, open read-only (`sqlite3 -readonly <file>` or a `file:...?mode=ro` URI).
- The QA gate scans recorded DB commands and fails on any write verb. Do not work around it.

## DB-independent abstraction

Define what QA needs as operations, then bind to whatever the repo/host provides:

| QA operation | What it returns |
|---|---|
| get-auth | a test user's credentials / session / token to sign into the app |
| get-expected | the source-of-truth value(s) a screen should display |
| diff | the same query run against two datasets/environments, compared |

Bind in this order:

1. A DB-intelligence skill if installed (it understands schema and is safer than raw SQL):
   MySQL -> `https://github.com/cskwork/aidt-mysql-cli`; PostgreSQL -> `https://github.com/cskwork/postgres-intelligence`.
   Discover others via the skill tools / ToolSearch.
2. Else the raw CLI client: `mysql`, `psql`, or `sqlite3`.
3. SQLite is a plain local file — open it read-only (`sqlite3 -readonly <file>`) with the same
   SELECT-class statements.

Keep the QA scenario written against the operations above, not a specific dialect, so a suite re-runs
on a different DB by swapping only the binding.

## Connection details (never hardcode)

- Read connection info from env vars or a config file (`.domain-agent/qa.config`, repo config, or a
  user-provided path). Ask the user once if none is found.
- NEVER hardcode host/user/password/DSN in any file. NEVER log or persist credentials, tokens, or PII.
- Connection config lives in a gitignored path; the saved suite references the query by name, never
  the secret.

## Keep it out of conductor context

Run DB reads inside the dedicated `db-reader` subagent (`agents/db-reader.md`), separate from the
browser `qa-auditor`. Return pass/fail and a SMALL diff (expected vs actual, the differing keys), never
raw row dumps. Large result sets and any PII stay in the subagent and are summarized, not pasted, so the
conductor context stays small and clean. For UI-value integrity, `db-reader` writes the small expected
values to a sanitized `qa/expected.md` handoff table; the conductor reads it and passes the values to
`qa-auditor` to diff against the screen — the DB raw access never enters the browser agent. Auth/
credentials are returned for transient handoff only and are never written to a file.

## Record

In `verification.md` `## QA`, add a `DB:` line naming the dialect and that it was read-only, e.g.
`DB: postgres (read-only via postgres-intelligence)`. List the checks by name with pass/fail and the
small diff. No credentials, no raw rows, no PII.
