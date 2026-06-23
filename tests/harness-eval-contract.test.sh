#!/usr/bin/env bash
# /supergoal HARNESS-EVAL contract + gate scenarios.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

PASS=0
FAIL=0
GATE="$ROOT/templates/harness-eval-gate.mjs"

pass() {
  PASS=$((PASS + 1))
  printf ' PASS %-50s\n' "$1"
}

fail() {
  FAIL=$((FAIL + 1))
  printf ' FAIL %-50s %s\n' "$1" "$2"
}

require_file() {
  local label="$1"
  local file="$2"
  if [ -f "$ROOT/$file" ]; then
    pass "$label"
  else
    fail "$label" "$file missing"
  fi
}

require_text() {
  local label="$1"
  local file="$2"
  local text="$3"
  if tr '\n' ' ' < "$ROOT/$file" | grep -Fq "$text"; then
    pass "$label"
  else
    fail "$label" "missing: $text"
  fi
}

run_case() {
  local label="$1"
  local expected="$2"
  local needle="$3"
  shift 3
  local out
  out="$("$@" 2>&1)"
  local status=$?
  if [ "$status" -eq "$expected" ] && printf '%s' "$out" | grep -Fq "$needle"; then
    pass "$label"
  else
    fail "$label" "exit=$status output=$out"
  fi
}

PASS_CHECKS='[
  { "name": "test", "status": "pass", "evidence": "npm test exit=0" },
  { "name": "lint", "status": "pass", "evidence": "npm run lint exit=0" },
  { "name": "build", "status": "pass", "evidence": "npm run build exit=0" }
]'

WEAK_CHECKS='[
  { "name": "test", "status": "pass", "evidence": "npm test exit=0" }
]'

FAILED_CHECKS='[
  { "name": "test", "status": "fail", "evidence": "npm test exit=1" },
  { "name": "lint", "status": "pass", "evidence": "npm run lint exit=0" },
  { "name": "build", "status": "pass", "evidence": "npm run build exit=0" }
]'

NO_EVIDENCE_CHECKS='[
  { "name": "test", "status": "pass", "evidence": "npm test exit=0" },
  { "name": "lint", "status": "pass", "evidence": "npm run lint exit=0" },
  { "name": "build", "status": "pass" }
]'

