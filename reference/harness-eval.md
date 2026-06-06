# HARNESS-EVAL - test whether a harness helps

Use when the user asks to test harness effectiveness, compare with/without harness, benchmark an agent workflow, or prove a generated harness improves outcomes.

## Contract

HARNESS-EVAL compares the same task with and without the harness. It measures evidence, not confidence. If the evidence is weak, report `Not proven`.

Required controls:

- same repo snapshot
- isolated worktrees or equivalent clean sandboxes
- identical task statement
- baseline gets no harness references
- harness run gets only the approved harness
- machine checks before subjective scoring
- RevFactory-style 100-point quality score before final comparison
- blind or label-swapped grading
- cost, time, and tool count recorded

Required outcome accounting:

- bug-catch matrix: planted bugs, hidden checks, and discovered real bugs by arm
- false-GREEN count: self-reported ship/green while machine or ground-truth checks still fail
- regression protection: permanent tests added for fixed REDs, or explicit exception
- quality score: feature completeness, test coverage, code quality, error handling, efficiency, correctness, architecture, extensibility, documentation, and dev environment
- overclaim guard: audit trail alone is not a win unless it changes shipped correctness or quality

## Pipeline

`Scope -> Cases -> Baseline Run -> Harness Run -> Machine Checks -> Quality Score -> Blind Grade -> Compare -> Report -> Persist`

## Cases

Use `templates/harness-eval-case.yaml` for a blank case. Reusable seeded cases
come only from RevFactory's `claude-code-harness` experiment set:

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

Start with 3 cases:

- simple case where harness overhead may lose
- medium case
- hard case that needs architecture or references

Move to 8-15 cases only after the pilot exposes useful signal.

## Execution

1. Scope
- Name `runtime_adapter`: codex, claude-code, pi-agent, mcp, or mixed.
- Freeze repo snapshot and task wording.

2. Baseline Run
- Run a normal agent with no generated harness, no harness references, and no specialized role pack.

3. Harness Run
- Run the same agent/tool family with only the approved harness added.

4. Machine Checks
- Run project-relevant checks: tests, lint, typecheck, build, smoke, browser QA, hidden tests, or data checks.
- Record each check as `{name, status, evidence}` in both result objects.
- `claim_status: proven` requires all baseline and harness checks to pass.

5. Quality Score
- Score each arm with a RevFactory-style 100-point quality rubric.
- Use 10 dimensions, each 0-10: `feature_completeness`, `test_coverage`, `code_quality`, `error_handling`, `efficiency`, `correctness`, `architecture`, `extensibility`, `documentation`, `dev_environment`.
- Anchor scores to observable properties: no tests caps `test_coverage`, a single-file monolith caps `architecture` when the task requires multiple modules, missing major requested features caps `feature_completeness`, and failing machine/hidden checks cap `correctness`.
- Record score rationale per dimension in `quality.baseline` and `quality.harness`.

6. Blind Grade
- Hide labels or swap labels before subjective scoring.
- Grade against the case rubric, not against harness marketing claims.

7. Compare
- Record pass winner, quality winner, bug-catch delta, false-GREEN delta, regression-test delta, cost/time tradeoff, failure notes, and grader uncertainty.
- `claim_status: proven` requires both machine-check support and a harness quality-score win.

8. Report
- Use `templates/harness-eval-report.md`.
- Claim improvement only when machine checks, quality scoring, and blind grading support it.
- Otherwise say `Not proven`.

9. Persist
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
