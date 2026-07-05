#!/usr/bin/env bash
# /supergoal ROLE-LOOP contract.
# Fails if the critic stops recording surfaced (implicit) requirements as a durable
# markdown trail, or the verifier stops closing them out.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing file: %s\n' "$file"
  fi
}

echo "=================================================================="
echo " /supergoal ROLE-LOOP contract   skill: $ROOT"
echo "=================================================================="

# Critic records surfaced requirements to a durable markdown doc in the run vault.
require_text "critic records surfaced requirements as markdown" "reference/role-loop.md" 'docs/changelog/<YYYY-MM>/<DD-topic>/surfaced-requirements.md'
require_text "record explains why a requirement is implied" "reference/role-loop.md" "why it is required though the prompt never stated it"
require_text "record links the covering failing test" "reference/role-loop.md" "the failing test that now covers it"
require_text "record entries start open" "reference/role-loop.md" "status: open"
require_text "critic classifies inferred requirements" "reference/role-loop.md" 'classify each candidate as `must`, `should`, or `ask-user`'
require_text "critic only tests must requirements" "reference/role-loop.md" 'Only `must` requirements'
require_text "critic does not invent stricter semantics" "reference/role-loop.md" "Do not turn silence into stricter semantics"
require_text "fixer blocks ask-user generated tests" "reference/role-loop.md" "stop and report the decision gate"

# Verifier closes them out.
require_text "verifier marks surfaced requirements fixed" "reference/role-loop.md" "mark each surfaced requirement fixed"

# SKILL.md surfaces the route; reference/role-loop.md owns the detailed behavior.
require_text "SKILL names equal-compute improve loop" "SKILL.md" "Build -> Improve full spec -> Improve edge cases -> Final Verify"
require_text "role-loop critic step logs surfaced requirements" "reference/role-loop.md" 'run vault'\''s `surfaced-requirements.md`'
require_text "role-loop keeps production ambiguity as ask-user" "reference/role-loop.md" "production/source-code domain ambiguity"
require_text "role-loop allows conservative no-user default" "reference/role-loop.md" "conservative, reversible default"
require_text "role-loop names mandatory improve passes" "reference/role-loop.md" "Build -> Improve full spec -> Improve edge cases -> Final Verify"
require_text "role-loop excludes critic from default loop" "reference/role-loop.md" "Critic/Fixer is not part of the default loop"
require_text "SKILL excludes critic from default loop" "SKILL.md" "Critic/Fixer is not part of the default loop"
require_text "role-loop dispatches fresh-context roles" "reference/role-loop.md" "fresh-context subagent"
require_text "SKILL requires separate builder subagent" "SKILL.md" "Non-trivial implementation runs in a separate fresh-context builder subagent"
require_text "role-loop requires separate builder subagent" "reference/role-loop.md" "separate fresh-context builder subagent"
require_text "SKILL requires mandatory adversarial review" "SKILL.md" "Mandatory Adversarial Review"
require_text "role-loop requires mandatory adversarial review" "reference/role-loop.md" "Mandatory Adversarial Review"
require_text "SKILL exact verification outranks review" "SKILL.md" "exact verification outranks reviewer approval"
require_text "role-loop exact verification outranks review" "reference/role-loop.md" "Exact verification outranks reviewer approval"
require_text "SKILL requires actual E2E/live/API/browser run" "SKILL.md" "actual E2E/live/API/browser run"
require_text "role-loop requires actual E2E/live/API/browser run" "reference/role-loop.md" "actual E2E/live/API/browser run"
require_text "role-loop compares request docs to behavior" "reference/role-loop.md" "compares the request/docs with current behavior"
require_text "SKILL full-spec pass names concrete docs" "SKILL.md" "request/ticket, README, design/API docs"
require_text "executor full-spec pass names concrete docs" "agents/executor.md" "request/ticket, README, design/API docs"
require_text "role-loop says when to use critic" "reference/role-loop.md" "Use it when the task is under-specified"
require_text "role-loop says when not to use critic" "reference/role-loop.md" "Do not use it when the spec is explicit"
require_text "role-loop gates critic escalation" "reference/role-loop.md" "optional gated escalation"
require_text "role-loop has full-spec improver role" "reference/role-loop.md" "Improve full spec"
require_text "role-loop has edge-case improver role" "reference/role-loop.md" "Improve edge cases"
require_text "role-loop preserves user feedback for production domain" "reference/role-loop.md" "Production/domain behavior-changing ambiguity needs user feedback"
require_text "role-loop records conservative no-user default" "reference/role-loop.md" "conservative, reversible default"
require_text "executor supports full-spec improve mode" "agents/executor.md" "DO (Improve full spec)"
require_text "executor supports edge-case improve mode" "agents/executor.md" "DO (Improve edge cases)"
require_text "qa-auditor verifies after improve passes" "agents/qa-auditor.md" "builder and both improve passes"
require_text "critic is optional escalation" "agents/code-reviewer.md" "Optional Critic escalation"

