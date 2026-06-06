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
- blind or label-swapped grading
- cost, time, and tool count recorded

## Pipeline

`Scope -> Cases -> Baseline Run -> Harness Run -> Machine Checks -> Blind Grade -> Compare -> Report -> Persist`

## Cases

Use `templates/harness-eval-case.yaml`.

Start with 3 cases:

- simple case where harness overhead may lose
- medium case where structure should help
- hard case where domain references and role split should matter

Move to 8-15 cases only after the 3-case pilot exposes useful signal.

## Execution

1. Scope
   - Name runtime_adapter: codex, claude-code, pi-agent, mcp, or mixed.
   - Freeze repo snapshot and task text.

2. Baseline Run
   - Run a normal agent with no generated harness, no harness references, and no specialized role pack.

3. Harness Run
   - Run the same agent/tool family with only the approved harness added.

4. Machine Checks
   - Run project-relevant checks: tests, lint, typecheck, build, smoke, browser QA, or data checks.
   - Record each check as `{name, status, evidence}` in both result objects.
   - `claim_status: proven` requires all baseline and harness checks to pass.

5. Blind Grade
   - Hide labels or swap labels before subjective scoring.
   - Grade against the case rubric, not against harness marketing claims.

6. Compare
   - Record winner, delta, cost/time tradeoff, failure notes, and grader uncertainty.

7. Report
   - Use `templates/harness-eval-report.md`.
   - Claim improvement only when machine checks and blind grading both support it.
   - Otherwise say `Not proven`.

8. Persist
   - Save reusable cases under the vault or `.domain-agent/qa/` when they are repo-specific.

## Reject

- Self-reported agent success as evidence.
- Different task wording between runs.
- Grading after seeing labels.
- Claiming a general percentage from one repo pilot.
- Hiding cost or runtime overhead.
