#!/usr/bin/env bash
# /supergoal TEACH teaching contract.
# Fails if TEACH mode stops requiring decomposition plus process traces.

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

require_node_check() {
  local label="$1" file="$2"
  local out
  out="$(node --check "$ROOT/$file" 2>&1)"
  local status=$?
  if [ "$status" -eq 0 ]; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        node --check %s failed: %s\n' "$file" "$out"
  fi
}

echo "=================================================================="
echo " /supergoal TEACH contract   skill: $ROOT"
echo "=================================================================="

require_text "learn reference requires decomposition" "reference/teach.md" "smallest useful pieces"
require_text "learn reference requires process trace" "reference/teach.md" "process trace"
require_text "learn reference blocks glossary-only teaching" "reference/teach.md" "Glossary alone is not enough"
require_text "learn reference blocks literal Korean atom labels" "reference/teach.md" 'avoid exposing the literal label `원자`'
require_text "learn reference requires visible order" "reference/teach.md" "Mandatory visible order"
require_text "learn reference requires process gate" "reference/teach.md" "Process explanation gate"
require_text "learn template uses natural Korean term label" "reference/teach.md" "| 핵심 용어 | 쉬운 뜻 | 흐름에서 하는 일 |"
require_text "learn template uses natural Korean trace label" "reference/teach.md" "| 단계 | 사용되는 용어 | 일어나는 일 | 규칙/조건 | 결과/부작용 |"
require_text "learn trace anchor is comment-only" "reference/teach.md" "<!-- Contract anchor:"
require_text "learn keeps trace at low difficulty" "reference/teach.md" "At low difficulty, use fewer rows and plainer words; do not remove the trace"
require_text "learn blocks summary replacing trace" "reference/teach.md" "Never replace the process trace with a summary sentence"
require_text "learn check includes process role" "reference/teach.md" "define its role and place in the process"

# --- interview/quiz must randomize the correct option (anti position pattern-matching) ---
require_text "learn interview randomizes the correct option" "reference/teach.md" "randomize the correct option's position"
require_text "learn interview forbids always-first answer" "reference/teach.md" "Do not always place the right answer first"
require_text "learn quiz hygiene randomizes option position" "reference/teach.md" "formatting leaks no clue to the correct answer"

require_text "README routes human teaching as TEACH" "README.md" '| "explain / teach me X" (no code) | **TEACH** |'
require_text "Korean README routes human teaching as TEACH" "README.ko.md" '| "X를 설명/가르쳐줘" (코드 변경 없음) | **TEACH** |'
require_text "landing routes human teaching as TEACH" "docs/index.html" '<span class="mode-label">TEACH</span>'
require_text "README layout uses teach workspace" "README.md" "teach/ TEACH-mode format guides"

# --- teach workspace integration (mattpocock/skills teach merged into TEACH) ---
require_text "learn is a stateful teaching workspace" "reference/teach.md" "stateful, multi-session teaching workspace"
require_text "learn credits the teach source" "reference/teach.md" "mattpocock/skills"
require_text "learn keeps Knowledge/Skills/Wisdom triad" "reference/teach.md" "Knowledge / Skills / Wisdom"
require_text "learn forbids parametric guessing" "reference/teach.md" "never trust parametric knowledge"
require_text "learn distinguishes fluency vs storage" "reference/teach.md" "Fluency vs storage strength"
require_text "learn uses desirable difficulty" "reference/teach.md" "desirable difficulty"
require_text "learn grounds every lesson in the mission" "reference/teach.md" "Every lesson ties back to the mission"
require_text "learn computes zone of proximal development" "reference/teach.md" "zone of proximal development"
require_text "learn makes the HTML lesson the primary unit" "reference/teach.md" "primary teaching unit"
require_text "learn keeps ADR-style learning records" "reference/teach.md" "learning-records/"

# --- workspace format guides must ship ---
require_file "mission format guide exists" "teach/MISSION-FORMAT.md"
require_file "resources format guide exists" "teach/RESOURCES-FORMAT.md"
require_file "glossary format guide exists" "teach/GLOSSARY-FORMAT.md"
require_file "learning-record format guide exists" "teach/LEARNING-RECORD-FORMAT.md"

# --- interactive lesson assets must ship with TEACH ---
require_file "teach asset README exists" "templates/teach/README.md"
require_file "teach lesson template exists" "templates/teach/assets/lesson-template.html"
require_file "teach lesson stylesheet exists" "templates/teach/assets/lesson.css"
require_file "teach book engine exists" "templates/teach/assets/lesson-book.js"
require_file "teach quiz widget exists" "templates/teach/assets/quiz.js"
require_text "teach README explains asset copy path" "templates/teach/README.md" "teach/<topic>/assets/"
require_text "lesson template wires book shell" "templates/teach/assets/lesson-template.html" 'main class="book"'
require_text "lesson template wires quiz block" "templates/teach/assets/lesson-template.html" 'class="sg-quiz"'
require_text "lesson stylesheet defines book layout" "templates/teach/assets/lesson.css" ".pages-track"
require_text "lesson stylesheet defines quiz widget" "templates/teach/assets/lesson.css" ".sg-option"
require_text "book engine builds TOC" "templates/teach/assets/lesson-book.js" "tocButtons"
require_text "quiz widget randomizes options" "templates/teach/assets/quiz.js" "shuffle(options)"
require_node_check "teach book engine parses as JS" "templates/teach/assets/lesson-book.js"
require_node_check "teach quiz widget parses as JS" "templates/teach/assets/quiz.js"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
