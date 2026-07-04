# ROLE-LOOP - the default loop for GREENFIELD / DEBUG / LEGACY

The default loop's mandatory core is Build -> Improve full spec -> Improve edge cases -> Final Verify.
Critic/Fixer is not part of the default loop.
That equal-compute shape is the active ingredient that lifts correctness on false-GREEN-prone work: after
the initial build, a fresh-context improver re-reads the WHOLE prose spec and fixes full-spec gaps, a
separate fresh-context edge pass attacks degenerate values (null/undefined/empty/boundary), error/recovery
paths, state/protocol, concurrency, compatibility, and security side effects, then a fresh-context
verifier/QA role tries to disprove the result with real evidence.

Use for any non-trivial feature/bug/refactor. Skip for a trivial single edit - edit directly. Layer an
independent critic (a reviewer that did NOT write the code, classifying inferred requirements before any
new failing tests, then a fixer that clears accepted REDs) as an OPT-IN escalation for genuinely
under-specified / latent-correctness work, where surfacing requirements absent from the prompt is the
lever. The critic classifies inferred behavior before testing it: required `must` behavior can become a
RED; ambiguous or product-changing semantics become `ask-user` gates. Production/domain behavior-changing
ambiguity needs user feedback. Generic coding-task ambiguity with no user available uses the most
conservative, reversible default and records the choice. Measured caveat: on explicit-spec tasks critic
role separation did NOT beat equal-compute improve passes, so it is an escalation for the
under-specified frontier, not an always-on default.

Use it when the task is under-specified, latent-correctness-heavy, security/edge/domain-rule-sensitive, or
Final Verify exposes a requirement gap the improve passes did not explain. Do not use it when the spec is
explicit, the expected behavior is already stated, the harness is single-process/context-limited, or the
eval compares equal-compute vanilla unless critic/fixer is the tested lever.

## Run setup - before any file mutation

For any non-trivial GREENFIELD / DEBUG / LEGACY run that edits code, first resolve the source/base branch
and target/integration branch. Prefer repo policy or user-provided refs; if either ref is ambiguous, ask
before editing. Then verify both refs exist in the target repo and create a branch-scoped run worktree,
for example:

```bash
git worktree add -b <run_branch> <worktree_path> <source/base branch>
```

Run Build, Improve, optional gated Critic/Fixer, Final Verify/QA, tests, and run-vault writes inside that
worktree; never edit the original checkout. Treat dirty files in the original checkout as user work.
After green verification and user acceptance, commit or merge only into the verified target/integration
branch - and only once the commit gate passes (`reference/delivery-gate.md`;
`bash templates/commit-gate.sh <vault> <browser|cli|none>` exits 0). A non-green run blocks the commit:
resolve it in the loop first, escalate to the user only when stuck (see stop condition below).

Before any file mutation, create the run vault's `delivery-proof.md` from
`templates/delivery-proof.md`, create `run-state.json` from `templates/run-state.json`, and start the
Before/After Eval (`reference/delivery-gate.md`):

- record eval intent: user goal, constraints, tradeoffs, and rejected approaches;
- seed `## Requirement Trace` with numbered requirements in the user's words;
- record the completion promise: promised outcome, required proof, stop condition, and `max_iterations`
  (default 8);
- record the before state: absent feature/red acceptance check for GREENFIELD, reproduced symptom for
  DEBUG, preserve-baseline capture for LEGACY/brownfield, plus neighbor characterization baseline for any
  shared code/state change past *very easy*;
- DEBUG first tries exact live reproduction. If exact reproduction is unavailable, preserve the
  failure-triggering properties in synthetic/similar data and fill `## Reproduction Fidelity` with
  fidelity level, data source, prod-vs-test deltas, residual risk, and post-deploy confirmation plan;
- record the after target and command manifest from repo-owned or evaluator-owned proof commands.
- keep `run-state.json` current after each phase with current phase, iteration, unresolved gates,
  blockers, next action, regression_ledger, and last proof command so an interrupted run resumes instead
  of restarts.

## Completion promise + loop cap

Frame writes the completion promise before Build. Build -> Improve -> Final Verify loops only while the
promise is not yet proven and a fresh, actionable gap remains. Default `max_iterations` is 8 for the
Build/Verify loop; the opt-in critic->fixer escalation keeps its 3-cycle cap below. When the next pass
would exceed the cap, stop and write a forced reflection in `run-state.json`: what keeps failing, the
likely root cause, which requirement is still unproven, whether a previously green check regressed, and
the smallest next action. Each iteration re-runs `regression_ledger`; if a previously green check turns
red, stop, fix that regression, and record `forced_reflection.regressed_previously_green`. Then ask only
if the blocker is requirement-level or needs user consent; otherwise recut the plan and continue only
after the reflection identifies new evidence.