# LEGACY captures an existing API's exact behavior before a refactor (preserve-baseline),
# and Verify diffs the re-capture against it (parallel to DEBUG's screen->endpoint capture).
require_text "SKILL LEGACY captures preserve-baseline" "SKILL.md" "capture its exact behavior first as a preserve-baseline"
require_text "qa.md defines the API behavior baseline" "reference/qa.md" "## API behavior baseline (LEGACY preserve)"
require_text "qa.md baseline supports backend-only HTTP capture" "reference/qa.md" "Backend-only (no UI)"
require_text "role-loop Build captures the baseline first" "reference/role-loop.md" "capture its exact-behavior baseline FIRST"
require_text "role-loop Verify diffs the re-capture" "reference/role-loop.md" "re-capture the same call and diff against the pre-refactor baseline"
require_text "explore flags existing API for capture" "agents/explore.md" "flag it for a preserve-baseline capture"
require_text "qa.md defines characterization baseline" "reference/qa.md" "## Characterization baseline (non-UI code changes)"
require_text "role-loop generalizes baseline to shared code" "reference/role-loop.md" "shared code/state change past *very easy*"
require_text "role-loop reruns neighbor characterization baseline" "reference/role-loop.md" "Re-run every captured neighbor characterization baseline"
require_text "role-loop says characterization is not oracle" "reference/role-loop.md" "Characterization baseline is a regression signal, not a correctness oracle"
require_text "qa.md says characterization is not oracle" "reference/qa.md" "not a correctness oracle"
require_text "qa.md defines scenario stencil" "reference/qa.md" "## Scenario stencil (code changes)"
require_text "scenario stencil includes regression category" "reference/qa.md" "Regression: previous passing neighbor scenarios"
require_text "scenario stencil includes metamorphic relation" "reference/qa.md" "Metamorphic relation"
require_text "role-loop references scenario stencil" "reference/role-loop.md" "Scenario stencil (code changes)"
require_text "role-loop self-review is not regression gate" "reference/role-loop.md" "self-review is not a regression gate"
require_text "role-loop blocks stub done claims" "reference/role-loop.md" "stub/placeholder implementations block done"
require_text "qa-auditor rejects stub placeholders" "agents/qa-auditor.md" "never accept stub/placeholder done claims"
require_text "qa-auditor treats self-review as non-gate" "agents/qa-auditor.md" "self-review is not a regression gate"

# Template exists and carries the expected fields.
require_file "surfaced-requirements template exists" "templates/surfaced-requirements.md"
require_text "template names requirement/classification/why/test/status" "templates/surfaced-requirements.md" "requirement / classification / why implied / covering test / status"
require_text "template separates ask-user decisions" "templates/surfaced-requirements.md" 'Ambiguous or product-changing semantics are `ask-user` decision gates'
require_text "code-reviewer carries requirement threshold" "agents/code-reviewer.md" "Requirement threshold"
require_text "executor blocks speculative critic tests" "agents/executor.md" "stop and report a decision gate"

# Critic->fixer loop has a hard stop (3-cycle cap) and a doubt-theater anti-signal.
require_text "role-loop caps build-verify at max iterations" "reference/role-loop.md" "max_iterations"
require_text "role-loop forces reflection at cap" "reference/role-loop.md" "forced reflection"
require_text "role-loop reruns regression ledger" "reference/role-loop.md" 'Each iteration re-runs `regression_ledger`'
require_text "run state stores regression ledger" "templates/run-state.json" "regression_ledger"
require_text "role-loop caps critic->fixer at 3 cycles" "reference/role-loop.md" "cap the critic->fixer loop at 3 cycles"
require_text "role-loop names the doubt-theater anti-signal" "reference/role-loop.md" "Doubt-theater anti-signal"
require_text "role-loop has conditional plan attack" "reference/role-loop.md" "Adversarial plan attack"
require_text "role-loop gates plan attack to under-specified work" "reference/role-loop.md" "under-specified, wide-blast-radius"
# Critic carries an explicit adversarial (disprove, not validate) stance.
require_text "critic stance is to disprove, not rubber-stamp" "agents/code-reviewer.md" "try to DISPROVE"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
