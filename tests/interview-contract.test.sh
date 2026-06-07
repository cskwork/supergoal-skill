#!/usr/bin/env bash
# /supergoal clarifying-interview contract.
# Fails if the ambiguity-gated interview stops being required before plan freeze
# for GREENFIELD/DEBUG/LEGACY, or loses its gate/cap/code-first/DEBUG-rerank rules.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

echo "=================================================================="
echo " /supergoal interview contract   skill: $ROOT"
echo "=================================================================="

# SKILL.md wiring (detail lives in reference/interview.md; SKILL.md is a slim router post-baseline-first)
require_text "reference map lists interview" "SKILL.md" "reference/interview.md"

# interview.md contract
require_text "interview gated on ambiguity" "reference/interview.md" "Gate - when to interview vs skip"
require_text "interview skips when clear or code-answerable" "reference/interview.md" "quick, low-risk codebase/docs read can answer"
require_text "interview enforces code-first" "reference/interview.md" "resolve every code-answerable question by reading current docs/code"
require_text "interview caps at 3-5 one round" "reference/interview.md" "Cap at 3-5 questions, one clarification round"
require_text "interview asks one at a time with recommended answer" "reference/interview.md" "One at a time, recommend an answer"
require_text "interview lists six coverage dimensions" "reference/interview.md" "Safety / reversibility"
require_text "interview maximizes information gain" "reference/interview.md" "Maximize information gain"
require_text "interview debug variant re-ranks hypotheses" "reference/interview.md" "DEBUG variant - ranked hypothesis re-ranking"
require_text "interview debug variant is non-blocking" "reference/interview.md" "non-blocking"
require_text "interview hard-gates plan freeze" "reference/interview.md" "Hard gate - block plan freeze"
require_text "interview must not rely on model default" "reference/interview.md" "Do not rely on model default"
require_text "interview records compact section" "reference/interview.md" "the decision it drove"

# debugging.md re-rank checkpoint
require_text "debug confirm step presents ranked hypotheses" "reference/debugging.md" "present the 3-5 ranked hypotheses to the user for re-ranking"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
