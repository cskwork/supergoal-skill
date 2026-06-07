# ROLE-LOOP - the default loop for GREENFIELD / DEBUG / LEGACY

The disciplined form of the default loop: build, then improve via author-INDEPENDENT roles. The one
move that beat a strong baseline at fixed effort is a critic that did not write the code turning the
prose spec into FAILING tests, then a fixer that clears them.

Use for any non-trivial feature/bug/refactor. Skip for a trivial single edit - edit directly. A naive
"review & improve" loop only pads; an independent critic supplies the signal a re-reading author misses.

## Roles (fresh context each; separate agent orchestrated, or deliberate role switch inline)

1. **Build** - smallest correct change; match surrounding style; minimal diff. Bug: reproduce with a
   failing test first.

2. **Critic** (`agents/code-reviewer.md`) - DO NOT edit src or weaken/delete existing tests.
   - Re-read the prose spec and repo/data rules. Enumerate REQUIRED behaviors the existing tests do not
     exercise - especially edges (boundary inputs, error/recovery paths, scoping/precedence, prefix/
     filter behavior, incremental update, concurrency, protocol/state).
   - Write a NEW FAILING test for each, in a separate file, derived strictly from the spec. Prefer
     black-box behavior tests and properties (roundtrip, idempotency, invariants).
   - Record each surfaced requirement in `docs/surfaced-requirements.md` (create if absent; format in
     `templates/surfaced-requirements.md`): a dated section, one bullet per requirement - what the spec
     implies, why it is required though the prompt never stated it, and the failing test that now covers
     it (status: open). This is the durable, human-readable trail of what the prompt left implicit.
   - Leave the failing tests red.

3. **Fixer** (`agents/executor.md`) - DO NOT edit test files.
   - Read NOTES + run the suite. Make the failing tests pass with the SMALLEST change.
   - No padding: add no code that is not required by a failing test or a listed defect. Do not break
     passing tests.

4. **Verify vs ground truth** (`agents/qa-auditor.md` / `security-reviewer.md`)
   - Re-run the project's REAL tests; re-read the prose spec for uncovered rules. Fix residual failures/
     regressions minimally. Stop on green; report what was verified with command output.
   - Update `docs/surfaced-requirements.md`: mark each surfaced requirement fixed, or note why it stays open.

Loop critic->fixer only while a fresh red appears. The verifier pass is a regression guard - in the
eval it equalled the fixer (no extra gain), so make it conditional / drop it when the fixer is already
green to save ~25%.

## Guardrails (keep it baseline-first, not Goodhart)

- The critic's generated tests are a SIGNAL to surface hidden requirements - NOT the acceptance oracle.
  Final verification is always the project's REAL tests + prose spec. Never weaken/delete a real test,
  never declare done because self-written tests pass while real tests/spec do not.
- Derive every generated test from the prose spec, not from a guessed rubric; a wrong generated test the
  fixer optimizes to is the failure mode - keep them black-box and spec-anchored.
- Cost: the loop is several times a single run's effort. Use it when correctness on behavior the visible
  tests miss matters; for a quick pass, one build is cheaper.
