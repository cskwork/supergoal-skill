#!/usr/bin/env bash
# /supergoal QA-ONLY contract + gate scenarios.
# Part A asserts the no-code QA mode is wired into the spine, references, and agents.
# Part B drives qa-only-gate.sh through real temp vaults, asserting BOTH exit code AND an output
# substring per case (two independent signals), the same discipline as tests/gate-scenarios.test.sh.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then PASS=$((PASS+1)); printf '  PASS  %s\n' "$label"
  else FAIL=$((FAIL+1)); printf '  FAIL  %s\n        missing file: %s\n' "$label" "$file"; fi
}
require_text() {
  local label="$1" file="$2" text="$3" normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then PASS=$((PASS+1)); printf '  PASS  %s\n' "$label"
  else FAIL=$((FAIL+1)); printf '  FAIL  %s\n        missing in %s: %s\n' "$label" "$file" "$text"; fi
}

echo "=================================================================="
echo " /supergoal QA-ONLY contract   skill: $ROOT"
echo "=================================================================="

# ---- Part A: wiring ------------------------------------------------------
require_file "qa-only reference exists"      "reference/qa-only.md"
require_file "db-access reference exists"    "reference/db-access.md"
require_file "qa-auditor agent exists"       "agents/qa-auditor.md"
require_file "db-reader agent exists"        "agents/db-reader.md"
require_file "qa report template exists"     "templates/qa-report.md"
require_file "qa-only gate exists"           "templates/qa-only-gate.sh"

require_text "skill lists QA-ONLY mode"          "SKILL.md" "**QA-ONLY**"
require_text "skill maps qa-only reference"       "SKILL.md" "reference/qa-only.md"
require_text "skill maps qa-only gate"            "SKILL.md" "templates/qa-only-gate.sh"
require_text "readme lists QA-ONLY mode"          "README.md" "**QA-ONLY**"

require_text "qa-only writes no production code"  "reference/qa-only.md" "writes NO production code"
require_text "qa-only is read-only"               "reference/qa-only.md" "read-only except the run folder"
require_text "qa-only default cap is 100"         "reference/qa-only.md" "Default \`action_cap\` is **100**"
require_text "qa-only separates two subagents"    "reference/qa-only.md" "Two separate read-only subagents"
require_text "qa-only persists indexed suite"     "reference/qa-only.md" ".domain-agent/qa/<suite>.md"
require_text "qa-only names report anchors"       "reference/qa-only.md" "What worked"
require_text "qa-only handoff via qa/expected.md" "reference/qa-only.md" "qa/expected.md"

require_text "db-access is read-only hard rule"   "reference/db-access.md" "Read-only (hard rule)"
require_text "db-access is db-independent"        "reference/db-access.md" "DB-independent abstraction"
require_text "db-access never hardcodes creds"    "reference/db-access.md" "NEVER hardcode"
require_text "db-access runs in db-reader"        "reference/db-access.md" "dedicated \`db-reader\` subagent"

require_text "qa-auditor does not read DB"        "agents/qa-auditor.md" "do NOT read the database yourself"
require_text "qa-auditor default agent-browser"   "agents/qa-auditor.md" "Default driver is \`agent-browser\`"
require_text "qa-auditor uses attach for auth"    "agents/qa-auditor.md" "attach-to-browser"
require_text "db-reader is select-only"           "agents/db-reader.md" "Read-only ONLY"
require_text "db-reader never writes auth to file" "agents/db-reader.md" "NEVER write auth/credentials to any file"

require_text "qa.md has attach-to-browser policy" "reference/qa.md" "Authenticated sessions (attach-to-browser)"
require_text "domain-context registers qa suites" "reference/domain-context.md" "Reusable QA suites from QA-ONLY runs"
require_text "index template has QA Suites"       "templates/domain-agent/index.md" "## QA Suites"
require_text "db-reader may write its evidence"   "agents/db-reader.md" "Read, Grep, Glob, Bash, Write"
require_text "qa-auditor always records doctor"   "agents/qa-auditor.md" "Always run and record the \`agent-browser doctor\` preflight"

# ---- Part B: qa-only-gate.sh scenarios -----------------------------------
GATE="$ROOT/templates/qa-only-gate.sh"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT

run_case() {
  local label="$1" exp="$2" sub="$3"; shift 3
  local out ec ok=1
  out="$("$@" 2>&1)"; ec=$?
  [ "$ec" = "$exp" ] || ok=0
  [ "$sub" = "-" ] || printf '%s' "$out" | grep -qiF -- "$sub" || ok=0
  if [ "$ok" = 1 ]; then PASS=$((PASS+1)); printf '  PASS  %-44s exit=%s\n' "$label" "$ec"
  else FAIL=$((FAIL+1)); printf '  FAIL  %-44s exit=%s (want %s) substr=%q\n        out: %s\n' \
    "$label" "$ec" "$exp" "$sub" "$(printf '%s' "$out" | tr '\n' '|' | cut -c1-160)"; fi
}

