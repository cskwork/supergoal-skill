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
  {
    "name": "test",
    "status": "pass",
    "evidence": "npm test exit=0",
    "verifies": "visible and hidden tests",
    "does_not_verify": "browser smoke",
    "confidence": "high"
  },
  {
    "name": "lint",
    "status": "pass",
    "evidence": "npm run lint exit=0",
    "verifies": "static rules",
    "does_not_verify": "runtime behavior",
    "confidence": "medium"
  },
  {
    "name": "build",
    "status": "pass",
    "evidence": "npm run build exit=0",
    "verifies": "bundle succeeds",
    "does_not_verify": "hidden acceptance",
    "confidence": "medium"
  }
]'

WEAK_CHECKS='[
  {
    "name": "test",
    "status": "pass",
    "evidence": "npm test exit=0",
    "verifies": "visible tests",
    "does_not_verify": "hidden acceptance",
    "confidence": "medium"
  }
]'

FAILED_CHECKS='[
  {
    "name": "test",
    "status": "fail",
    "evidence": "npm test exit=1",
    "verifies": "visible and hidden tests",
    "does_not_verify": "browser smoke",
    "confidence": "high"
  },
  {
    "name": "lint",
    "status": "pass",
    "evidence": "npm run lint exit=0",
    "verifies": "static rules",
    "does_not_verify": "runtime behavior",
    "confidence": "medium"
  },
  {
    "name": "build",
    "status": "pass",
    "evidence": "npm run build exit=0",
    "verifies": "bundle succeeds",
    "does_not_verify": "hidden acceptance",
    "confidence": "medium"
  }
]'

NO_EVIDENCE_CHECKS='[
  {
    "name": "test",
    "status": "pass",
    "evidence": "npm test exit=0",
    "verifies": "visible and hidden tests",
    "does_not_verify": "browser smoke",
    "confidence": "high"
  },
  {
    "name": "lint",
    "status": "pass",
    "evidence": "npm run lint exit=0",
    "verifies": "static rules",
    "does_not_verify": "runtime behavior",
    "confidence": "medium"
  },
  {
    "name": "build",
    "status": "pass",
    "verifies": "bundle succeeds",
    "does_not_verify": "hidden acceptance",
    "confidence": "medium"
  }
]'

NO_SCOPE_CHECKS='[
  {
    "name": "test",
    "status": "pass",
    "evidence": "npm test exit=0",
    "does_not_verify": "browser smoke",
    "confidence": "high"
  },
  {
    "name": "lint",
    "status": "pass",
    "evidence": "npm run lint exit=0",
    "verifies": "static rules",
    "does_not_verify": "runtime behavior",
    "confidence": "medium"
  },
  {
    "name": "build",
    "status": "pass",
    "evidence": "npm run build exit=0",
    "verifies": "bundle succeeds",
    "does_not_verify": "hidden acceptance",
    "confidence": "medium"
  }
]'

