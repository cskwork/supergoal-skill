# DELIVERY-GATE - Before/After Eval for code projects

Use for GREENFIELD, DEBUG, and LEGACY runs that edit code. The gate makes the real-world change
auditable: what was true before, what must be true after, what commands prove it, and what still is not
proven.

## Contract

Before/After Eval is required for every non-trivial code-project change.

The run vault must contain `delivery-proof.md` from `templates/delivery-proof.md` before Build mutates
files. Keep it compact; it is a proof ledger, not a transcript.

Required fields:

- `eval_intent`: the user's goal in their words, plus constraints, tradeoffs, and rejected approaches.
- `before_state`: observed current behavior before the change.
- `after_target`: falsifiable expected behavior after the change.
- `command_manifest`: exact commands used for proof, with source:
  - `frozen_repo` - repo-owned command from AGENTS.md, package scripts, Makefile, CI, docs, or config.
  - `evaluator_owned` - command authored by the evaluator outside either arm's solution.
  - `agent_detected` - command found by the implementation agent; useful, but not enough alone.
- `decision_gates`: findings classified as `auto-fix`, `no-op`, or `ask-user`.
- `after_evidence`: command outputs, artifact paths, screenshots, DB reads, or API captures proving the
  after target.
- `residual_risk`: what the checks do not prove.

## Before State

- **GREENFIELD:** prove the starting point. Examples: feature absent, scaffold empty, acceptance test red,
  route returns 404, command missing, or UI screen unavailable. If the project is new, the before state can
  be "no implementation exists" plus the first failing acceptance check.
- **DEBUG:** reproduce the live symptom first. Record the failing command, request, screenshot, log line, or
  data state before fixing.
- **LEGACY / brownfield:** preserve the current behavior before changing it. Capture exact API calls,
  screenshots, CLI output, DB rows, or tests for surrounding behavior that must not drift.

If no meaningful before proof exists, say why and mark the run `Not proven` until another proof source is
available.

## After Eval

Run the repo's real verification commands, then compare against the before state:

- New behavior works.
- Required old behavior still works.
- Intended drift is named.
- Unintended drift is fixed or reported.
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
- after target evaluated,
- trusted commands run with outputs or artifacts,
- decision gates resolved,
- residual risk named,
- changelog updated with accepted and rejected alternatives.
