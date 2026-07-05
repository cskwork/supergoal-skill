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
  "runtime_preflight": {
    "host_os": "linux",
    "preferred_adapter": "codex-exec",
    "chosen_adapter": "codex-exec",
    "preflights": {
      "codex-exec": { "available": true, "ok": true, "reason": "edit ok, tests pass" }
    }
  },
  "role_source": "shipped_files",
  "statistics": {
    "seeds_per_arm": 6,
    "winning_comparison": "harness-vs-baseline",
    "bca_ci_95": [0.4, 2.6],
    "permutation_p": 0.03125,
    "significant": true,
    "seed_outcomes": [
      { "arm": "baseline", "seed": 0, "crashed": false, "recorded_loss": false },
      { "arm": "baseline", "seed": 1, "crashed": false, "recorded_loss": false },
      { "arm": "baseline", "seed": 2, "crashed": false, "recorded_loss": false },
      { "arm": "baseline", "seed": 3, "crashed": false, "recorded_loss": false },
      { "arm": "baseline", "seed": 4, "crashed": false, "recorded_loss": false },
      { "arm": "baseline", "seed": 5, "crashed": false, "recorded_loss": false },
      { "arm": "harness", "seed": 0, "crashed": false, "recorded_loss": false },
      { "arm": "harness", "seed": 1, "crashed": false, "recorded_loss": false },
      { "arm": "harness", "seed": 2, "crashed": false, "recorded_loss": false },
      { "arm": "harness", "seed": 3, "crashed": false, "recorded_loss": false },
      { "arm": "harness", "seed": 4, "crashed": false, "recorded_loss": false },
      { "arm": "harness", "seed": 5, "crashed": false, "recorded_loss": false }
    ],
    "mcnemar": {
      "discordant_baseline_only": 1,
      "discordant_harness_only": 5,
      "p": 0.03125,
      "significant": true
    },
    "snr_filter": {
      "matched_removed": 8,
      "discordant_kept": 6,
      "rule": "remove no-signal matched pass/pass and fail/fail pairs before McNemar"
    }
  },
  "axis_metrics": {
    "correctness": {
      "metric": "paired pass/fail plus quality score",
      "baseline": 0.7,
      "harness": 0.9,
      "delta": 0.2
    },
    "token_cost": {
      "metric": "total_tokens per invocation",
      "baseline": 1000,
      "harness": 1200,
      "delta": 200,
      "source": "adapter telemetry"
    },
    "wall_clock": {
      "metric": "duration_ms per invocation",
      "baseline": 1000,
      "harness": 1400,
      "delta": 400,
      "source": "adapter telemetry"
    },
    "routing_accuracy": {
      "metric": "held-out trigger accuracy",
      "baseline": 0.65,
      "harness": 0.85,
      "delta": 0.2
    }
  },
  "routing_accuracy": {
    "applies": true,
    "prompt_count": 20,
    "trials_per_prompt": 3,
    "train_test_split": "60/40",
    "should_trigger_rate": 0.9,
    "should_not_trigger_rate": 0.8,
    "heldout_accuracy": 0.85,
    "near_miss_failures": ["route-017"],
    "artifact": "routing/routing-probe.json"
  },
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
require_file "harness eval stats helper exists" "templates/harness-eval-stats.mjs"
require_file "DeepSWE external README exists" "templates/harness-eval-external/deepswe/README.md"
require_file "DeepSWE external task set exists" "templates/harness-eval-external/deepswe/task-set.yaml"
require_file "DeepSWE harness arm preparer exists" "templates/harness-eval-external/deepswe/prepare-supergoal-arm.mjs"
require_file "DeepSWE full-cycle runner exists" "templates/harness-eval-external/deepswe/run-full-cycle.mjs"
require_file "DeepSWE default suite runner exists" "templates/harness-eval-external/deepswe/run-default-suite.mjs"
require_file "authz cache fixture package exists" "templates/harness-eval-cases/fixtures/underspec-003-authz-cache/package.json"
require_file "authz cache fixture source exists" "templates/harness-eval-cases/fixtures/underspec-003-authz-cache/src/authorizer.mjs"
require_file "authz cache visible tests exist" "templates/harness-eval-cases/fixtures/underspec-003-authz-cache/test/authorizer.visible.test.mjs"
require_file "authz cache hidden tests exist" "templates/harness-eval-cases/fixtures/underspec-003-authz-cache/test/authorizer.hidden.test.mjs"
require_file "authz cache authored spec exists" "templates/harness-eval-cases/authored/authored-underspec-003-authz-cache.yaml"
require_text "route hook names HARNESS-EVAL" "SKILL.md" "HARNESS-EVAL"
require_text "route hook points at eval reference" "SKILL.md" "reference/harness-eval.md"
require_text "route hook catches skill-lift use case" "SKILL.md" "measure skill lift"
require_text "route hook names the reusable runner" "SKILL.md" "templates/harness-eval-runner.mjs"
require_text "route hook marks runner as default driver" "SKILL.md" "DEFAULT portable eval driver"
require_text "route hook names DeepSWE forced suite" "SKILL.md" "forced three-task DeepSWE suite"
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
require_text "eval records authz low-effort fixture" "reference/harness-eval.md" "underspec-003-authz-cache/"
require_text "eval records u3 low effort command" "reference/harness-eval.md" "SG_EVAL_CASE=u3 SG_EVAL_EFFORT=low"
require_text "eval defines default coding A/B pair" "reference/harness-eval.md" "Default coding A/B pair"
require_text "eval defaults async race first" "reference/harness-eval.md" "revfactory-case-002-async-race/"
require_text "eval defaults refactoring second" "reference/harness-eval.md" "revfactory-case-003-refactoring/"
require_text "eval rejects underspec default substitution" "reference/harness-eval.md" 'Do not substitute `underspec-001-deepmerge/`'
require_text "eval excludes authz from default pair" "reference/harness-eval.md" '`underspec-003-authz-cache/` for this default'
require_text "eval records default tie as not proven" "reference/harness-eval.md" 'If both default cases tie, report `Not proven`'
require_text "eval requires runtime preflight + fallback" "reference/harness-eval.md" "pick the runtime adapter by PREFLIGHTING it on the host"
require_text "eval cites reusable runner template" "reference/harness-eval.md" "templates/harness-eval-runner.mjs"
require_text "eval scope selects adapter by preflight" "reference/harness-eval.md" 'Select `runtime_adapter` by PREFLIGHT'
require_text "eval sets n>=6 significance floor" "reference/harness-eval.md" "n >= 6 per arm"
require_text "eval justifies n>=6 with permutation min-p" "reference/harness-eval.md" "2/2^n"
require_text "eval requires four-axis accounting" "reference/harness-eval.md" "four-axis accounting"
require_text "eval requires routing probe" "reference/harness-eval.md" "should-trigger / should-not-trigger"
require_text "eval requires McNemar" "reference/harness-eval.md" "paired McNemar"
require_text "eval defaults harness arm to improve core" "reference/harness-eval.md" "Build -> Improve full spec -> Improve edge cases -> Final Verify"
require_text "eval keeps critic loop explicit" "reference/harness-eval.md" "experiment is explicitly testing the surface-hidden-requirements lever"
require_text "eval rejects overlapping CI winner gate" "reference/harness-eval.md" "overlapping confidence intervals"
require_text "eval defaults public scoring to etree" "reference/harness-eval.md" "Default public scoring candidate"
require_text "eval names etree default task" "reference/harness-eval.md" "etree-xml-diff-patch"
require_text "eval demotes Happy DOM to smoke" "reference/harness-eval.md" "smoke/reliability only"
require_text "eval requires predeclared stop policy" "reference/harness-eval.md" "stop policy is declared before launch"
require_text "eval invalidates manual interrupts" "reference/harness-eval.md" "manual interruption is invalid"
require_text "eval points at DeepSWE full-cycle runner" "reference/harness-eval.md" "run-full-cycle.mjs"
require_text "eval forces default DeepSWE suite" "reference/harness-eval.md" "Forced default public SWE suite"
require_text "eval names DeepSWE suite runner" "reference/harness-eval.md" "run-default-suite.mjs"
require_text "eval names cliffy suite task" "reference/harness-eval.md" "cliffy-config-file-parsing"
require_text "eval names yjs suite task" "reference/harness-eval.md" "yjs-map-conflict-detection"
require_text "eval records no-headroom DeepSWE outcome" "reference/harness-eval.md" "not_proven_no_headroom"
require_text "eval serializes nested passes by default" "reference/harness-eval.md" "serialize nested agent passes by default"
require_text "eval retries transient crashes" "reference/harness-eval.md" "Retry a transient (rate-limit) crash with"
require_text "eval requires shipped role fidelity" "reference/harness-eval.md" "shipped skill role files"
require_text "eval references role-loop for fidelity" "reference/harness-eval.md" "reference/role-loop.md"
require_text "report records evidence bundle" "templates/harness-eval-report.md" "## Evidence Bundle"
require_text "report records trajectory telemetry" "templates/harness-eval-report.md" "## Trajectory Telemetry"
require_text "report records mutation contract" "templates/harness-eval-report.md" "## Harness Mutation Contract"
require_text "report records case selection" "templates/harness-eval-report.md" "## Case Selection"
require_text "report records default coding pair" "templates/harness-eval-report.md" "Default coding A/B pair"
require_text "report records u3 discriminator" "templates/harness-eval-report.md" "SG_EVAL_CASE=u3"
require_text "report records eval intent" "templates/harness-eval-report.md" "## Eval Intent"
require_text "report records command manifest" "templates/harness-eval-report.md" "## Command Manifest"
require_text "report records decision gates" "templates/harness-eval-report.md" "## Decision Gates"
require_text "report records adapter fixture replay" "templates/harness-eval-report.md" "## Adapter Fixture Replay"
require_text "report records surface sync" "templates/harness-eval-report.md" "## Surface Sync"
require_text "report records quality score" "templates/harness-eval-report.md" "## Quality Score"
require_text "report records four-axis metrics" "templates/harness-eval-report.md" "## Four-Axis Metrics"
require_text "report records routing accuracy" "templates/harness-eval-report.md" "## Routing Accuracy"
require_text "report records statistics" "templates/harness-eval-report.md" "## Statistics"
require_text "report rejects overlapping CI gate" "templates/harness-eval-report.md" "overlapping confidence intervals"
require_text "report records not proven" "templates/harness-eval-report.md" "## Not Proven"
require_text "report records bug-catch matrix" "templates/harness-eval-report.md" "## Bug-Catch Matrix"
require_text "case template records quality score" "templates/harness-eval-case.yaml" "quality_score"
require_text "case template records eval intent" "templates/harness-eval-case.yaml" "eval_intent"
require_text "case template records command manifest" "templates/harness-eval-case.yaml" "command_manifest"
require_text "case template records decision gates" "templates/harness-eval-case.yaml" "decision_gates"
require_text "case template records adapter fixture replay" "templates/harness-eval-case.yaml" "adapter_fixture_replay"
require_text "case template records default coding pair" "templates/harness-eval-case.yaml" "default_coding_ab"
require_text "case template excludes u3 from default pair" "templates/harness-eval-case.yaml" "underspec-003-authz-cache/"
require_text "case template records routing probe" "templates/harness-eval-case.yaml" "routing_probe"
require_text "case template records duration metric" "templates/harness-eval-case.yaml" "duration_ms"
require_text "case template defaults external task to etree" "templates/harness-eval-case.yaml" "etree-xml-diff-patch"
require_text "case template records external stop policy" "templates/harness-eval-case.yaml" "manual_interrupt: invalid_paired_correctness"
require_text "result template records default coding pair" "templates/harness-eval-result.json" "default_coding_ab"
require_text "result template excludes u3 from default pair" "templates/harness-eval-result.json" "underspec-003-authz-cache/"
require_text "result template defaults external task to etree" "templates/harness-eval-result.json" "etree-xml-diff-patch"
require_text "result template records external stop policy" "templates/harness-eval-result.json" "invalid_paired_correctness"
require_text "result template records axis metrics" "templates/harness-eval-result.json" "axis_metrics"
require_text "result template records routing accuracy" "templates/harness-eval-result.json" "routing_accuracy"
require_text "result template records runtime preflight" "templates/harness-eval-result.json" "runtime_preflight"
require_text "result template records chosen adapter" "templates/harness-eval-result.json" "chosen_adapter"
require_text "result template records role source" "templates/harness-eval-result.json" "role_source"
require_text "result template records seeds per arm" "templates/harness-eval-result.json" "seeds_per_arm"
require_text "result template records significance evidence" "templates/harness-eval-result.json" "permutation_p"
require_text "result template records McNemar" "templates/harness-eval-result.json" "mcnemar"
require_text "result template records SNR filter" "templates/harness-eval-result.json" "snr_filter"
require_text "result template records crash accounting" "templates/harness-eval-result.json" "recorded_loss"
require_text "stats helper exports paired binary stats" "templates/harness-eval-stats.mjs" "pairedBinaryStats"
require_text "runner example uses improve core" "templates/harness-eval-runner.mjs" "Improve full spec -> Improve edge cases -> Final Verify"
require_text "runner keeps critic as explicit lever" "templates/harness-eval-runner.mjs" "surface-hidden-requirements lever"
require_text "DeepSWE README defaults etree scoring" "templates/harness-eval-external/deepswe/README.md" 'Primary scoring task: `etree-xml-diff-patch`'
require_text "DeepSWE README forces default suite" "templates/harness-eval-external/deepswe/README.md" "Forced Default Suite"
require_text "DeepSWE README documents suite runner" "templates/harness-eval-external/deepswe/README.md" "run-default-suite.mjs"
require_text "DeepSWE README keeps Happy DOM smoke only" "templates/harness-eval-external/deepswe/README.md" 'Smoke task: `happy-dom-abort-pending-body-reads`'
require_text "DeepSWE README rejects manual interrupt" "templates/harness-eval-external/deepswe/README.md" "Manual post-hoc interruption invalidates paired"
require_text "DeepSWE README documents full-cycle runner" "templates/harness-eval-external/deepswe/README.md" "run-full-cycle.mjs"
require_text "DeepSWE README records no-headroom result" "templates/harness-eval-external/deepswe/README.md" "not_proven_no_headroom"
require_text "DeepSWE manifest records scoring default task" "templates/harness-eval-external/deepswe/task-set.yaml" "default_task_id: etree-xml-diff-patch"
require_text "DeepSWE manifest records forced suite id" "templates/harness-eval-external/deepswe/task-set.yaml" "default_forced_suite_id: forced-default-deepswe-difficult-swe"
require_text "DeepSWE manifest records cliffy suite task" "templates/harness-eval-external/deepswe/task-set.yaml" "cliffy-config-file-parsing"
require_text "DeepSWE manifest records yjs suite task" "templates/harness-eval-external/deepswe/task-set.yaml" "yjs-map-conflict-detection"
require_text "DeepSWE manifest records smoke task" "templates/harness-eval-external/deepswe/task-set.yaml" "smoke_task_id: happy-dom-abort-pending-body-reads"
require_text "DeepSWE manifest records stop policy" "templates/harness-eval-external/deepswe/task-set.yaml" "manual_interrupt: invalid_paired_correctness"
require_text "DeepSWE manifest records no-headroom decision" "templates/harness-eval-external/deepswe/task-set.yaml" "not_proven_no_headroom"
require_text "DeepSWE manifest records full-cycle command" "templates/harness-eval-external/deepswe/task-set.yaml" "full_cycle_runner"
require_text "DeepSWE manifest records suite command" "templates/harness-eval-external/deepswe/task-set.yaml" "default_forced_suite_runner"
require_text "DeepSWE manifest records low reasoning default" "templates/harness-eval-external/deepswe/task-set.yaml" "reasoning-effort low"
require_text "DeepSWE manifest records Codex auth mode" "templates/harness-eval-external/deepswe/task-set.yaml" "codex-auth-json auto"
require_text "DeepSWE preparer explains patch scoring" "templates/harness-eval-external/deepswe/prepare-supergoal-arm.mjs" "The evaluator grades the repository patch"
require_text "DeepSWE preparer asks for commit" "templates/harness-eval-external/deepswe/prepare-supergoal-arm.mjs" "Commit the final code changes"
require_text "DeepSWE runner records manual interrupt policy" "templates/harness-eval-external/deepswe/run-full-cycle.mjs" "invalid_paired_correctness"
require_text "DeepSWE runner records runner timeout" "templates/harness-eval-external/deepswe/run-full-cycle.mjs" "runner_timeout"
require_text "DeepSWE runner classifies no-headroom ties" "templates/harness-eval-external/deepswe/run-full-cycle.mjs" "not_proven_no_headroom"
require_text "DeepSWE runner records baseline headroom" "templates/harness-eval-external/deepswe/run-full-cycle.mjs" "baseline_perfect"
require_text "DeepSWE runner sets Codex low reasoning" "templates/harness-eval-external/deepswe/run-full-cycle.mjs" "SG_DEEPSWE_REASONING_EFFORT || \"low\""
require_text "DeepSWE runner can force Codex auth json" "templates/harness-eval-external/deepswe/run-full-cycle.mjs" "CODEX_FORCE_AUTH_JSON=1"
require_text "DeepSWE runner allowlists Codex auth transport" "templates/harness-eval-external/deepswe/run-full-cycle.mjs" "https://chatgpt.com"
require_text "DeepSWE suite runner owns task selection" "templates/harness-eval-external/deepswe/run-default-suite.mjs" "run-default-suite owns task selection"
require_text "DeepSWE suite runner writes suite summary" "templates/harness-eval-external/deepswe/run-default-suite.mjs" "suite-summary.json"
require_text "DeepSWE suite runner records dry run" "templates/harness-eval-external/deepswe/run-default-suite.mjs" "dry_run"

