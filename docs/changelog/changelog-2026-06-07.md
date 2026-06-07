# Changelog - 2026-06-07

## Merge Conflict Resolution

- Resolved the `reference/harness-eval.md` delete/modify conflict by keeping the merged reference content.
- Reason: current harness-eval experiment notes still name this reference as the accuracy-fix target, so deleting it would drop the documented follow-up contract.

## Self-contained DB access

- Added optional DB evidence for GREENFIELD, DEBUG, LEGACY, and QA-ONLY through `reference/db-access.md`,
  `agents/db-reader.md`, and `templates/db-access/`.
- Reason: agents need safe database context when schema or persisted data is part of the domain, but DB
  connection must work inside `supergoal` with a Windows/macOS-compatible Node runner over native
  `psql`/`mysql`/`sqlite3` clients and no required external skill.
- If `.domain-agent/db/.env` is missing, the agent asks the user to fill it, provide `DB_ENV_FILE`, or
  skip DB evidence; secrets stay out of tracked files and transcripts.
