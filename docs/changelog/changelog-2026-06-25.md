# Changelog 2026-06-25

## Release v0.3.6 - TEACH/LEARN grounding

Cut `v0.3.6` from `main` at the four commits since `v0.3.5`. All changes are in the TEACH/LEARN modes;
the router, mode table, and safety contracts are untouched. The release tightens how lessons are taught
and proven, not which modes exist.

- TEACH lesson output gate (`templates/teach-lesson-gate.mjs`): a lesson must link the shared scaffold
  (`lesson.css` / `quiz.js` / `lesson-book.js`), use the `.book` page shell, and ship a hydrated
  `.sg-quiz` with a `data-correct` option, or it fails. Closes the one substantial mode that described an
  interactive lesson but shipped no output gate, so lessons could drift into reading-only static
  articles. Full reasoning in `changelog-2026-06-24.md`.
- Worked-scenario principle in `reference/teach.md`: the dependable "concrete" is one real case traced
  end-to-end with sourced values, not an analogy; if the user rejects a metaphor, replace it with a
  traced real case. The process gate now anchors the trace in one real input through to its final output,
  and the contract test pins the new wording.
- `.cite` citation style in the lesson scaffold (`lesson.css` + `assets/lesson-template.html`): a
  footnote-style inline source pointer (file:line, doc name) so lesson authors cite code/domain claims
  instead of hand-rolling a style.
- LEARN depth: the concept-explanation approach was deepened so onboarding lessons explain the why behind
  a concept, not just map the what.

## Verification

- `bash tests/run-all.sh` -> "all checks passed" (every shell contract, `node --check` on all templates
  including the new TEACH gate, and the 68-test url-shortener example).
- `main` was already in sync with `origin/main`, so the four feature commits were pushed before the tag;
  `v0.3.6` is an annotated tag carrying these release notes.
