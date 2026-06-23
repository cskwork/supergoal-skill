# Changelog 2026-06-24

## Supergoal optimization hardening

- Decision: harden executable contracts first, then update docs. Prose-only guidance was rejected because
  the research gaps were mostly gate holes: empty QA evidence, unscoped driver lines, weak QA-ONLY
  ledger checks, loose HARNESS-EVAL scoring, and YAML frontmatter parsing.
- Added canonical verification: `tests/run-all.sh` runs every shell contract, Node syntax checks, and the
  zero-dependency URL shortener example tests.
- Added read-only install drift audit: `templates/skill-install-audit.mjs` compares source `SKILL.md`
  with active `.agents`, `.codex`, and `.claude` installs. It reports copied installs and fails on hash
  drift. Auto-rewriting active installs was rejected because copied directories may contain local edits.
- Pinned browser-driver docs to `@playwright/cli@0.1.14` instead of `@latest`, based on the registry check
  used during this optimization pass. Future pin changes should update docs and rerun `tests/run-all.sh`.
- Rejected lightweight routing lanes after review: this skill is intended for heavy tasks, so the active
  contract keeps the full routed workflow instead of adding small-task shortcuts.
- Clarified DB optionality: if DB truth is load-bearing but DB access is missing, skipped, or unsafe,
  record `DB evidence: Not covered` with residual risk instead of silently passing.
- Refreshed `docs/DESIGN.md` so removed `delivery-gate.sh` and `human-feedback-gate.mjs` references are
  historical validation notes, not current live gates.

## Verification

- `bash tests/run-all.sh` passed.
- `git diff --check` passed.
