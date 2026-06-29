# Docs Language Policy - DRY Prune

## Decision

State the docs-language policy once in `SKILL.md` (the always-loaded router) and have each phase file
point to it with the anchor `docs language (SKILL.md)`, carrying only that file's own verbatim tokens.

## Why

The 2026-06-29 policy ([29-doc-language-policy](../29-doc-language-policy/README.md)) restated the same
rule in seven places (`SKILL.md`, `arch`, `domain-context`, `learn-domain` x2, `qa-only`, `spec`,
`qa-report` template). Skill bodies are read by agents, so the duplication cost context on every load and
risked drift between copies. The router stays in context when a phase reference loads, so one canonical
statement is enough.

## What changed

- `SKILL.md`: tightened to the single source of truth; dropped the redundant "inspect existing docs" and
  the Korean/English example.
- Each phase file: full restatement -> `docs language (SKILL.md)` plus only its unique verbatim anchors
  (arch: none; domain-context: `language`/`mixed`; learn-domain: signatures and `Grounding:` markers;
  qa-only/qa-report: English `##` headings; spec: EARS keywords and requirement IDs).
- Seven contract-test anchors unified on `docs language (SKILL.md)` (`SKILL.md` keeps
  `dominant prose language`).

## Rejected Alternatives

- Drop the per-file mentions entirely: rejected - the contract tests pin that each phase file references
  the policy, guarding against silent removal.
- Keep distinct per-file phrasings: rejected - the variation was the duplication; one anchor is greppable
  and self-documenting.

## Verification

- `git diff --check` passed.
- `bash tests/run-all.sh` passed (68 JS + all contract suites); the seven docs-language assertions PASS.
