#!/usr/bin/env bash
# /supergoal DELIVERY-GATE contract.
# Fails if GREENFIELD / DEBUG / LEGACY can finish without a clear Before/After Eval proof.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing file: %s\n' "$file"
  fi
}

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"
    printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

echo "=================================================================="
echo " /supergoal DELIVERY-GATE contract   skill: $ROOT"
echo "=================================================================="

require_file "delivery gate reference exists" "reference/delivery-gate.md"
require_file "goal template exists" "templates/GOAL.md"
require_file "plan template exists" "templates/PLAN.md"
require_file "qa template exists" "templates/QA.md"
require_file "r-loop template exists" "templates/R-LOOP.md"
require_file "z-done template exists" "templates/Z-DONE.md"
require_file "run state template exists" "templates/run-state.json"

# SKILL.md is the router/gate; the detailed delivery contract lives in reference files.
require_text "SKILL keeps delivery done hook" "SKILL.md" "Before/After Eval complete"
require_text "SKILL points at delivery gate" "SKILL.md" "reference/delivery-gate.md"
require_text "SKILL points at goal template" "SKILL.md" "templates/GOAL.md"
require_text "SKILL points at plan template" "SKILL.md" "templates/PLAN.md"
require_text "SKILL points at qa template" "SKILL.md" "templates/QA.md"
require_text "SKILL points at run state template" "SKILL.md" "templates/run-state.json"
require_text "SKILL keeps clean trace done hook" "SKILL.md" "no orphan scope"

require_text "role loop starts proof before mutation" "reference/role-loop.md" "Before any file mutation"
require_text "role loop starts run state before mutation" "reference/role-loop.md" '`run-state.json` from `templates/run-state.json`'
require_text "role loop records completion promise" "reference/role-loop.md" "record the completion promise"
require_text "role loop seeds success criteria" "reference/role-loop.md" '`## Success Criteria` seeds falsifiable checkboxes'
require_text "role loop writes goal first" "reference/role-loop.md" '`GOAL.md` is written FIRST'
require_text "role loop quotes original request verbatim" "reference/role-loop.md" "quotes the user's prompt verbatim"
require_text "role loop keeps run state current" "reference/role-loop.md" 'keep `run-state.json` current'
require_text "role loop records regression ledger" "reference/role-loop.md" "regression_ledger"
require_text "role loop defines greenfield before proof" "reference/role-loop.md" "absent feature/red acceptance check for GREENFIELD"
require_text "role loop defines debug before proof" "reference/role-loop.md" "reproduced symptom for DEBUG"
require_text "role loop defines non-exact debug reproduction" "reference/role-loop.md" "exact reproduction is unavailable"
require_text "role loop defines brownfield before proof" "reference/role-loop.md" "preserve-baseline capture for LEGACY/brownfield"
require_text "role loop blocks missing trusted commands" "reference/role-loop.md" "missing trusted commands block a final done claim"

require_text "delivery gate says required" "reference/delivery-gate.md" "Before/After Eval is required"
require_text "delivery gate records eval intent" "reference/delivery-gate.md" "eval_intent"
require_text "delivery gate records completion promise" "reference/delivery-gate.md" "completion_promise"
require_text "delivery gate records requirement trace" "reference/delivery-gate.md" "requirement_trace"
require_text "delivery gate records reproduction fidelity" "reference/delivery-gate.md" "reproduction_fidelity"
require_text "delivery gate records run state" "reference/delivery-gate.md" "run_state"
require_text "delivery gate records before state" "reference/delivery-gate.md" "before_state"
require_text "delivery gate records after target" "reference/delivery-gate.md" "after_target"
require_text "delivery gate records command manifest" "reference/delivery-gate.md" "command_manifest"
require_text "delivery gate records decision gates" "reference/delivery-gate.md" "decision_gates"
require_text "delivery gate rejects agent-only proof" "reference/delivery-gate.md" "Agent-detected commands can supplement proof, but cannot be the whole proof"
require_text "delivery gate blocks unresolved ask-user" "reference/delivery-gate.md" 'Unresolved `ask-user` findings block a final done claim'
require_text "delivery gate requires neighbor snapshot rerun" "reference/delivery-gate.md" "captured neighbor snapshots re-run"
require_text "delivery gate requires clean backward trace" "reference/delivery-gate.md" "Backward-trace is clean"

