# Archify as the TEACH diagram default

## Decision

Use Archify by default when a TEACH lesson explains system structure, workflow, call sequence, data
movement, or lifecycle state. Keep the editable JSON IR and validated HTML in
`teach/<topic>/diagrams/`, then embed and link the diagram from the lesson.

This supersedes the 2026-07-11 decision not to wire Archify into TEACH. That earlier boundary matched
the user's scope at the time; the present request explicitly expands the integration to teaching.

## Why

The user prefers Archify's diagram language. Making it part of the TEACH route gives lessons one
consistent visual grammar, preserves dark/light and export controls, and keeps diagram sources
re-renderable instead of hand-drawn.

## Boundaries

- Keep the interactive quiz or simulator; a diagram explains relationships but does not provide
  retrieval practice.
- Skip Archify only for purely definitional or syntax lessons where there is no meaningful
  relationship to draw; record the reason in the topic `NOTES.md`.
- Validate through the existing Archify render/check loop and keep the lesson gate unchanged.

## Alternatives rejected

- Require a diagram for every lesson: rejected because forced boxes add noise to definition-only
  topics.
- Replace the lesson simulator with the diagram: rejected because passive inspection does not meet
  the active-practice contract.
- Hand-write inline SVG: rejected because it loses Archify's validation, consistent styling, and
  editable JSON source.

## Verification

- `bash tests/teach-contract.test.sh`: 78 passed, 0 failed.
- `bash tests/run-all.sh`: passed.
- Temporary TEACH workflow: Archify render/check passed, iframe path resolved, lesson gate passed.
- `git diff --check`: passed.
- Browser rendering was not executed because the installed `agent-browser` command was unavailable.
