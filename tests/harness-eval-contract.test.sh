#!/usr/bin/env bash
# /supergoal HARNESS-EVAL contract + gate scenarios.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

PASS=0
FAIL=0
GATE="$ROOT/templates/harness-eval-gate.mjs"

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1))
    printf ' PASS %-44s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf ' FAIL %-44s missing %s\n' "$label" "$file"
  fi
}

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  if [ ! -f "$ROOT/$file" ]; then
    FAIL=$((FAIL + 1))
    printf ' FAIL %-44s missing %s\n' "$label" "$file"
    return
  fi
  normalized="$(tr '\n' ' ' < "$ROOT/$file")"
  if printf '%s' "$normalized" | grep -Fq "$text"; then
    PASS=$((PASS + 1))
    printf ' PASS %-44s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf ' FAIL %-44s missing text: %s\n' "$label" "$text"
  fi
}

run_case() {
  local label="$1" exp="$2" sub="$3"
  shift 3
  local out ec ok=1
  out="$("$@" 2>&1)"
  ec=$?
  [ "$ec" = "$exp" ] || ok=0
  [ "$sub" = "-" ] || printf '%s' "$out" | grep -qiF -- "$sub" || ok=0
  if [ "$ok" = 1 ]; then
    PASS=$((PASS + 1))
    printf ' PASS %-44s exit=%s\n' "$label" "$ec"
  else
    FAIL=$((FAIL + 1))
    printf ' FAIL %-44s exit=%s want=%s substr=%q\n  out: %s\n' "$label" "$ec" "$exp" "$sub" "$out"
  fi
}

mkresult() {
  local file="$1" winner="$2" proven="$3" checks="$4"
  cat > "$file" <<EOF
{
  "case_id": "case-001",
  "runtime_adapter": "codex",
  "same_repo_snapshot": true,
  "isolated_worktrees": true,
  "baseline": {
    "condition": "without_harness",
    "machine_checks": $checks,
    "cost": { "tokens": 1000, "duration_ms": 1000, "tool_calls": 10 }
  },
  "harness": {
    "condition": "with_harness",
    "machine_checks": $checks,
    "cost": { "tokens": 1200, "duration_ms": 1400, "tool_calls": 12 }
  },
  "blind_grading": true,
  "winner": "$winner",
  "claim_status": "$proven"
}
EOF
}

echo "/supergoal HARNESS-EVAL contract"
echo "=================================="

require_file "harness eval reference exists" "reference/harness-eval.md"
require_file "harness eval gate exists" "templates/harness-eval-gate.mjs"
require_file "harness eval case template exists" "templates/harness-eval-case.yaml"
require_file "harness eval result template exists" "templates/harness-eval-result.json"
require_file "harness eval report template exists" "templates/harness-eval-report.md"

require_text "route hook names HARNESS-EVAL" "SKILL.md" "HARNESS-EVAL"
require_text "route hook points at eval reference" "SKILL.md" "reference/harness-eval.md"
require_text "step 0 has harness eval row" "SKILL.md" "| \"test harness effectiveness"
require_text "eval requires same snapshot" "reference/harness-eval.md" "same repo snapshot"
require_text "eval requires blind grading" "reference/harness-eval.md" "blind or label-swapped grading"
require_text "eval avoids inflated claims" "reference/harness-eval.md" "Not proven"
require_text "eval records bug-catch matrix" "reference/harness-eval.md" "bug-catch matrix"
require_text "eval records false GREEN" "reference/harness-eval.md" "false-GREEN count"
require_text "report records not proven" "templates/harness-eval-report.md" "## Not proven"
require_text "report records bug-catch matrix" "templates/harness-eval-report.md" "## Bug-Catch Matrix"
require_text "case template records regression protection" "templates/harness-eval-case.yaml" "regression_protection"
require_text "gate requires passed checks" "templates/harness-eval-gate.mjs" "check.status !== \"pass\""

PASS_CHECKS='[{"name":"test","status":"pass","evidence":"tests passed"},{"name":"lint","status":"pass","evidence":"lint passed"},{"name":"build","status":"pass","evidence":"build passed"}]'
WEAK_CHECKS='[{"name":"test","status":"pass","evidence":"tests passed"}]'
FAILED_CHECKS='[{"name":"test","status":"fail","evidence":"tests failed"},{"name":"lint","status":"pass","evidence":"lint passed"},{"name":"build","status":"pass","evidence":"build passed"}]'
NO_EVIDENCE_CHECKS='[{"name":"test","status":"pass","evidence":""},{"name":"lint","status":"pass","evidence":"lint passed"},{"name":"build","status":"pass","evidence":"build passed"}]'

mkresult "$T/pass.json" "harness" "proven" "$PASS_CHECKS"
run_case "gate accepts complete eval" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/pass.json"

mkresult "$T/no-snapshot.json" "harness" "proven" "$PASS_CHECKS"
node -e "const fs=require('fs'); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p)); j.same_repo_snapshot=false; fs.writeFileSync(p, JSON.stringify(j, null, 2));" "$T/no-snapshot.json"
run_case "gate blocks different snapshot" 1 "same_repo_snapshot" node "$GATE" "$T/no-snapshot.json"

mkresult "$T/no-blind.json" "harness" "proven" "$PASS_CHECKS"
node -e "const fs=require('fs'); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p)); j.blind_grading=false; fs.writeFileSync(p, JSON.stringify(j, null, 2));" "$T/no-blind.json"
run_case "gate blocks non-blind grading" 1 "blind_grading" node "$GATE" "$T/no-blind.json"

mkresult "$T/no-checks.json" "harness" "proven" "$WEAK_CHECKS"
run_case "gate blocks weak machine checks" 1 "machine_checks" node "$GATE" "$T/no-checks.json"

mkresult "$T/failed-check.json" "harness" "proven" "$FAILED_CHECKS"
run_case "gate blocks failed machine check" 1 "status" node "$GATE" "$T/failed-check.json"

mkresult "$T/not-proven-failed-check.json" "not_proven" "not_proven" "$FAILED_CHECKS"
run_case "gate accepts failed evidence if not proven" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/not-proven-failed-check.json"

mkresult "$T/no-evidence.json" "harness" "proven" "$NO_EVIDENCE_CHECKS"
run_case "gate blocks missing check evidence" 1 "evidence" node "$GATE" "$T/no-evidence.json"

printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
