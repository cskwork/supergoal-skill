#!/usr/bin/env bash
# /supergoal LEARN teaching contract.
# Fails if LEARN mode stops requiring decomposition plus process traces.

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
echo " /supergoal LEARN contract   skill: $ROOT"
echo "=================================================================="

require_text "top-level requires atom map" "SKILL.md" "atom map"
require_text "top-level requires process trace" "SKILL.md" "process trace"
require_text "top-level blocks glossary-only teaching" "SKILL.md" "A glossary alone is not enough"
require_text "top-level blocks literal Korean atom labels" "SKILL.md" 'Korean should say `핵심 용어`/`구성 요소`, not literal `원자`'
require_text "learn reference requires visible order" "reference/learn.md" "Mandatory visible order"
require_text "learn reference requires process gate" "reference/learn.md" "Process explanation gate"
require_text "learn template uses natural Korean term label" "reference/learn.md" "| 핵심 용어 | 쉬운 뜻 | 흐름에서 하는 일 |"
require_text "learn template uses natural Korean trace label" "reference/learn.md" "| 단계 | 사용되는 용어 | 일어나는 일 | 규칙/조건 | 결과/부작용 |"
require_text "learn keeps trace at low difficulty" "reference/learn.md" "At low difficulty, use fewer rows and plainer words; do not remove the trace"
require_text "learn blocks summary replacing trace" "reference/learn.md" "Never replace the process trace with a summary sentence"
require_text "learn check includes process role" "reference/learn.md" "define its role and place in the process"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