mkresult "$T/ok.json" "harness" "$PASS_CHECKS" "proven" "harness"
run_case "gate accepts complete eval" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/ok.json"

cat > "$T/pairs.json" <<'EOF'
[
  { "case_id": "a", "baseline_pass": true, "harness_pass": true },
  { "case_id": "b", "baseline_pass": true, "harness_pass": false },
  { "case_id": "c", "baseline_pass": false, "harness_pass": true },
  { "case_id": "d", "baseline_pass": false, "harness_pass": true }
]
EOF
run_case "stats helper emits McNemar table" 0 "discordant_harness_only" node "$ROOT/templates/harness-eval-stats.mjs" "$T/pairs.json"

run_case "u3 fixture discriminates starter/reference/lazy" 0 "reference:" env SG_EVAL_VALIDATE=1 SG_EVAL_CASE=u3 SG_EVAL_RUN_ROOT="$T/u3-validate" node "$ROOT/docs/experiments/2026-06-07-harness-eval-medium-hard-skill-vs-baseline/run.mjs"

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

# --- recurrence-prevention rules: enforced ONLY for a proven claim ---
mkresult "$T/compliant-proven.json" "harness" "$PASS_CHECKS" "proven" "harness"
run_case "gate accepts fully-compliant proven result" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/compliant-proven.json"

