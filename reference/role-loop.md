# ROLE-LOOP - the default loop for GREENFIELD / DEBUG / LEGACY

The disciplined form of the default loop: build, then improve via author-INDEPENDENT roles. The one
move that beat a strong baseline at fixed effort is a critic that did not write the code turning the
prose spec into FAILING tests, then a fixer that clears them.

Use for any non-trivial feature/bug/refactor. Skip for a trivial single edit - edit directly. A naive
"review & improve" loop only pads; an independent critic supplies the signal a re-reading author misses.

## Run setup - before any file mutation

For any non-trivial GREENFIELD / DEBUG / LEGACY run that edits code, first resolve the source/base branch
and target/integration branch. Prefer repo policy or user-provided refs; if either ref is ambiguous, ask
before editing. Then verify both refs exist in the target repo and create a branch-scoped run worktree,
for example:

```bash
git worktree add -b <run_branch> <worktree_path> <source/base branch>
```

Run Build, Critic, Fixer, Verify, tests, and run-vault writes inside that worktree; never edit the
original checkout. Treat dirty files in the original checkout as user work. After green verification and
user acceptance, commit or merge only into the verified target/integration branch.

Before any file mutation, create the run vault's `delivery-proof.md` from
`templates/delivery-proof.md` and start the Before/After Eval (`reference/delivery-gate.md`):

- record eval intent: user goal, constraints, tradeoffs, and rejected approaches;
- record the before state: absent feature/red acceptance check for GREENFIELD, reproduced symptom for
  DEBUG, preserve-baseline capture for LEGACY/brownfield;
- record the after target and command manifest from repo-owned or evaluator-owned proof commands.

## Roles (each role = a fresh-context subagent by default)

Dispatch is the default, not an option: the conductor runs each role as a separate fresh-context subagent,
so the role's heavy references (this file, `reference/domain-context.md`, `reference/taste-skill-v2.md`,
and the like) load inside the subagent and never accumulate in the conductor's window. The subagent
returns only a short structured result - status, what changed, test output, concerns - not its transcript.
Run independent units in parallel (QA scenario shards, review dimensions, multi-file builds); keep
dependent roles ordered. A trivial single edit skips the loop and edits inline.

1. **Build** - before the first edit, confirm any blast-radius reaching past the change's explicit
   target has cleared its interview confirm (`reference/interview.md`: approved, AFK-proceeded, or
   safely skipped and logged). Then: smallest correct change; match surrounding style; minimal diff.
   Bug: reproduce with a failing test first. Refactor/integrate an existing API: capture its
   exact-behavior baseline FIRST (`reference/qa.md` "API behavior baseline"). Capture the run-setup before
   proof in `delivery-proof.md` before the first edit.

2. **Critic** (`agents/code-reviewer.md`) - DO NOT edit src or weaken/delete existing tests.
   - Re-read the prose spec and repo/data rules. Enumerate REQUIRED behaviors the existing tests do not
     exercise - especially edges (boundary inputs, error/recovery paths, scoping/precedence, prefix/
     filter behavior, incremental update, concurrency, protocol/state).
   - Write a NEW FAILING test for each, in a separate file, derived strictly from the spec. Prefer
     black-box behavior tests and properties (roundtrip, idempotency, invariants).
   - Record each surfaced requirement in the run vault's `surfaced-requirements.md`
     (`docs/changelog/<YYYY-MM>/<DD-topic>/surfaced-requirements.md`; create if absent; format in
     `templates/surfaced-requirements.md`): a dated heading, one bullet per requirement - what the spec
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
   - Browser UI changes require `reference/qa.md` browser evidence: `Tool: playwright-cli`,
     fixed-route as-is/to-be captures, and a passing `bash templates/qa-gate.sh <vault> browser`.
     Lint, typecheck, unit tests, build, and a visual guess are not browser QA.
   - API refactor: re-capture the same call and diff against the pre-refactor baseline; unintended
     drift is a red to resolve.
   - Update the run vault's `surfaced-requirements.md`: mark each surfaced requirement fixed, or note why it stays open.
   - Update `delivery-proof.md`: after evidence, command outputs/artifact paths, decision gates
     (`auto-fix`, `no-op`, `ask-user`), intentional drift, and residual risk. Unresolved `ask-user`
     findings or missing trusted commands block a final done claim.

Loop critic->fixer only while a fresh red appears. The verifier pass is a regression guard - drop it only
for *very easy* issues; past that, re-running the project's REAL tests is REQUIRED, plus DB evidence for
data-backed bugs (`reference/db-access.md`) - DB proves data state but does not replace the red-green test.

Board (optional): if the Supergoal Board is enabled (`reference/observability.md`), the conductor may
call `sg-emit --phase <P>` at each transition (Frame/Build/Critic/Fixer/Verify/Done). Opt-in and
best-effort - it observes only, never blocks or gates the loop.

## Guardrails (keep it baseline-first, not Goodhart)

- The critic's generated tests are a SIGNAL to surface hidden requirements - NOT the acceptance oracle.
  Final verification is always the project's REAL tests + prose spec. Never weaken/delete a real test,
  never declare done because self-written tests pass while real tests/spec do not.
- Derive every generated test from the prose spec, not from a guessed rubric; a wrong generated test the
  fixer optimizes to is the failure mode - keep them black-box and spec-anchored.
- Cost: the loop costs more than one build - use it when correctness on behavior the visible tests miss
  matters; for a quick pass, one build is cheaper.
- Stop condition: cap the critic->fixer loop at 3 cycles; if a 4th would start, escalate to the user
  with the open reds instead of grinding. Doubt-theater anti-signal: 2+ cycles that produce findings but
  change no code means the critic is validating, not doubting - stop and recut the critic's spec focus.