## Roles (each role = a fresh-context subagent by default)

Dispatch is the default, not an option: the conductor runs each role as a separate fresh-context subagent,
so the role's heavy references (this file, `reference/domain-context.md`, `reference/taste-skill-v2.md`,
and the like) load inside the subagent and never accumulate in the conductor's window. The subagent
returns only a short structured result - status, what changed, test output, concerns - not its transcript.
Run independent units in parallel (QA scenario shards, review dimensions, multi-file builds); keep
dependent roles ordered. A trivial single edit skips the loop and edits inline. Build (1), Improve full
spec (2), Improve edge cases (3), and Final Verify (4) are the mandatory core. Critic/Fixer is optional
gated escalation for under-specified / latent-correctness work, usually inserted after the edge pass or
when Final Verify finds a requirement gap the improve passes did not explain.

0. **Adversarial plan attack (conditional, no src edits)** - only for under-specified, wide-blast-radius,
   security/data/concurrency, or latent-correctness work. Before Build, dispatch independent critics for
   security, scope, correctness, performance, and operability. Each critic tries to break the plan from
   one angle. Accept only findings grounded in the prose spec, current code/data, or known platform
   rules; convert accepted required risks into failing tests, decision gates, or explicit residual risk.
   Skip this on explicit-spec or tiny work because equal-compute improve passes are the cheaper default.

1. **Build** - before the first edit, confirm any blast-radius reaching past the change's explicit
   target has cleared its interview confirm (`reference/interview.md`: approved, AFK-proceeded, or
   safely skipped and logged). Then: smallest correct change; match surrounding style; minimal diff.
   Bug: reproduce with a failing test first. For any shared code/state change past *very easy*, capture a
   neighbor characterization baseline FIRST (`reference/qa.md` "Characterization baseline"). Refactor/
   integrate an existing API: capture its exact-behavior baseline FIRST with the API behavior baseline.
   Capture the run-setup before proof in `delivery-proof.md` and `run-state.json` before the first edit.

2. **Improve full spec** (`agents/executor.md`; fresh-context improver)
   - Re-read the FULL prose spec, current code, existing tests, `## Requirement Trace`, and repo/data
     rules. Confirm every stated-or-implied behavior is implemented; fix the smallest full-spec gap even
     when visible tests are green.
   - If production/source-code domain ambiguity would change user-visible behavior, data semantics,
     permissions, migrations, or API compatibility, stop and record an `ask-user` decision gate. Do not
     guess business meaning.
   - If the task is a generic coding utility or eval fixture with no user available, choose the most
     conservative, reversible default, record the choice in `delivery-proof.md`, and prefer preserving
     existing values/no-op behavior over surprising throws unless the spec or safety requires strictness.
   - Add or adjust tests only for grounded `must` behavior. Do not turn silence into stricter semantics.

3. **Improve edge cases** (`agents/executor.md`; fresh-context improver)
   - Attack degenerate inputs (null/undefined/empty/boundary), missing/extra fields, duplicate input,
     ordering, idempotency, error/recovery paths, state/protocol transitions, concurrency, compatibility,
     security side effects, and resource cleanup.
   - For each gap, apply the same threshold: production/domain behavior-changing ambiguity needs user
     feedback; generic no-user coding ambiguity gets a conservative, reversible default and a recorded
     rationale.
   - Re-run the targeted tests after every fix. Keep the diff minimal; no padding, rewrites, or unrelated
     cleanup.

4. **Final Verify/QA vs ground truth (mandatory core)** (`agents/qa-auditor.md` / `security-reviewer.md`)
   - Fresh-context adversarial verify: re-read the FULL prose spec and try to disprove the change against
     stated requirements, implied `must` behavior, edge cases, and execution evidence. Re-run the
     project's REAL tests and report command output. If a fresh gap appears, route back to Improve full
     spec or Improve edge cases instead of self-approving.
   - Code-change scenarios use `reference/qa.md` "Scenario stencil (code changes)", including regression
     scenarios and metamorphic relations when no exact oracle exists.
   - Browser UI changes require `reference/qa.md` browser evidence: `Tool: playwright-cli`,
     fixed-route as-is/to-be captures, and a passing `bash templates/qa-gate.sh <vault> browser`.
     Lint, typecheck, unit tests, build, and a visual guess are not browser QA.
   - Re-run every captured neighbor characterization baseline; unnamed drift is red. API refactor:
     re-capture the same call and diff against the pre-refactor baseline; unintended drift is a red to
     resolve.
   - Close `## Requirement Trace`: every forward row is `met` with a verifying check, and
     `Backward-trace: clean` proves no diff hunk is orphan scope.
   - The mandatory core Final Verify for neighbor baselines and Requirement Trace closure is
     fresh-context: the code writer's self-review is not a regression gate. Open requirements, unresolved
     REVISE items, and stub/placeholder implementations block done; do not drop them to make the run
     green.
   - Update the run vault's `surfaced-requirements.md`: mark each surfaced requirement fixed, or note why
     it stays open.
   - Update `delivery-proof.md`: after evidence, command outputs/artifact paths, decision gates
     (`auto-fix`, `no-op`, `ask-user`), intentional drift, and residual risk. Unresolved `ask-user`
     findings or missing trusted commands block a final done claim and the commit
     (`reference/delivery-gate.md` Commit gate).
   - Update `run-state.json`: phase, iteration, gate status, last proof command, blockers, next action,
     and completion-promise status.

