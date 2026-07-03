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

# Verifier closes them out.
require_text "verifier marks surfaced requirements fixed" "reference/role-loop.md" "mark each surfaced requirement fixed"

# SKILL.md surfaces the behavior in the default loop.
require_text "SKILL critic step logs surfaced requirements" "SKILL.md" 'run vault'\''s `surfaced-requirements.md`'

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
require_text "template names requirement/why/covering test/status" "templates/surfaced-requirements.md" "requirement / why implied / covering test / status"

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
