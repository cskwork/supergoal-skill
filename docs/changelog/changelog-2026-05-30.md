# 2026-05-30 - Human Feedback gate

## Decision

Add **Human Feedback** as a first-class stage before Build/Fix in all `/supergoal` modes.

## Reasoning

- The previous contract only made approval explicit for DEBUG/LEGACY, leaving GREENFIELD able to
  move from Plan to Build without a human checkpoint.
- The user asked for approval after intake, reproduction/diagnosis, and planning, before any
  implementation work.
- The six-file vault remains intact: the approval packet belongs in `plan.md` because it is the
  implementation contract humans approve.
- A deterministic gate is better than prose only, so `templates/human-feedback-gate.mjs` checks the
  approval packet and `state.json.approval` before Build/Fix opens.

## Contract

- `plan.md` must include `## Human Feedback`.
- The top section is `### Plain-language brief`: non-developer wording that explains the plan or bug
  cause.
- The lower section is `### Technical brief`: novice-developer-friendly details, test plan, files or
  modules, and risk.
- `### Terms` defines potentially difficult terms.
- `state.json.approval.phase` must match `Build` or `Fix`, and `state.json.approval.status` must be
  `APPROVED`.

## Update - concise trigger description

- Shortened `SKILL.md` frontmatter `description` so skill discovery stays trigger-focused and avoids
  repeating the full workflow architecture.

## Update - Codex comparison experiment

- Corrected the research scope to compare plain Codex CLI, `/supergoal`, and Codex Goal mode on the
  same URL-shortener `PATCH /api/links/:code` task.
- Used the same hidden evaluator after each run. Result: plain Codex CLI passed self-tests and hidden
  tests; `/supergoal` passed self-tests, delivery gate, and hidden tests; Goal mode passed self-tests
  but failed hidden tests by returning `invalid_update` instead of `invalid_ttl` for bad PATCH TTL.
- Reason: the useful comparison is effectiveness against a normal Codex CLI baseline and Goal mode,
  not `$codex-autoresearch`. The reusable harness path still has the older A/B name and should be
  generalized before future repeated runs.

## Update - harder private-codebase comparison task

- Re-ran the three-arm comparison on isolated tracked-file copies of a private production-scale
  codebase; the live checkout was not modified.
- Task shape: fix a cross-layer backend behavior involving query propagation, fallback handling,
  multiple entry points, and focused regression tests.
- Result: plain Codex CLI, `/supergoal`, and Goal mode all passed the same hidden scorer.
- Reason: this better measures difficult code-path discovery than the small URL-shortener task
  because the correct answer depends on separating relevant focused proof from baseline repo noise.
- Observation: `/supergoal` had the strongest review trail and caught an edge-case query-value issue,
  but cost substantially more tokens than plain Codex or Goal mode.

## Update - greater private-codebase benchmark

- Ran a harder three-arm benchmark on isolated tracked-file copies of a private production-scale Java
  service; the live checkout was not modified.
- Task shape: fix backend request-context behavior across SQL mapper ordering and service layers:
  deterministic latest-row selection plus preservation/fallback of request context in three service
  entry points.
- Hidden scorer result: `/supergoal` passed all checks; Goal mode fixed the main code path but failed
  the fallback/preservation test-coverage check; plain Codex CLI produced no diff or final output and
  was terminated as a hung run.
- Verification evidence: `/supergoal` passed focused regression tests, neighbor checks,
  `git diff --check`, and its delivery gate; Goal mode passed its focused tests and `git diff --check`.
  Both broad `./gradlew test` probes failed on existing fixture/config/context failures outside the
  changed surface.
- Token signal: `/supergoal` reported 378,468 tokens; Goal mode reported 165,336 CLI tokens and
  130,543 internal Goal tokens; plain Codex reported none because the idle process was killed.
- Reason: this task is a stronger measure because it requires cross-layer backend diagnosis, mapper
  SQL ordering, service-level context semantics, fallback tests, and distinguishing relevant focused
  checks from noisy full-suite failures.
