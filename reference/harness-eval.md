# HARNESS-EVAL - test whether a harness helps

Use when the user asks to test harness effectiveness, compare with/without harness, benchmark an agent workflow, or prove a generated harness improves outcomes.

## Contract

HARNESS-EVAL compares the same task with and without the harness. It measures evidence, not confidence. If the evidence is weak, report `Not proven`.

Required controls:

- same repo snapshot
- isolated worktrees or equivalent clean sandboxes
- identical task statement
- baseline gets no harness references
- harness run gets only the approved harness, with eval-internal files stripped from the copied
  reference (case definitions, hidden checks, rubric, scorer). The harness arm must never be able to
  read the cases or hidden tests it is being judged on.
- adversarial verification runs in the harness's native runtime profile (see Runtime fit); never
  force a multi-agent verifier/repair loop inside a single non-interactive process
- machine checks before subjective scoring, recorded per individual check (not one all-or-nothing pass)
- a reachable RevFactory-style 100-point quality score before final comparison: a fully correct
  solution must be able to reach >=80, and each dimension stays individually reachable to 10
- blind or label-swapped grading
- cost, time, tool count, and turn-completion recorded; a crash or context-window/timeout failure is a
  recorded LOSS for that arm, never a silent zero

Required outcome accounting:

- bug-catch matrix: planted bugs, hidden checks, and discovered real bugs by arm
- false-GREEN count: self-reported ship/green while machine or ground-truth checks still fail
- Visible tests only is false-GREEN when acceptance criteria imply protocol, state, security, scope, parser, concurrency, or error-recovery edges.
- regression protection: permanent tests added for fixed REDs, or explicit exception
- quality score: feature completeness, test coverage, code quality, error handling, efficiency, correctness, architecture, extensibility, documentation, and dev environment
- overclaim guard: audit trail alone is not a win unless it changes shipped correctness or quality

## Runtime fit (match the eval to how the harness actually runs)

The harness's value is fanning work to fresh isolated contexts. Evaluate it in the profile it will
actually run in, or the result is an artifact of the wrong setup:

- **Orchestrated runtime** (real subagent dispatch + interactive human): run the full pipeline below,
  including the separate adversarial verifier and repair loop.
- **Single non-interactive process** (e.g. `codex exec`, CI, one-shot eval): the harness should route
  to its INLINE profile. Do NOT force the multi-agent verifier/committee/repair ceremony into one
  context window - it exhausts the window and the arm crashes (observed: harness arm completed 0 turns,
  exit 1, tokens recorded 0, 2.15x baseline wall-clock). Score the harness on its INLINE behavior:
  load-only-the-contract, minimal targeted diffs, one scoped sandbox-safe verify pass, stop on green.
- A crashed / context-exhausted / timed-out arm is a recorded LOSS, not a missing data point. Capture
  `turns_completed`, `exit_code`, and a `crashed` flag; ensure token/tool-call parsing matches the
  adapter's actual event names (codex-exec emits `command_execution`, not `function_call`).

## Pipeline

`Scope -> Cases -> Baseline Run -> Harness Run -> Machine Checks -> Quality Score -> Blind Grade -> Compare -> Report -> Persist`

## Cases

Use `templates/harness-eval-case.yaml` for a blank case. The RevFactory seed files in
`templates/harness-eval-cases/` are SPECS ONLY (task, acceptance, hidden-check descriptions, rubric) -
they are NOT runnable. Before a case can be evaluated it needs an authored fixture: a stub source the
agent edits, visible tests, and hidden tests that encode the bug-catch matrix. As of this writing only
case-015-lsp ships a runnable fixture; the rest must have fixtures authored (see
`docs/experiments/2026-06-06-harness-eval-spark-high-lsp-v2/run.mjs` for the fixture+scorer shape).

Reusable seeded case specs (the approved corpus - pick from here, never invent new cases):

- `revfactory-case-001-rest-api.yaml`
- `revfactory-case-002-bug-fix.yaml`
- `revfactory-case-003-refactoring.yaml`
- `revfactory-case-004-documentation.yaml`
- `revfactory-case-005-complex.yaml`
- `revfactory-case-006-research.yaml`
- `revfactory-case-007-interpreter.yaml`
- `revfactory-case-008-microservice.yaml`
- `revfactory-case-009-sql-engine.yaml`
- `revfactory-case-010-crdt.yaml`
- `revfactory-case-011-raft-kv.yaml`
- `revfactory-case-012-spreadsheet.yaml`
- `revfactory-case-013-bytecode-vm.yaml`
- `revfactory-case-014-event-sourcing.yaml`
- `revfactory-case-015-lsp.yaml`

Use the validated RevFactory case corpus ONLY - draw every eval case from
`templates/harness-eval-cases/` (RevFactory specs); never invent ad-hoc cases. Ad-hoc easy/medium tasks,
and underspecified tasks whose implicit requirements are PUBLIC domain knowledge, ceiling out: a strong
baseline passes everything so the case proves nothing (evidence: 2026-06-07 csv/lru/semver, 14/14 both
arms, `docs/experiments/2026-06-07-harness-eval-underspecified/`).

Use the hard/expert tier only - the cases that discriminate:

- expert (use first): `revfactory-case-007-interpreter` .. `-015-lsp` (007 interpreter, 008 microservice,
  009 sql-engine, 010 crdt, 011 raft-kv, 012 spreadsheet, 013 bytecode-vm, 014 event-sourcing, 015 lsp)
- hard: `revfactory-case-002-bug-fix`, `revfactory-case-005-complex`

