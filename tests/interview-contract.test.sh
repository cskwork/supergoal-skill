#!/usr/bin/env bash
# /supergoal clarifying-interview contract.
# Fails if the ambiguity-gated interview stops being required before plan freeze
# for GREENFIELD/DEBUG/LEGACY, or loses its gate/cap/code-first/DEBUG-rerank rules.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal interview contract   skill: $ROOT"
echo "=================================================================="

# SKILL.md wiring (detail lives in reference/interview.md; SKILL.md is a slim router post-baseline-first)
assert_text_ci_normalized "reference map lists interview" "SKILL.md" "reference/interview.md"

# interview.md contract
assert_text_ci_normalized "interview gated on ambiguity" "reference/interview.md" "Gate - when to interview vs skip"
assert_text_ci_normalized "interview skips when clear or code-answerable" "reference/interview.md" "quick, low-risk codebase/docs read can answer"
assert_text_ci_normalized "interview enforces code-first" "reference/interview.md" "resolve every code-answerable question by reading current docs/code"
assert_text_ci_normalized "interview caps at <=5 one round" "reference/interview.md" "Cap at <=5 questions, one clarification round"
assert_text_ci_normalized "interview asks one at a time with recommended answer" "reference/interview.md" "One at a time, recommend an answer"
assert_text_ci_normalized "interview lists six coverage dimensions" "reference/interview.md" "Safety / reversibility"
assert_text_ci_normalized "interview maximizes information gain" "reference/interview.md" "Maximize information gain"
assert_text_ci_normalized "interview debug variant re-ranks hypotheses" "reference/interview.md" "DEBUG variant - ranked hypothesis re-ranking"
assert_text_ci_normalized "interview debug variant is non-blocking" "reference/interview.md" "non-blocking"
assert_text_ci_normalized "interview hard-gates plan freeze" "reference/interview.md" "Hard gate - block plan freeze"
assert_text_ci_normalized "interview must not rely on model default" "reference/interview.md" "Do not rely on model default"
assert_text_ci_normalized "interview records compact section" "reference/interview.md" "the decision it drove"

# debugging.md re-rank checkpoint
assert_text_ci_normalized "debug confirm step presents ranked hypotheses" "reference/debugging.md" "present the 3-5 ranked hypotheses to the user for re-ranking"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
