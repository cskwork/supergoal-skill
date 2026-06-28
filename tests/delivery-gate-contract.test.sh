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
require_file "delivery proof template exists" "templates/delivery-proof.md"

require_text "SKILL requires Before/After Eval" "SKILL.md" "Before/After Eval complete"
require_text "SKILL points at delivery gate" "SKILL.md" "reference/delivery-gate.md"
require_text "SKILL starts delivery proof in Frame" "SKILL.md" 'start `delivery-proof.md`'
require_text "SKILL requires after evidence before done" "SKILL.md" "after evidence, resolved decision gates, and residual risk"

require_text "role loop starts proof before mutation" "reference/role-loop.md" "Before any file mutation"
require_text "role loop defines greenfield before proof" "reference/role-loop.md" "absent feature/red acceptance check for GREENFIELD"
require_text "role loop defines debug before proof" "reference/role-loop.md" "reproduced symptom for DEBUG"
require_text "role loop defines brownfield before proof" "reference/role-loop.md" "preserve-baseline capture for LEGACY/brownfield"
require_text "role loop blocks missing trusted commands" "reference/role-loop.md" "missing trusted commands block a final done claim"

require_text "delivery gate says required" "reference/delivery-gate.md" "Before/After Eval is required"
require_text "delivery gate records eval intent" "reference/delivery-gate.md" "eval_intent"
require_text "delivery gate records before state" "reference/delivery-gate.md" "before_state"
require_text "delivery gate records after target" "reference/delivery-gate.md" "after_target"
require_text "delivery gate records command manifest" "reference/delivery-gate.md" "command_manifest"
require_text "delivery gate records decision gates" "reference/delivery-gate.md" "decision_gates"
require_text "delivery gate rejects agent-only proof" "reference/delivery-gate.md" "Agent-detected commands can supplement proof, but cannot be the whole proof"
require_text "delivery gate blocks unresolved ask-user" "reference/delivery-gate.md" 'Unresolved `ask-user` findings block a final done claim'

require_text "plan grounding carries eval strategy" "reference/plan-grounding.md" "Before/After Eval strategy"
require_text "template records before state" "templates/delivery-proof.md" "## Before State"
require_text "template records command manifest" "templates/delivery-proof.md" "## Command Manifest"
require_text "template records residual risk" "templates/delivery-proof.md" "## Residual Risk"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