Only `case-015-lsp` ships a runnable fixture; author the rest from the same fixture+scorer shape before
use. Pilot on one expert case (n=1 is `Not proven` by construction - direction only), then scale to 8-15
expert/hard cases for a proven claim. Both arms passing everything is inconclusive (ceiling), not a win
or a tie.

## Execution

1. Scope
- Name `runtime_adapter`: codex, claude-code, pi-agent, mcp, or mixed.
- Freeze repo snapshot and task wording.

2. Baseline Run
- Run a normal agent with no generated harness, no harness references, and no specialized role pack.

3. Harness Run
- Run the same agent/tool family with only the approved harness added, eval-internal files stripped
  from the copied reference (see Contract).
- Match the harness to its Runtime fit. In an orchestrated runtime the harness arm runs a separate
  adversarial verifier that reads acceptance criteria and implementation after Build, writing
  verifier-authored tests before the final claim (provided visible tests do not count). In a single
  non-interactive process the harness runs its INLINE profile - one scoped sandbox-safe verify pass,
  not a multi-agent verifier loop that would exhaust the context window.
- The builder repairs every verifier RED or records `Not proven`; do not advance on a visible-test-only GREEN.

4. Verification (record-only - the eval does NOT impose a verifier/repair loop)
- Baseline-first: do not drive an adversarial-verifier + repair loop onto the harness arm. Eight evals
  showed that ceremony costs 2-3x without beating a strong baseline on explicit-spec tasks, and crashes
  when forced into a single non-interactive process.
- Record whatever verification the harness ran NATIVELY: an orchestrated harness may run its own verifier
  (record verifier-authored tests + REDs); an INLINE harness records its one scoped verify pass.
- Ground truth for BOTH arms is the eval's Machine Checks + hidden tests (next), applied equally. Do not
  advance a visible-test-only GREEN; if hidden checks fail, record `Not proven` with the failing checks.
- Record REDs caught, remaining REDs, and false-GREEN in the bug-catch matrix.

5. Machine Checks
- Run project-relevant checks: tests, lint, typecheck, build, smoke, browser QA, hidden tests, or data checks.
- Record EACH test/check individually as `{name, status, evidence}` - never collapse the suite into one
  all-or-nothing pass. A binary pass/fail hides partial progress (observed: baseline passed 6/9 and
  harness 4/9, yet a single combined check scored both as the same "fail").
- Track the pass FRACTION per arm; it feeds the gradient correctness score below.
- `claim_status: proven` requires all baseline and harness checks to pass.

6. Quality Score
- Score each arm with a RevFactory-style 100-point quality rubric.
- Use 10 dimensions, each 0-10: `feature_completeness`, `test_coverage`, `code_quality`, `error_handling`, `efficiency`, `correctness`, `architecture`, `extensibility`, `documentation`, `dev_environment`.
- Keep the rubric REACHABLE: a fully correct solution must be able to reach >=80, and every dimension
  must stay individually reachable to 10. Do not write anchors that cap dimensions so low that even a
  perfect solution sums below the pass threshold (a capped rubric summing to 77 made >=80 impossible
  and flattened the arms to a near-tie).
- Score `correctness` and `feature_completeness` as a GRADIENT over the fraction of individual
  (visible + hidden) checks passed, not a binary all-pass-or-cap. Anchor the remaining dimensions to
  observable properties (tests present, module structure for multi-module tasks, dependency count,
  debug/TODO markers, docs) without capping them below 10.
- Add minimal-diff awareness: reward small targeted diffs; do not let a larger, more-rewritten solution
  score the same as a lean one of equal correctness.
- Record score rationale per dimension in `quality.baseline` and `quality.harness`.

7. Blind Grade
- Hide labels or swap labels before subjective scoring.
- Grade against the case rubric, not against harness marketing claims.

8. Compare
- Record pass winner, quality winner, bug-catch delta, false-GREEN delta, regression-test delta, cost/time tradeoff, failure notes, and grader uncertainty.
- `claim_status: proven` requires both machine-check support and a harness quality-score win.

9. Report
- Use `templates/harness-eval-report.md`.
- Claim improvement only when machine checks, quality scoring, and blind grading support it.
- Otherwise say `Not proven`.

10. Persist
- Save run-specific cases under the vault or `.domain-agent/qa/`.
- Save broadly reusable case templates under `templates/harness-eval-cases/`.
- Promote a case into the skill only when it is clean-slate, runtime-portable,
  machine-checkable, and includes hidden checks, regression protection, cost
  fields, and the RevFactory-style quality-score rubric.

## Reject

- Self-reported agent success as evidence.
- Different task wording between runs.
- Grading after seeing labels.
- Claiming a general percentage from one repo pilot.
- Hiding cost or runtime overhead.
- Treating a quality score win as sufficient when pass/fail checks regress.
- Counting an all-pass ceiling-effect case (both arms pass everything) as a win or a meaningful tie.
- A capped scorer whose maximum sum is below the pass threshold, or that cannot distinguish a 6/9 from a 4/9 solution.
- Exposing eval cases, hidden checks, or the rubric to the harness arm via the copied reference.
- Scoring a crashed / context-exhausted / timed-out arm as a silent zero instead of a recorded loss.
- Forcing a multi-agent verifier/repair loop into a single non-interactive process and blaming the harness for the resulting context-window crash.
- Inventing ad-hoc eval cases instead of drawing from the RevFactory hard/expert corpus in `templates/harness-eval-cases/`.
