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

## README route map

- Decision: make the README easier for first-time readers by explaining `/supergoal` as a heavy-objective
  router plus verifier, then showing the route map as Mermaid before the mode table. Changing `SKILL.md`
  was rejected because this request was comprehension-only and the active routing contract already had
  the right behavior.
- Added a five-step mental model: route the objective, load the needed playbook, separate roles, verify
  against the real project, and stop at the verified result.
- Added a Mermaid diagram covering GREENFIELD, DEBUG, LEGACY, SPEC, QA-ONLY, REVIEW-ONLY, ARCH, TEACH,
  LEARN-DOMAIN, HARNESS-EVAL, and SKILL-MINE.
- Synced the same explanation and Mermaid route map into `README.ko.md`. Leaving the Korean README behind
  was rejected because first-time Korean readers need the same routing model as the English README.

## TEACH lesson output gate

- Decision: add an executable output gate, `templates/teach-lesson-gate.mjs`, that a TEACH lesson must
  pass before it counts as done. TEACH was the one substantial mode whose `reference/teach.md`
  described an interactive, scaffold-built, book-layout lesson but shipped no gate to enforce it - so
  real lessons drifted into reading-only static articles (inline `<style>`, one long `<article>`
  scroll, a promised "이해 점검" quiz that never rendered). This applies the same principle as the
  optimization pass above: harden the executable contract, do not rely on prose.
- The gate deterministically rejects a lesson that does not link the shared `assets/lesson.css` +
  `quiz.js` + `lesson-book.js`, has no `.book` page shell (`.pages-track` + `.pager` + >= 2
  `data-title` sections), or ships no hydrated `.sg-quiz` with a `data-correct` option.
- Wired it into `reference/teach.md` (Lessons "Gate before done" bullet, Flow step 5, Tutor contract
  item 16) and named it in the `SKILL.md` TEACH route row, matching how LEARN-DOMAIN names its gate.
- Rejected a prose-only tightening of `reference/teach.md`: it already said "Reading-only HTML is not a
  lesson" and lessons were still static, so stronger wording would not have changed the outcome.
- Rejected auto-regenerating the existing `teach/repo-domain/lessons/*.html`: lessons are git-ignored
  personal learning data tied to a mission/ZPD; the skill-level fix is enforcement, and regeneration is
  a separate, user-driven TEACH run.
- Rejected a shell gate like `qa-gate.sh`: lesson checks parse HTML, so a Node gate matches the
  `contrast-gate.mjs` / `learn-grounding-gate.mjs` precedent and is auto-syntax-checked by run-all.

## Verification (TEACH lesson gate)

- `bash tests/run-all.sh` -> "all checks passed" (every shell contract, `node --check` on all
  templates incl. the new gate, and the 68-test url-shortener example).
- `bash tests/gate-scenarios.test.sh` -> 40 passed, 0 failed, incl. new SCENARIO 12 (usage exit 2,
  scaffold template PASS, reading-only / off-scaffold / dir-scan FAIL).
- Red-green against the real artifacts: `node templates/teach-lesson-gate.mjs teach/repo-domain/lessons`
  fails both `0001` and `0002` (off-scaffold, no `.sg-quiz`); the scaffold `lesson-template.html` passes.
- Note: the interactive shell was unavailable in this environment, so commands were run with output
  redirected to files; `git diff --check` was not run here.

## Verification

- `bash tests/run-all.sh` passed.
- `git diff --check` passed.
