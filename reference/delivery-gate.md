# DELIVERY-GATE - Before/After Eval for code projects

Use for GREENFIELD, DEBUG, and LEGACY runs that edit code. The gate makes the real-world change
auditable: what was true before, what must be true after, what commands prove it, and what still is not
proven.

## Contract

Before/After Eval is required for every non-trivial code-project change.

The run vault must contain `delivery-proof.md` from `templates/delivery-proof.md` and `run-state.json`
from `templates/run-state.json` before Build mutates files. Keep them compact; they are proof and resume
ledgers, not transcripts.

Required fields:

- `eval_intent`: the user's goal in their words, plus constraints, tradeoffs, and rejected approaches.
- `completion_promise`: promised outcome, required proof, stop condition, and `max_iterations` (default 8).
- `requirement_trace`: numbered user requirements, implementing changes, verifying checks, status, and
  `Backward-trace: clean` when no diff hunk is orphan scope.
- `before_state`: observed current behavior before the change.
- `after_target`: falsifiable expected behavior after the change.
- `reproduction_fidelity`: for DEBUG/prod issues, exact/proxy data level, failure-triggering properties,
  prod-vs-test deltas, residual risk, and post-deploy confirmation plan.
- `command_manifest`: exact commands used for proof, with source:
  - `frozen_repo` - repo-owned command from AGENTS.md, package scripts, Makefile, CI, docs, or config.
  - `evaluator_owned` - command authored by the evaluator outside either arm's solution.
  - `agent_detected` - command found by the implementation agent; useful, but not enough alone.
- `decision_gates`: findings classified as `auto-fix`, `no-op`, or `ask-user`.
- `after_evidence`: command outputs, artifact paths, screenshots, DB reads, or API captures proving the
  after target.
- `residual_risk`: what the checks do not prove.
- `run_state`: current phase, iteration count, unresolved gates, blockers, next action, and last proof
  command, updated after each phase so a run can resume after interruption.

## Before State

- **GREENFIELD:** prove the starting point. Examples: feature absent, scaffold empty, acceptance test red,
  route returns 404, command missing, or UI screen unavailable. If the project is new, the before state can
  be "no implementation exists" plus the first failing acceptance check.
- **DEBUG:** reproduce the live symptom first. Record the failing command, request, screenshot, log line, or
  data state before fixing. If exact dev reproduction is unavailable, use synthetic/similar data only when
  it preserves the failure-triggering properties; fill `## Reproduction Fidelity`, and treat done as
  conditional on residual risk plus a post-deploy confirmation plan.
- **LEGACY / brownfield:** preserve the current behavior before changing it. Capture exact API calls,
  screenshots, CLI output, DB rows, or tests for surrounding behavior that must not drift.
- **Shared code/state past very easy:** in any mode, capture neighbor characterization baseline snapshots
  before Build (`reference/qa.md`), not only refactors.

If no meaningful before proof exists, say why and mark the run `Not proven` until another proof source is
available.

## After Eval

Run the repo's real verification commands, then compare against the before state:

- New behavior works.
- Required old behavior still works: captured neighbor snapshots re-run with no unnamed drift.
- Intended drift is named.
- Unintended drift is fixed or reported.
- Requirement Trace rows are met, and Backward-trace is clean.
- Browser UI changes include browser evidence from `qa-gate.sh <vault> browser`.
- Data-backed behavior past very easy includes read-only DB evidence when available.

A final claim of done requires at least one trusted command (`frozen_repo` or `evaluator_owned`) in the
command manifest. Agent-detected commands can supplement proof, but cannot be the whole proof.

## Decision Gates

Use the same action taxonomy as a delivery gate:

- `auto-fix`: mechanical and low-risk; fix and recheck.
- `no-op`: informational; record why no action is needed.
- `ask-user`: changes product behavior, scope, data, security posture, external publishing, or user intent.

Unresolved `ask-user` findings block a final done claim.

## Done

Done means `delivery-proof.md` shows:

- before state captured,
- completion promise recorded and either fulfilled or explicitly blocked,
- after target evaluated,
- trusted commands run with outputs or artifacts,
- decision gates resolved,
- residual risk named,
- requirement trace closed in both directions,
- reproduction fidelity recorded for DEBUG/prod issues,
- `run-state.json` updated with the final phase, completion-promise status, and no hidden blockers,
- changelog updated with accepted and rejected alternatives,
- commit gate passed (`## Commit gate`).

## Commit gate

Commit or merge into the target/integration branch only when the proof above is green and the user has
accepted. Block the commit while any holds: REAL tests or prose spec not green; QA verdict FAIL or PARTIAL
(incomplete); an open requirement in `surfaced-requirements.md`; an unmet/open/blocked row in
`## Requirement Trace`; a missing or non-clean `Backward-trace` (scope-creep orphan); an unresolved
`ask-user` decision gate; non-exact reproduction fidelity without residual risk and post-deploy
confirmation plan; or the requirement's fulfillment is uncertain.

Blocked is fix-first: the role-loop resolves it (fix the red, finish QA, close the requirement). Ask the
user about the requirement only when it is requirement-level (ambiguous or unmet), genuinely uncertain, or
the critic->fixer loop hit its cap (`reference/role-loop.md`); route via `reference/interview.md`. Never
commit on an assumption - resolve it or get explicit acceptance.

Backstop: `bash templates/commit-gate.sh <vault> <browser|cli|none>` must exit 0 before commit/merge.
Never edit the gate to pass.
