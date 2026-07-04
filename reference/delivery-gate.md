# DELIVERY-GATE - Before/After Eval for code projects

Use for GREENFIELD, DEBUG, and LEGACY code edits. It records before state, after target, proof commands,
and residual risk.

## Contract

Before/After Eval is required for every non-trivial code-project change. Before Build mutates files, the
run vault must contain `delivery-proof.md` from `templates/delivery-proof.md` and `run-state.json` from
`templates/run-state.json`. Keep both compact: proof/resume ledgers, not transcripts.

Required fields:

- `eval_intent`: user goal, constraints, tradeoffs, rejected approaches.
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
- `run_state`: phase, iteration, gates, blockers, next action, last proof command.

## Before State

- **GREENFIELD:** prove the start: feature absent, scaffold empty, acceptance test red, route 404, command
  missing, UI unavailable, or "no implementation exists" plus the first failing acceptance check.
- **DEBUG:** reproduce the live symptom first. Record the failing command/request/screenshot/log/data.
  If exact dev reproduction is unavailable, synthetic/similar data must preserve failure-triggering
  properties; fill `## Reproduction Fidelity`; done is conditional on residual risk plus post-deploy
  confirmation plan.
- **LEGACY / brownfield:** preserve current behavior before changing it. Capture exact API calls,
  screenshots, CLI output, DB rows, or tests for behavior that must not drift.
- **Shared code/state past very easy:** in any mode, capture neighbor characterization baseline snapshots
  before Build (`reference/qa.md`), not only refactors.

No meaningful before proof -> say why and mark `Not proven` until another proof source exists.

## After Eval

Run real verification commands, then compare against before state:

- New behavior works.
- Required old behavior still works: captured neighbor snapshots re-run with no unnamed drift.
- Intended drift is named.
- Unintended drift is fixed or reported.
- Requirement Trace rows are met, and Backward-trace is clean.
- Browser UI changes include browser evidence from `qa-gate.sh <vault> browser`.
- Data-backed behavior past very easy includes read-only DB evidence when available.

Done requires at least one trusted command (`frozen_repo` or `evaluator_owned`) in the command manifest.
Agent-detected commands can supplement proof, but cannot be the whole proof.

## Decision Gates

- `auto-fix`: mechanical and low-risk; fix and recheck.
- `no-op`: informational; record why no action is needed.
- `ask-user`: changes product behavior, scope, data, security posture, external publishing, or user intent.

Unresolved `ask-user` findings block a final done claim.

## Done

Done means `delivery-proof.md` shows: before state, completion promise fulfilled or blocked, after target
evaluated, trusted command outputs/artifacts, resolved decision gates, residual risk, bidirectional
requirement trace, DEBUG/prod reproduction fidelity, final `run-state.json`, changelog alternatives, and
commit gate passed (`## Commit gate`).

## Commit gate

Commit or merge into the target/integration branch only when proof is green and the user has accepted.
Block while any holds: REAL tests or prose spec not green; QA verdict FAIL or PARTIAL (incomplete); an
open requirement in `surfaced-requirements.md`; an unmet/open/blocked row in `## Requirement Trace`; a
missing or non-clean `Backward-trace` (scope-creep orphan); an unresolved `ask-user` decision gate;
non-exact reproduction fidelity without residual risk and post-deploy confirmation plan; or fulfillment
is uncertain.

Blocked is fix-first: the role-loop resolves it (fix the red, finish QA, close the requirement). Ask the
user about the requirement only when it is requirement-level (ambiguous or unmet), genuinely uncertain, or
the critic->fixer loop hit its cap (`reference/role-loop.md`); route via `reference/interview.md`. Never
commit on an assumption - resolve it or get explicit acceptance.

Backstop: `bash templates/commit-gate.sh <vault> <browser|cli|none>` must exit 0 before commit/merge.
Never edit the gate to pass.