mkresult "$T/directional-n3.json" "not_proven" "$PASS_CHECKS" "not_proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.statistics.seeds_per_arm=3; delete x.runtime_preflight; x.role_source='paraphrase'; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/directional-n3.json"
run_case "gate accepts not-proven directional n=3" 0 "HARNESS-EVAL PASS" node "$GATE" "$T/directional-n3.json"

mkresult "$T/proven-seeds-lt6.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.statistics.seeds_per_arm=3; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-seeds-lt6.json"
run_case "gate blocks proven claim with n<6 per arm" 1 "n>=6 per arm" node "$GATE" "$T/proven-seeds-lt6.json"

mkresult "$T/proven-ci-touches-zero.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.statistics.bca_ci_95=[-0.1, 2.0]; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-ci-touches-zero.json"
run_case "gate blocks proven CI not entirely above zero" 1 "entirely > 0" node "$GATE" "$T/proven-ci-touches-zero.json"

mkresult "$T/proven-p-not-sig.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.statistics.permutation_p=0.2; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-p-not-sig.json"
run_case "gate blocks proven permutation p not significant" 1 "permutation p < 0.05" node "$GATE" "$T/proven-p-not-sig.json"

mkresult "$T/proven-no-mcnemar.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.statistics.mcnemar; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-no-mcnemar.json"
run_case "gate blocks proven claim without McNemar" 1 "statistics.mcnemar" node "$GATE" "$T/proven-no-mcnemar.json"

