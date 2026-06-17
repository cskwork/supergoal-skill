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

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        missing file: %s\n' "$file"
  fi
}

echo "=================================================================="
echo " /supergoal LEARN contract   skill: $ROOT"
echo "=================================================================="

require_text "learn reference requires decomposition" "reference/learn.md" "smallest useful pieces"
require_text "learn reference requires process trace" "reference/learn.md" "process trace"
require_text "learn reference blocks glossary-only teaching" "reference/learn.md" "Glossary alone is not enough"
require_text "learn reference blocks literal Korean atom labels" "reference/learn.md" 'avoid exposing the literal label `원자`'
require_text "learn reference requires visible order" "reference/learn.md" "Mandatory visible order"
require_text "learn reference requires process gate" "reference/learn.md" "Process explanation gate"
require_text "learn template uses natural Korean term label" "reference/learn.md" "| 핵심 용어 | 쉬운 뜻 | 흐름에서 하는 일 |"
require_text "learn template uses natural Korean trace label" "reference/learn.md" "| 단계 | 사용되는 용어 | 일어나는 일 | 규칙/조건 | 결과/부작용 |"
require_text "learn trace anchor is comment-only" "reference/learn.md" "<!-- Contract anchor:"
require_text "learn keeps trace at low difficulty" "reference/learn.md" "At low difficulty, use fewer rows and plainer words; do not remove the trace"
require_text "learn blocks summary replacing trace" "reference/learn.md" "Never replace the process trace with a summary sentence"
require_text "learn check includes process role" "reference/learn.md" "define its role and place in the process"

# --- teach workspace integration (mattpocock/skills teach merged into LEARN) ---
require_text "learn is a stateful teaching workspace" "reference/learn.md" "stateful, multi-session teaching workspace"
require_text "learn credits the teach source" "reference/learn.md" "mattpocock/skills"
require_text "learn keeps Knowledge/Skills/Wisdom triad" "reference/learn.md" "Knowledge / Skills / Wisdom"
require_text "learn forbids parametric guessing" "reference/learn.md" "never trust parametric knowledge"
require_text "learn distinguishes fluency vs storage" "reference/learn.md" "Fluency vs storage strength"
require_text "learn uses desirable difficulty" "reference/learn.md" "desirable difficulty"
require_text "learn grounds every lesson in the mission" "reference/learn.md" "Every lesson ties back to the mission"
require_text "learn computes zone of proximal development" "reference/learn.md" "zone of proximal development"
require_text "learn makes the HTML lesson the primary unit" "reference/learn.md" "primary teaching unit"
require_text "learn keeps ADR-style learning records" "reference/learn.md" "learning-records/"

# --- workspace format guides must ship ---
require_file "mission format guide exists" "learn/MISSION-FORMAT.md"
require_file "resources format guide exists" "learn/RESOURCES-FORMAT.md"
require_file "glossary format guide exists" "learn/GLOSSARY-FORMAT.md"
require_file "learning-record format guide exists" "learn/LEARNING-RECORD-FORMAT.md"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
