#!/usr/bin/env bash
# /supergoal TEACH teaching contract.
# Fails if TEACH mode stops requiring decomposition plus process traces.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

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

assert_text_ci_normalized "learn reference requires decomposition" "reference/teach.md" "smallest useful pieces"
assert_text_ci_normalized "learn reference requires process trace" "reference/teach.md" "process trace"
assert_text_ci_normalized "learn reference blocks glossary-only teaching" "reference/teach.md" "Glossary alone is not enough"
assert_text_ci_normalized "learn reference blocks literal Korean atom labels" "reference/teach.md" 'avoid exposing the literal label `원자`'
assert_text_ci_normalized "learn reference requires visible order" "reference/teach.md" "Mandatory visible order"
assert_text_ci_normalized "learn reference requires process gate" "reference/teach.md" "Process explanation gate"
assert_text_ci_normalized "learn template uses natural Korean term label" "reference/teach.md" "| 핵심 용어 | 쉬운 뜻 | 흐름에서 하는 일 |"
assert_text_ci_normalized "learn template uses natural Korean trace label" "reference/teach.md" "| 단계 | 사용되는 용어 | 일어나는 일 | 규칙/조건 | 결과/부작용 |"
assert_text_ci_normalized "learn trace anchor is comment-only" "reference/teach.md" "<!-- Contract anchor:"
assert_text_ci_normalized "learn keeps trace at low difficulty" "reference/teach.md" "At low difficulty, use fewer rows and plainer words; do not remove the trace"
assert_text_ci_normalized "learn blocks summary replacing trace" "reference/teach.md" "Never replace the process trace with a summary sentence"
assert_text_ci_normalized "learn check includes process role" "reference/teach.md" "define its role and place in the process"

# --- textbook depth: teach each concept fully, do not compress into abstractions ---
assert_text_ci_normalized "learn teaches each concept to textbook depth" "reference/teach.md" "Textbook depth, not abstraction"
assert_text_ci_normalized "learn treats key-terms map as an index not teaching" "reference/teach.md" "A key-terms map is an index, not the teaching"
assert_text_ci_normalized "learn forbids compressing concepts into one abstraction" "reference/teach.md" "Do not compress several concepts into one abstract label"
assert_text_ci_normalized "learn narrows scope not depth" "reference/teach.md" "Narrow the scope, not the depth"
assert_text_ci_normalized "learn contract item teaches concepts to textbook depth" "reference/teach.md" "Teach each concept to textbook depth"
assert_text_ci_normalized "teach template ships a concept-development page" "templates/teach/assets/lesson-template.html" "개념 풀이"
assert_text_ci_normalized "teach README keeps terms table as index only" "templates/teach/README.md" "The terms table is an index"

# --- worked scenario over analogy: trace one real input end-to-end ---
assert_text_ci_normalized "learn prefers a real worked scenario over analogy" "reference/teach.md" "Prefer a real worked scenario to an analogy"
assert_text_ci_normalized "learn anchors the trace in one real input" "reference/teach.md" "Anchor the trace in one concrete"
assert_text_ci_normalized "learn replaces a rejected analogy with a traced case" "reference/teach.md" "replace it with a real traced scenario"
assert_text_ci_normalized "learn contract item anchors process in a real scenario" "reference/teach.md" "Anchor every process or flow in one real worked scenario"
assert_text_ci_normalized "teach template traces one example input" "templates/teach/assets/lesson-template.html" "예제 입력"

# --- interview/quiz must randomize the correct option (anti position pattern-matching) ---
assert_text_ci_normalized "learn interview randomizes the correct option" "reference/teach.md" "randomize the correct option's position"
assert_text_ci_normalized "learn interview forbids always-first answer" "reference/teach.md" "Do not always place the right answer first"
assert_text_ci_normalized "learn quiz hygiene randomizes option position" "reference/teach.md" "formatting leaks no clue to the correct answer"

assert_text_ci_normalized "README routes human teaching as TEACH" "README.md" '| "explain / teach me X" (no code) | **TEACH** |'
assert_text_ci_normalized "Korean README routes human teaching as TEACH" "README.ko.md" '| "X를 설명/가르쳐줘" (코드 변경 없음) | **TEACH** |'
assert_text_ci_normalized "landing routes human teaching as TEACH" "docs/index.html" '<span class="mode-label">TEACH</span>'
assert_text_ci_normalized "README layout uses teach workspace" "README.md" "teach/ TEACH-mode format guides"