# Commit gate: a non-green run (failed/incomplete QA, open requirement, uncertain intent) must not commit.
require_file "commit gate script exists" "templates/commit-gate.sh"
require_text "delivery gate defines commit gate" "reference/delivery-gate.md" "## Commit gate"
require_text "commit gate blocks failed/incomplete QA" "reference/delivery-gate.md" "QA verdict FAIL or PARTIAL"
require_text "commit gate blocks unchecked criterion" "reference/delivery-gate.md" "unchecked Success Criterion"
require_text "commit gate blocks unresolved ask-user gate" "reference/delivery-gate.md" "unresolved \`ask-user\` decision gate"
require_text "commit gate blocks pending plan approval" "reference/delivery-gate.md" "approval still pending"
require_text "commit gate requires completion marker" "reference/delivery-gate.md" 'missing `Z-*.md` completion marker'
require_text "commit gate blocks scope-creep orphan" "reference/delivery-gate.md" "scope-creep orphan"
require_text "commit gate blocks non-exact reproduction gap" "reference/delivery-gate.md" "non-exact reproduction fidelity without residual risk"
require_text "commit gate blocks uncertain intent" "reference/delivery-gate.md" "fulfillment is uncertain"
require_text "commit gate is fix-first" "reference/delivery-gate.md" "fix-first"
require_text "commit gate names backstop script" "reference/delivery-gate.md" "templates/commit-gate.sh"
require_text "SKILL hard-gates commit" "SKILL.md" "Commit is hard-gated"
require_text "SKILL points commit gate at delivery gate" "SKILL.md" "commit gate passes"
require_text "role loop gates commit on the script" "reference/role-loop.md" "once the commit gate passes"

require_text "plan grounding carries eval strategy" "reference/plan-grounding.md" "Before/After Eval strategy"
require_text "goal template records original request" "templates/GOAL.md" "## Original Request"
require_text "goal template records success criteria" "templates/GOAL.md" "## Success Criteria"
require_text "goal template records qa cases" "templates/GOAL.md" "## QA Cases"
require_text "goal template records decision gates" "templates/GOAL.md" "## Decision Gates"
require_text "goal template tags surfaced criteria" "templates/GOAL.md" "(surfaced:"
require_text "plan template records approval" "templates/PLAN.md" "## Approval"
require_text "plan template records completion promise" "templates/PLAN.md" "Completion promise"
require_text "plan template records tools and skills" "templates/PLAN.md" "## Tools & Skills"
require_text "plan template records verification strategy" "templates/PLAN.md" "## Verification strategy"
require_text "plan template is self-sufficient brief" "templates/PLAN.md" "reads ONLY this file"
require_text "qa template records before state" "templates/QA.md" "## Before"
require_text "qa template records results" "templates/QA.md" "## Results"
require_text "qa template records backward trace" "templates/QA.md" "Backward-trace:"
require_text "qa template records neighbor baseline" "templates/QA.md" "neighbor baseline re-run"
require_text "qa template records reproduction fidelity" "templates/QA.md" "## Reproduction Fidelity"
require_text "qa template records command manifest" "templates/QA.md" "## Commands"
require_text "qa template records residual risk" "templates/QA.md" "## Residual Risk"
require_text "qa template uses plain checklist sentences" "templates/QA.md" "plain-language checklist sentences"
require_text "r-loop template appends timestamped sections" "templates/R-LOOP.md" "APPENDS one timestamped section"
require_text "r-loop template feeds latest section only" "templates/R-LOOP.md" "ONLY the latest section"
require_text "z template records branch" "templates/Z-DONE.md" "Branch:"
require_text "z template records completion timestamp" "templates/Z-DONE.md" "Completed:"
require_text "z template requires all criteria checked" "templates/Z-DONE.md" "ONLY when every"
require_text "run state records max iterations" "templates/run-state.json" '"max_iterations": 8'
require_text "run state records regression ledger" "templates/run-state.json" "regression_ledger"
require_text "run state records regressed previously green" "templates/run-state.json" "regressed_previously_green"
require_text "run state records forced reflection" "templates/run-state.json" "forced_reflection"
require_text "run state records plan approval" "templates/run-state.json" "plan_approval"
require_text "commit gate parses success criteria" "templates/commit-gate.sh" "Success Criteria"
require_text "commit gate parses backward trace" "templates/commit-gate.sh" "Backward-trace"
require_text "commit gate parses reproduction fidelity" "templates/commit-gate.sh" "Reproduction Fidelity"
require_text "commit gate requires post deploy plan" "templates/commit-gate.sh" "post-deploy confirmation plan"
require_text "commit gate parses plan approval" "templates/commit-gate.sh" "approved-by-user"
require_text "commit gate requires completion marker" "templates/commit-gate.sh" "completion marker"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