mkresult() {
  local file="$1"
  local winner="${2:-harness}"
  local checks="${3:-$PASS_CHECKS}"
  local proven="${4:-not_proven}"
  local quality_winner="${5:-harness}"
  local harness_total="${6:-82}"
  local baseline_total="${7:-74}"
  local mutation_status="not_proven"
  if [ "$winner" = "harness" ] && [ "$proven" = "proven" ]; then
    mutation_status="adopt"
  elif [ "$winner" = "harness" ]; then
    mutation_status="revise"
  elif [ "$winner" = "baseline" ]; then
    mutation_status="reject"
  fi
  cat > "$file" <<EOF
{
  "case_id": "case-001",
  "runtime_adapter": "codex",
  "same_repo_snapshot": true,
  "isolated_worktrees": true,
  "eval_intent": {
    "goal": "increase hidden requirement coverage",
    "constraints": ["preserve the same repo snapshot"],
    "tradeoffs": ["extra verification cost is acceptable only if correctness improves"],
    "rejected_approaches": ["self-reported success as evidence"]
  },
  "command_manifest": [
    {
      "name": "test",
      "command": "npm test",
      "source": "frozen_repo",
      "used_by": "both",
      "verifies": "visible and hidden tests"
    },
    {
      "name": "lint",
      "command": "npm run lint",
      "source": "frozen_repo",
      "used_by": "both",
      "verifies": "static rules"
    },
    {
      "name": "build",
      "command": "npm run build",
      "source": "frozen_repo",
      "used_by": "both",
      "verifies": "bundle succeeds"
    }
  ],
  "decision_gates": [
    {
      "id": "r1",
      "action": "auto-fix",
      "status": "resolved",
      "description": "mechanical fix",
      "recheck": "npm test exit=0"
    },
    {
      "id": "n1",
      "action": "no-op",
      "status": "accepted",
      "description": "informational finding"
    }
  ],
  "adapter_fixture_replay": {
    "status": "not_required",
    "adapter_event_schema": "codex-exec-jsonl",
    "fixtures": [],
    "redaction": "not required",
    "replay_command": "not required"
  },
  "surface_sync": {
    "changed_surfaces": ["reference/harness-eval.md", "templates/harness-eval-gate.mjs"],
    "proof_commands": ["bash tests/harness-eval-contract.test.sh"]
  },
  "baseline": {
    "condition": "without_harness",
    "machine_checks": $checks,
    "cost": { "tokens": 1000, "duration_ms": 1000, "tool_calls": 10 },
    "telemetry": {
      "artifact_root": "docs/changelog/test-baseline",
      "logs": ["raw/baseline.log"],
      "commands": ["npm test", "npm run lint", "npm run build"],
      "edited_files": ["src/example.js"],
      "permissions_or_approvals": [],
      "turns_completed": 1,
      "exit_code": 0,
      "crashed": false,
      "context_exhausted": false
    }
  },
  "harness": {
    "condition": "with_harness",
    "machine_checks": $checks,
    "cost": { "tokens": 1200, "duration_ms": 1400, "tool_calls": 12 },
    "telemetry": {
      "artifact_root": "docs/changelog/test-harness",
      "logs": ["raw/harness.log"],
      "commands": ["npm test", "npm run lint", "npm run build"],
      "edited_files": ["src/example.js"],
      "permissions_or_approvals": [],
      "turns_completed": 1,
      "exit_code": 0,
      "crashed": false,
      "context_exhausted": false
    }
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
  "harness_mutation_contract": {
    "status": "$mutation_status",
    "intended_delta": "increase hidden requirement coverage",
    "safety_envelope": "no product code edits by the evaluator",
    "rollback": "restore previous harness contract",
    "proof_command": "node templates/harness-eval-gate.mjs result.json",
    "rejected_alternatives": ["prose-only guidance lacks a machine gate"]
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
require_file "harness eval fixture README exists" "templates/harness-eval-cases/fixtures/README.md"
require_file "harness eval result template exists" "templates/harness-eval-result.json"
require_file "harness eval report template exists" "templates/harness-eval-report.md"
require_file "harness eval runner template exists" "templates/harness-eval-runner.mjs"
require_text "route hook names HARNESS-EVAL" "SKILL.md" "HARNESS-EVAL"
require_text "route hook points at eval reference" "SKILL.md" "reference/harness-eval.md"
require_text "route hook catches skill-lift use case" "SKILL.md" "measure skill lift"
require_text "route hook names the reusable runner" "SKILL.md" "templates/harness-eval-runner.mjs"
require_text "route hook marks runner as default driver" "SKILL.md" "DEFAULT portable eval driver"
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
require_text "eval requires scoped evidence bundle" "reference/harness-eval.md" "scoped evidence bundle"
require_text "eval requires trajectory telemetry" "reference/harness-eval.md" "replayable trajectory telemetry"
require_text "eval requires mutation contract" "reference/harness-eval.md" "harness mutation contract"
require_text "eval requires explicit intent" "reference/harness-eval.md" "explicit eval intent"
require_text "eval requires command manifest" "reference/harness-eval.md" "deterministic command manifest"
require_text "eval requires decision gate ledger" "reference/harness-eval.md" "decision-gate ledger"
require_text "eval requires adapter fixture replay" "reference/harness-eval.md" "adapter fixture replay"
require_text "eval records current fixtures" "reference/harness-eval.md" "templates/harness-eval-cases/fixtures/"
require_text "eval defines default coding A/B pair" "reference/harness-eval.md" "Default coding A/B pair"
require_text "eval defaults async race first" "reference/harness-eval.md" "revfactory-case-002-async-race/"
require_text "eval defaults refactoring second" "reference/harness-eval.md" "revfactory-case-003-refactoring/"
require_text "eval rejects underspec default substitution" "reference/harness-eval.md" 'Do not substitute `underspec-001-deepmerge/`'
require_text "eval records default tie as not proven" "reference/harness-eval.md" 'If both default cases tie, report `Not proven`'
require_text "eval requires runtime preflight + fallback" "reference/harness-eval.md" "pick the runtime adapter by PREFLIGHTING it on the host"
require_text "eval cites reusable runner template" "reference/harness-eval.md" "templates/harness-eval-runner.mjs"
require_text "eval scope selects adapter by preflight" "reference/harness-eval.md" 'Select `runtime_adapter` by PREFLIGHT'
require_text "eval sets n>=6 significance floor" "reference/harness-eval.md" "n >= 6 per arm"
require_text "eval justifies n>=6 with permutation min-p" "reference/harness-eval.md" "2/2^n"
require_text "eval serializes nested passes by default" "reference/harness-eval.md" "serialize nested agent passes by default"
require_text "eval retries transient crashes" "reference/harness-eval.md" "Retry a transient (rate-limit) crash with"
require_text "eval requires shipped role fidelity" "reference/harness-eval.md" "shipped skill role files"
require_text "eval references role-loop for fidelity" "reference/harness-eval.md" "reference/role-loop.md"
require_text "report records evidence bundle" "templates/harness-eval-report.md" "## Evidence Bundle"
require_text "report records trajectory telemetry" "templates/harness-eval-report.md" "## Trajectory Telemetry"
require_text "report records mutation contract" "templates/harness-eval-report.md" "## Harness Mutation Contract"
require_text "report records case selection" "templates/harness-eval-report.md" "## Case Selection"
require_text "report records default coding pair" "templates/harness-eval-report.md" "Default coding A/B pair"
require_text "report records eval intent" "templates/harness-eval-report.md" "## Eval Intent"
require_text "report records command manifest" "templates/harness-eval-report.md" "## Command Manifest"
require_text "report records decision gates" "templates/harness-eval-report.md" "## Decision Gates"
require_text "report records adapter fixture replay" "templates/harness-eval-report.md" "## Adapter Fixture Replay"
require_text "report records surface sync" "templates/harness-eval-report.md" "## Surface Sync"
require_text "report records quality score" "templates/harness-eval-report.md" "## Quality Score"
require_text "report records not proven" "templates/harness-eval-report.md" "## Not Proven"
require_text "report records bug-catch matrix" "templates/harness-eval-report.md" "## Bug-Catch Matrix"
require_text "case template records quality score" "templates/harness-eval-case.yaml" "quality_score"
require_text "case template records eval intent" "templates/harness-eval-case.yaml" "eval_intent"
require_text "case template records command manifest" "templates/harness-eval-case.yaml" "command_manifest"
require_text "case template records decision gates" "templates/harness-eval-case.yaml" "decision_gates"
require_text "case template records adapter fixture replay" "templates/harness-eval-case.yaml" "adapter_fixture_replay"
require_text "case template records default coding pair" "templates/harness-eval-case.yaml" "default_coding_ab"
require_text "result template records default coding pair" "templates/harness-eval-result.json" "default_coding_ab"

mkresult "$T/ok.json" "harness" "$PASS_CHECKS" "proven" "harness"
run_case "gate accepts complete eval" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/ok.json"

mkresult "$T/bad-claim-status.json" "harness" "$PASS_CHECKS" "maybe" "harness"
run_case "gate blocks unknown claim_status" 1 "claim_status" node "$GATE" "$T/bad-claim-status.json"

mkresult "$T/no-snapshot.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.same_repo_snapshot=false; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-snapshot.json"
run_case "gate blocks different snapshot" 1 "same_repo_snapshot" node "$GATE" "$T/no-snapshot.json"

mkresult "$T/no-intent.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.eval_intent; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-intent.json"
run_case "gate blocks missing eval intent" 1 "eval_intent" node "$GATE" "$T/no-intent.json"

mkresult "$T/no-command-manifest.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.command_manifest; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-command-manifest.json"
run_case "gate blocks missing command manifest" 1 "command_manifest" node "$GATE" "$T/no-command-manifest.json"

mkresult "$T/arm-detected-only.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.command_manifest.forEach((c)=>{c.source='arm_detected'}); fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/arm-detected-only.json"
run_case "gate blocks proven arm-detected-only commands" 1 "trusted baseline command" node "$GATE" "$T/arm-detected-only.json"

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

mkresult "$T/no-scope.json" "harness" "$NO_SCOPE_CHECKS"
run_case "gate blocks missing check scope" 1 "verifies" node "$GATE" "$T/no-scope.json"

mkresult "$T/bad-confidence.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.harness.machine_checks[0].confidence='certain'; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/bad-confidence.json"
run_case "gate blocks unknown confidence" 1 "confidence" node "$GATE" "$T/bad-confidence.json"

mkresult "$T/no-telemetry.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.harness.telemetry; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-telemetry.json"
run_case "gate blocks missing telemetry" 1 "telemetry" node "$GATE" "$T/no-telemetry.json"

mkresult "$T/unresolved-ask-user.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.decision_gates=[{id:'u1', action:'ask-user', status:'unresolved', description:'changes product behavior', human_decision:'pending'}]; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/unresolved-ask-user.json"
run_case "gate blocks unresolved ask-user decision" 1 "ask-user finding" node "$GATE" "$T/unresolved-ask-user.json"

mkresult "$T/no-adapter-replay.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.adapter_fixture_replay; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-adapter-replay.json"
run_case "gate blocks missing adapter replay" 1 "adapter_fixture_replay" node "$GATE" "$T/no-adapter-replay.json"

mkresult "$T/no-surface-sync.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.surface_sync; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-surface-sync.json"
run_case "gate blocks missing surface sync" 1 "surface_sync" node "$GATE" "$T/no-surface-sync.json"

mkresult "$T/proven-crash.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.harness.telemetry.crashed=true; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-crash.json"
run_case "gate blocks proven crash" 1 "crashed" node "$GATE" "$T/proven-crash.json"

mkresult "$T/no-mutation-contract.json"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.harness_mutation_contract; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/no-mutation-contract.json"
run_case "gate blocks missing mutation contract" 1 "harness_mutation_contract" node "$GATE" "$T/no-mutation-contract.json"

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