mkresult() {
  local file="$1"
  local winner="${2:-harness}"
  local checks="${3:-$PASS_CHECKS}"
  local proven="${4:-not_proven}"
  local quality_winner="${5:-harness}"
  local harness_total="${6:-82}"
  local baseline_total="${7:-74}"
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
  "quality": {
    "method": "RevFactory-style 10 dimensions, each 0-10, total 100",
    "baseline": {
      "average_total": $baseline_total,
      "by_case": {
        "case-001": {
          "total": $baseline_total,
          "dimensions": {
            "feature_completeness": { "score": 8 },
            "test_coverage": { "score": 7 },
            "code_quality": { "score": 7 },
            "error_handling": { "score": 7 },
            "efficiency": { "score": 8 },
            "correctness": { "score": 8 },
            "architecture": { "score": 7 },
            "extensibility": { "score": 7 },
            "documentation": { "score": 7 },
            "dev_environment": { "score": 8 }
          }
        }
      }
    },
    "harness": {
      "average_total": $harness_total,
      "by_case": {
        "case-001": {
          "total": $harness_total,
          "dimensions": {
            "feature_completeness": { "score": 9 },
            "test_coverage": { "score": 8 },
            "code_quality": { "score": 8 },
            "error_handling": { "score": 8 },
            "efficiency": { "score": 8 },
            "correctness": { "score": 9 },
            "architecture": { "score": 8 },
            "extensibility": { "score": 8 },
            "documentation": { "score": 8 },
            "dev_environment": { "score": 8 }
          }
        }
      }
    },
    "winner": "$quality_winner"
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
require_file "RevFactory case 001 exists" "templates/harness-eval-cases/revfactory-case-001-rest-api.yaml"
require_file "RevFactory case 002 exists" "templates/harness-eval-cases/revfactory-case-002-bug-fix.yaml"
require_file "RevFactory case 003 exists" "templates/harness-eval-cases/revfactory-case-003-refactoring.yaml"
require_file "RevFactory case 004 exists" "templates/harness-eval-cases/revfactory-case-004-documentation.yaml"
require_file "RevFactory case 005 exists" "templates/harness-eval-cases/revfactory-case-005-complex.yaml"
require_file "RevFactory case 006 exists" "templates/harness-eval-cases/revfactory-case-006-research.yaml"
require_file "RevFactory case 007 exists" "templates/harness-eval-cases/revfactory-case-007-interpreter.yaml"
require_file "RevFactory case 008 exists" "templates/harness-eval-cases/revfactory-case-008-microservice.yaml"
require_file "RevFactory case 009 exists" "templates/harness-eval-cases/revfactory-case-009-sql-engine.yaml"
require_file "RevFactory case 010 exists" "templates/harness-eval-cases/revfactory-case-010-crdt.yaml"
require_file "RevFactory case 011 exists" "templates/harness-eval-cases/revfactory-case-011-raft-kv.yaml"
require_file "RevFactory case 012 exists" "templates/harness-eval-cases/revfactory-case-012-spreadsheet.yaml"
require_file "RevFactory case 013 exists" "templates/harness-eval-cases/revfactory-case-013-bytecode-vm.yaml"
require_file "RevFactory case 014 exists" "templates/harness-eval-cases/revfactory-case-014-event-sourcing.yaml"
require_file "RevFactory case 015 exists" "templates/harness-eval-cases/revfactory-case-015-lsp.yaml"
require_file "harness eval result template exists" "templates/harness-eval-result.json"
require_file "harness eval report template exists" "templates/harness-eval-report.md"
require_text "route hook names HARNESS-EVAL" "SKILL.md" "HARNESS-EVAL"
require_text "route hook points at eval reference" "SKILL.md" "reference/harness-eval.md"
require_text "README states RevFactory case reference" "README.md" "https://github.com/revfactory/claude-code-harness/"
require_text "eval requires same snapshot" "reference/harness-eval.md" "same repo snapshot"
require_text "eval requires blind grading" "reference/harness-eval.md" "blind or label-swapped grading"
require_text "eval requires quality score" "reference/harness-eval.md" "RevFactory-style 100-point quality score"
require_text "eval requires separate adversarial verifier" "reference/harness-eval.md" "separate adversarial verifier"
require_text "eval blocks visible-only verification" "reference/harness-eval.md" "Visible tests only is false-GREEN"
require_text "eval requires verifier-authored tests" "reference/harness-eval.md" "verifier-authored tests"
require_text "report records verification section" "templates/harness-eval-report.md" "## Verification"
require_text "harness-eval pipeline is verifier-loop-free" "reference/harness-eval.md" "Baseline Run -> Harness Run -> Machine Checks"
require_text "eval points at reusable case directory" "reference/harness-eval.md" "templates/harness-eval-cases/"
require_text "eval names ten dimensions" "reference/harness-eval.md" "feature_completeness"
require_text "eval avoids inflated claims" "reference/harness-eval.md" "Not proven"
case_count=$(find "$ROOT/templates/harness-eval-cases" -maxdepth 1 -name 'revfactory-case-*.yaml' | wc -l | tr -d ' ')
all_case_count=$(find "$ROOT/templates/harness-eval-cases" -maxdepth 1 -type f | wc -l | tr -d ' ')
if [ "$case_count" = "15" ] && [ "$all_case_count" = "15" ]; then
  pass "reusable case set is RevFactory-only 15"
else
  fail "reusable case set is RevFactory-only 15" "found revfactory=$case_count all=$all_case_count"
fi
for case_path in "$ROOT"/templates/harness-eval-cases/*.yaml; do
  case_file="${case_path#"$ROOT"/}"
  case_name="${case_file##*/}"
  require_text "$case_name records machine checks" "$case_file" "machine_checks"
  require_text "$case_name records hidden checks" "$case_file" "hidden_checks"
  require_text "$case_name records quality score" "$case_file" "quality_score"
  require_text "$case_name records source URL" "$case_file" "source_url"
  require_text "$case_name records persist path" "$case_file" "persist_path"
done
require_text "eval records bug-catch matrix" "reference/harness-eval.md" "bug-catch matrix"
require_text "eval records false GREEN" "reference/harness-eval.md" "false-GREEN count"
require_text "report records quality score" "templates/harness-eval-report.md" "## Quality Score"
require_text "report records not proven" "templates/harness-eval-report.md" "## Not Proven"
require_text "report records bug-catch matrix" "templates/harness-eval-report.md" "## Bug-Catch Matrix"
require_text "case template records quality score" "templates/harness-eval-case.yaml" "quality_score"

mkresult "$T/ok.json" "harness" "$PASS_CHECKS" "proven" "harness"
run_case "gate accepts complete eval" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/ok.json"

mkresult "$T/bad-claim-status.json" "harness" "$PASS_CHECKS" "maybe" "harness"
run_case "gate blocks unknown claim_status" 1 "claim_status" node "$GATE" "$T/bad-claim-status.json"

mkresult "$T/no-snapshot.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.same_repo_snapshot=false; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-snapshot.json"
run_case "gate blocks different snapshot" 1 "same_repo_snapshot" node "$GATE" "$T/no-snapshot.json"

mkresult "$T/no-blind.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.blind_grading=false; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-blind.json"
run_case "gate blocks non-blind grading" 1 "blind_grading" node "$GATE" "$T/no-blind.json"

mkresult "$T/no-checks.json" "harness" "$WEAK_CHECKS"
run_case "gate blocks weak machine checks" 1 "machine_checks" node "$GATE" "$T/no-checks.json"

mkresult "$T/failed-check.json" "harness" "$FAILED_CHECKS" "proven" "harness"
run_case "gate blocks failed machine check" 1 "status" node "$GATE" "$T/failed-check.json"

mkresult "$T/not-proven-failed-check.json" "not_proven" "$FAILED_CHECKS" "not_proven" "harness"
run_case "gate accepts failed evidence if not proven" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/not-proven-failed-check.json"

mkresult "$T/no-evidence.json" "harness" "$NO_EVIDENCE_CHECKS"
run_case "gate blocks missing check evidence" 1 "evidence" node "$GATE" "$T/no-evidence.json"

mkresult "$T/no-quality.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.quality; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-quality.json"
run_case "gate blocks missing quality score" 1 "quality is required" node "$GATE" "$T/no-quality.json"

mkresult "$T/bad-quality.json" "harness" "$PASS_CHECKS" "not_proven" "harness" "101"
run_case "gate blocks out-of-range quality" 1 "average_total" node "$GATE" "$T/bad-quality.json"

mkresult "$T/bad-case-total.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.quality.harness.by_case['case-001'].total=83; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/bad-case-total.json"
run_case "gate blocks case total/dimension mismatch" 1 "total must equal" node "$GATE" "$T/bad-case-total.json"

mkresult "$T/bad-average-total.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.quality.harness.average_total=81; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/bad-average-total.json"
run_case "gate blocks average_total mismatch" 1 "average_total" node "$GATE" "$T/bad-average-total.json"

mkresult "$T/proven-quality-loss.json" "harness" "$PASS_CHECKS" "proven" "baseline" "70" "82"
run_case "gate blocks proven quality loss" 1 "quality.winner harness" node "$GATE" "$T/proven-quality-loss.json"

printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