5. **Critic** (`agents/code-reviewer.md`; OPT-IN escalation for under-specified / latent-correctness work) - DO NOT edit src or weaken/delete existing tests.
   - Re-read the prose spec and repo/data rules. Enumerate REQUIRED behaviors the existing tests do not
     exercise - especially edges (boundary inputs, error/recovery paths, scoping/precedence, prefix/
     filter behavior, incremental update, concurrency, protocol/state).
   - Requirement threshold: classify each candidate as `must`, `should`, or `ask-user`. Only `must`
     requirements grounded in the prose spec, current/API behavior, repo/data rules, or platform safety
     get failing tests. Do not turn silence into stricter semantics (for example throwing on degenerate
     inputs) when multiple reasonable behaviors exist; record that as an `ask-user` decision gate or
     residual risk.
   - For each `must`, write a NEW FAILING test in a separate file, derived strictly from the spec.
     Prefer black-box behavior tests and properties (roundtrip, idempotency, invariants).
   - Record each surfaced requirement in the run vault's `surfaced-requirements.md`
     (`docs/changelog/<YYYY-MM>/<DD-topic>/surfaced-requirements.md`; create if absent; format in
     `templates/surfaced-requirements.md`): a dated heading, one bullet per `must` requirement - what the
     spec implies, why it is required though the prompt never stated it, and the failing test that now
     covers it (status: open). This is the durable, human-readable trail of what the prompt left implicit.
   - Leave the failing tests red.

6. **Fixer** (`agents/executor.md`) - DO NOT edit test files.
   - Read NOTES + run the suite. Make the failing tests pass with the SMALLEST change.
   - If a critic-authored test appears to encode an `ask-user` choice, contradict current/API behavior, or
     harden semantics not required by the spec or safety, stop and report the decision gate instead of
     optimizing source to it.
   - No padding: add no code that is not required by a failing test or a listed defect. Do not break
     passing tests.

The improve-pass core is mandatory - drop it only for *very easy* issues; past that, the whole-spec
improve pass, edge-case improve pass, and re-running the project's REAL tests are REQUIRED, plus DB
evidence for data-backed bugs (`reference/db-access.md`) - DB proves data state but does not replace the
red-green test. Loop the opt-in critic->fixer escalation only while a fresh red appears.

Board (optional): if the Supergoal Board is enabled (`reference/observability.md`), the conductor may
call `sg-emit --phase <P>` at each transition
(Frame/Build/ImproveFullSpec/ImproveEdgeCases/Critic/Fixer/Verify/Done). Opt-in and best-effort - it
observes only, never blocks or gates the loop.

## Guardrails (keep it baseline-first, not Goodhart)

- The critic's generated tests are a SIGNAL to surface hidden requirements - NOT the acceptance oracle.
  Final verification is always the project's REAL tests + prose spec. Never weaken/delete a real test,
  never declare done because self-written tests pass while real tests/spec do not.
- Ambiguous edges are not REDs. If a production/domain behavior change has multiple reasonable
  interpretations, classify it as `ask-user` or residual risk; do not invent stricter semantics just
  because the prompt is silent. If a generic coding task has no user available, choose a conservative,
  reversible default and record it.
- Characterization baseline is a regression signal, not a correctness oracle. A known-bug snapshot changes
  only when the bug fix is intentional and named.
- Self-review is not a regression gate: generated explanations can approve behavior drift. Require
  execution evidence, fresh-context verification, and no stub done claims.
- Derive every generated test from the prose spec, not from a guessed rubric; a wrong generated test the
  fixer optimizes to is the failure mode - keep them black-box and spec-anchored.
- Cost: the loop costs more than one build - use it when correctness on behavior the visible tests miss
  matters; for a quick pass, one build is cheaper.
- Stop condition: cap the Build->Verify loop at `max_iterations` (default 8) with forced reflection, and
  cap the critic->fixer loop at 3 cycles; if a 4th critic cycle would start, escalate to the user with
  the open reds instead of grinding. Doubt-theater anti-signal: 2+ cycles that produce findings but
  change no code means the critic is validating, not doubting - stop and recut the critic's spec focus.