# Build a fully-passing browser QA-ONLY vault, then mutate per case.
mkbrowser() {
  local v="$T/$1"; rm -rf "$v"; mkdir -p "$v/qa"
  printf 'QA scope: checkout flow on staging\n' > "$v/brief.md"
  printf '# QA report\n## What worked\n- login -> PASS\n## What didn'"'"'t\n- none\n## What I discovered\n- nothing\n## How to re-run\n- `.domain-agent/qa/checkout.md`\n' > "$v/report.md"
  printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\n- as-is/to-be captured\n' > "$v/verification.md"
  : > "$v/qa/as-is-1040.png"; : > "$v/qa/to-be-1040.png"
  printf '{ "action_count": 12, "action_cap": 100 }\n' > "$v/state.json"
  echo "$v"
}

echo; echo "SCENARIO — qa-only-gate.sh"
run_case "0.0 missing app-type -> usage (exit 2)"  2 "usage"   bash "$GATE" "$(mkbrowser g0)"
run_case "0.1 bad app-type -> usage (exit 2)"      2 "usage"   bash "$GATE" "$(mkbrowser g0b)" mobile

v=$(mkbrowser g1)
run_case "1.1 full valid browser -> PASS"          0 "QA-ONLY GATE PASS" bash "$GATE" "$v" browser
rm -f "$v/report.md"
run_case "1.2 missing report.md -> blocked"        1 "report.md missing" bash "$GATE" "$v" browser
v=$(mkbrowser g1c)
printf '# QA report\n## What worked\n- ok\n## What I discovered\n- x\n## How to re-run\n- y\n' > "$v/report.md"
run_case "1.3 report missing a section -> blocked" 1 "What didn"          bash "$GATE" "$v" browser
v=$(mkbrowser g1d); rm -f "$v/brief.md"
run_case "1.4 missing brief.md -> blocked"         1 "brief.md missing"   bash "$GATE" "$v" browser

v=$(mkbrowser g2); printf '{ "action_count": 150, "action_cap": 100 }\n' > "$v/state.json"
run_case "2.1 action_count over cap -> blocked"    1 "exceeds action_cap" bash "$GATE" "$v" browser
v=$(mkbrowser g2b); printf '{ "foo": 1 }\n' > "$v/state.json"
run_case "2.2 no numeric action_count -> blocked"  1 "action_count"       bash "$GATE" "$v" browser
v=$(mkbrowser g3); printf '{ "action_count": 50 }\n' > "$v/state.json"
run_case "3.1 action_cap defaults to 100 -> PASS"  0 "within cap 100"     bash "$GATE" "$v" browser

# Attach-to-browser (authenticated session): sanctioned driver, still records the doctor preflight.
v=$(mkbrowser g3b)
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: attach-to-browser\nFallback: authenticated session required\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "3.2 attach-to-browser for auth -> PASS"  0 "QA-ONLY GATE PASS"  bash "$GATE" "$v" browser

# DB read-only backstop.
v=$(mkbrowser g4)
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\nDB: mysql (read-only via aidt-mysql-cli)\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "4.1 DB read-only, no writes -> PASS"     0 "every DB: line marked read-only" bash "$GATE" "$v" browser
v=$(mkbrowser g4b)
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\nDB: mysql (via cli)\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "4.2 DB line not read-only -> blocked"    1 "not marked read-only" bash "$GATE" "$v" browser
v=$(mkbrowser g4c)
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\nDB: mysql (read-only via cli)\nran: UPDATE orders SET total=1\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "4.3 DB write SQL recorded -> blocked"    1 "DB write statement"  bash "$GATE" "$v" browser
# Second DB line unmarked rides behind a first read-only line -> must be caught per-line.
v=$(mkbrowser g4d)
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\nDB: postgres (read-only via psql)\nDB: mysql (via cli)\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "4.4 mixed DB lines, one unmarked -> blocked" 1 "not marked read-only" bash "$GATE" "$v" browser
# REPLACE INTO / GRANT are writes too.
v=$(mkbrowser g4e)
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\nDB: mysql (read-only via cli)\nran: REPLACE INTO cache VALUES (1)\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "4.5 REPLACE INTO -> blocked"             1 "DB write statement"  bash "$GATE" "$v" browser
v=$(mkbrowser g4f)
printf 'verdict: GREEN\n## QA\nagent-browser doctor: pass\nTool: agent-browser\nDB: mysql (read-only via cli)\nran: GRANT SELECT ON db.* TO qa\n- as-is/to-be captured\n' > "$v/verification.md"
run_case "4.6 GRANT -> blocked"                    1 "DB write statement"  bash "$GATE" "$v" browser

# CLI app-type: qa-gate.sh needs only ## QA; everything else still enforced.
v=$(mkbrowser g5); rm -rf "$v/qa"
printf 'verdict: GREEN\n## QA\nintegration smoke: bin vs fixture snapshot matches\n' > "$v/verification.md"
run_case "5.1 CLI app + valid report -> PASS"      0 "QA-ONLY GATE PASS"  bash "$GATE" "$v" cli

echo
echo "=================================================================="
printf " RESULT: %d passed, %d failed\n" "$PASS" "$FAIL"
echo "=================================================================="
[ "$FAIL" -eq 0 ]