mkresult "$T/proven-mcnemar-not-sig.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.statistics.mcnemar.p=0.2; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-mcnemar-not-sig.json"
run_case "gate blocks proven McNemar p not significant" 1 "McNemar p < 0.05" node "$GATE" "$T/proven-mcnemar-not-sig.json"

mkresult "$T/proven-no-snr.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.statistics.snr_filter; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-no-snr.json"
run_case "gate blocks proven claim without SNR filter" 1 "statistics.snr_filter" node "$GATE" "$T/proven-no-snr.json"

mkresult "$T/proven-no-preflight.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.runtime_preflight; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-no-preflight.json"
run_case "gate blocks proven claim without preflight" 1 "runtime_preflight" node "$GATE" "$T/proven-no-preflight.json"

mkresult "$T/proven-no-chosen-adapter.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.runtime_preflight.chosen_adapter; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-no-chosen-adapter.json"
run_case "gate blocks proven claim without chosen adapter" 1 "chosen_adapter" node "$GATE" "$T/proven-no-chosen-adapter.json"

mkresult "$T/proven-adapter-not-preflighted.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.runtime_preflight.preflights={}; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-adapter-not-preflighted.json"
run_case "gate blocks proven chosen adapter not preflighted" 1 "was preflighted" node "$GATE" "$T/proven-adapter-not-preflighted.json"