# --- teach workspace integration (mattpocock/skills teach merged into TEACH) ---
assert_text_ci_normalized "learn is a stateful teaching workspace" "reference/teach.md" "stateful, multi-session teaching workspace"
assert_text_ci_normalized "learn credits the teach source" "reference/teach.md" "mattpocock/skills"
assert_text_ci_normalized "learn keeps Knowledge/Skills/Wisdom triad" "reference/teach.md" "Knowledge / Skills / Wisdom"
assert_text_ci_normalized "learn forbids parametric guessing" "reference/teach.md" "never trust parametric knowledge"
assert_text_ci_normalized "learn distinguishes fluency vs storage" "reference/teach.md" "Fluency vs storage strength"
assert_text_ci_normalized "learn uses desirable difficulty" "reference/teach.md" "desirable difficulty"
assert_text_ci_normalized "learn grounds every lesson in the mission" "reference/teach.md" "Every lesson ties back to the mission"
assert_text_ci_normalized "learn computes zone of proximal development" "reference/teach.md" "zone of proximal development"
assert_text_ci_normalized "learn makes the HTML lesson the primary unit" "reference/teach.md" "primary teaching unit"
assert_text_ci_normalized "learn keeps ADR-style learning records" "reference/teach.md" "learning-records/"

# --- Archify is the default teaching diagram system when relationships matter ---
assert_text_ci_normalized "skill metadata triggers for teaching" "SKILL.md" '"teach/explain"'
assert_text_ci_normalized "skill router defaults TEACH diagrams to Archify" "SKILL.md" "Archify diagram by default"
assert_text_ci_normalized "teach defaults relationship diagrams to Archify" "reference/teach.md" "Archify is the default diagram system"
assert_text_ci_normalized "teach keeps diagrams conditional on explanatory value" "reference/teach.md" "when a lesson teaches relationships or ordered change"
assert_text_ci_normalized "teach keeps diagram source beside the lesson" "reference/teach.md" "teach/<topic>/diagrams/"
assert_text_ci_normalized "teach diagrams do not replace the required quiz" "reference/teach.md" "does not replace the required quiz"
assert_text_ci_normalized "archify reference routes TEACH lessons" "reference/archify.md" "TEACH lesson"
assert_text_ci_normalized "teach README explains the Archify diagram path" "templates/teach/README.md" "teach/<topic>/diagrams/"
assert_text_ci_normalized "lesson template embeds an Archify diagram" "templates/teach/assets/lesson-template.html" 'class="archify-frame"'
assert_text_ci_normalized "lesson template points to the topic diagram" "templates/teach/assets/lesson-template.html" 'src="../diagrams/'
assert_text_ci_normalized "lesson template titles the diagram iframe" "templates/teach/assets/lesson-template.html" 'title="{{LESSON TITLE}}'
assert_text_ci_normalized "lesson stylesheet sizes Archify embeds" "templates/teach/assets/lesson.css" ".archify-frame"
assert_text_ci_normalized "English README makes TEACH Archify conditional" "README.md" "Archify when relationships matter"
assert_text_ci_normalized "Korean README makes TEACH Archify conditional" "README.ko.md" "관계가 중요하면 Archify"

# --- workspace format guides must ship ---
assert_file "mission format guide exists" "teach/MISSION-FORMAT.md"
assert_file "resources format guide exists" "teach/RESOURCES-FORMAT.md"
assert_file "glossary format guide exists" "teach/GLOSSARY-FORMAT.md"
assert_file "learning-record format guide exists" "teach/LEARNING-RECORD-FORMAT.md"

# --- interactive lesson assets must ship with TEACH ---
assert_file "teach asset README exists" "templates/teach/README.md"
assert_file "teach lesson template exists" "templates/teach/assets/lesson-template.html"
assert_file "teach lesson stylesheet exists" "templates/teach/assets/lesson.css"
assert_file "teach book engine exists" "templates/teach/assets/lesson-book.js"
assert_file "teach quiz widget exists" "templates/teach/assets/quiz.js"
assert_text_ci_normalized "teach README explains asset copy path" "templates/teach/README.md" "teach/<topic>/assets/"
assert_text_ci_normalized "lesson template wires book shell" "templates/teach/assets/lesson-template.html" 'main class="book"'
assert_text_ci_normalized "lesson template wires quiz block" "templates/teach/assets/lesson-template.html" 'class="sg-quiz"'
assert_text_ci_normalized "lesson stylesheet defines book layout" "templates/teach/assets/lesson.css" ".pages-track"
assert_text_ci_normalized "lesson stylesheet defines quiz widget" "templates/teach/assets/lesson.css" ".sg-option"
assert_text_ci_normalized "book engine builds TOC" "templates/teach/assets/lesson-book.js" "tocButtons"
assert_text_ci_normalized "quiz widget randomizes options" "templates/teach/assets/quiz.js" "shuffle(options)"
require_node_check "teach book engine parses as JS" "templates/teach/assets/lesson-book.js"
require_node_check "teach quiz widget parses as JS" "templates/teach/assets/quiz.js"

# --- generated-lesson output gate: a lesson must be interactive, not reading-only ---
assert_file "teach lesson gate exists" "templates/teach-lesson-gate.mjs"
require_node_check "teach lesson gate parses as JS" "templates/teach-lesson-gate.mjs"
assert_text_ci_normalized "learn reference runs the lesson gate" "reference/teach.md" "teach-lesson-gate.mjs"
assert_text_ci_normalized "learn reference gates before done" "reference/teach.md" "Gate before done"
assert_text_ci_normalized "learn reference blocks reading-only lessons" "reference/teach.md" "Reading-only HTML is not a lesson"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