mkresult "$T/proven-paraphrase-roles.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.role_source='paraphrase'; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-paraphrase-roles.json"
run_case "gate blocks proven claim with paraphrased roles" 1 "role_source" node "$GATE" "$T/proven-paraphrase-roles.json"

mkresult "$T/proven-roles-absent.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.role_source; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-roles-absent.json"
run_case "gate blocks proven claim with absent role source" 1 "role_source" node "$GATE" "$T/proven-roles-absent.json"

mkresult "$T/proven-crashed-seed.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.statistics.seed_outcomes[0].crashed=true; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-crashed-seed.json"
run_case "gate blocks proven crashed seed not marked loss" 1 "recorded as a loss" node "$GATE" "$T/proven-crashed-seed.json"

mkresult "$T/proven-no-axis.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.axis_metrics; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-no-axis.json"
run_case "gate blocks proven claim without four axes" 1 "axis_metrics" node "$GATE" "$T/proven-no-axis.json"

mkresult "$T/proven-no-routing.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); delete x.routing_accuracy; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-no-routing.json"
run_case "gate blocks proven claim without routing accuracy" 1 "routing_accuracy" node "$GATE" "$T/proven-no-routing.json"

mkresult "$T/proven-routing-small.json" "harness" "$PASS_CHECKS" "proven" "harness"
node -e "const fs=require('fs'); const p=process.argv[1]; const x=require(p); x.routing_accuracy.prompt_count=12; fs.writeFileSync(p, JSON.stringify(x, null, 2));" "$T/proven-routing-small.json"
run_case "gate blocks undersized routing probe" 1 "prompt_count" node "$GATE" "$T/proven-routing-small.json"

printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
