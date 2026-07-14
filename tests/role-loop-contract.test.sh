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

reject_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        forbidden in %s: %s\n' "$file" "$text"
  else
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  fi
}

echo "=================================================================="
echo " /supergoal ROLE-LOOP contract   skill: $ROOT"
echo "=================================================================="

# The verifier records surfaced requirements as appended GOAL.md criteria in the run vault;
# the relaunched builder covers each one red-first. No standing critic/fixer roles remain.
require_text "verifier records surfaced requirements as markdown" "reference/role-loop.md" 'docs/changelog/<YYYY-MM>/<DD-topic>/GOAL.md'
require_text "record explains why a requirement is implied" "reference/role-loop.md" "why it is required though the prompt never stated it"
require_text "record links the covering failing test" "reference/role-loop.md" "the failing test that now covers it"
require_text "record entries start open" "reference/role-loop.md" "unchecked box = open"
require_text "verifier classifies inferred requirements" "reference/role-loop.md" 'classify each candidate as `must`, `should`, or `ask-user`'
require_text "verifier only surfaces must requirements" "reference/role-loop.md" 'Only `must` requirements'
require_text "verifier does not invent stricter semantics" "reference/role-loop.md" "Do not turn silence into stricter semantics"
require_text "builder blocks ask-user generated criteria" "reference/role-loop.md" "stop and report the decision gate"

# Verifier closes them out.
require_text "verifier marks surfaced requirements fixed" "reference/role-loop.md" "Tick each surfaced criterion"

# SKILL.md surfaces routing/invariants; reference/role-loop.md owns detailed behavior.
require_text "SKILL names the five-gate core" "SKILL.md" "Frame -> Plan approval -> Build -> Exact Verify/QA -> Finalize"
require_text "SKILL delegates detailed loop authority" "SKILL.md" "sole detailed authority"
require_text "SKILL excludes pure brainstorming by default" "SKILL.md" "pure brainstorming and user-driven step-by-step work use normal direct collaboration"
require_text "role-loop verify step logs surfaced requirements" "reference/role-loop.md" 'run vault'\''s `GOAL.md`'
require_text "role-loop keeps production ambiguity as ask-user" "reference/role-loop.md" "production/source-code domain ambiguity"
require_text "role-loop allows conservative no-user default" "reference/role-loop.md" "conservative, reversible default"
require_text "role-loop names the five-gate core" "reference/role-loop.md" "Frame -> Plan approval -> Build -> Exact Verify/QA -> Finalize"
# Critic/Fixer roles are removed entirely (2026-07-14): the verifier surfaces gaps with its
# adversarial stance; the relaunched builder fixes them. R-LOOP is the only fix channel.
reject_text "role-loop has no critic/fixer roles" "reference/role-loop.md" "Critic/Fixer"
reject_text "SKILL has no critic/fixer roles" "SKILL.md" "Critic/Fixer"
require_text "role-loop names the only fix channel" "reference/role-loop.md" "the only fix channel"
require_text "builder reproduces R-LOOP items red-first" "reference/role-loop.md" "reproduce it with a failing test first"
require_text "role-loop dispatches fresh-context roles" "reference/role-loop.md" "fresh-context subagent"
require_text "role-loop requires separate builder subagent" "reference/role-loop.md" "separate fresh-context builder subagent"
require_text "SKILL treats supergoal invocation as subagent authorization" "SKILL.md" "explicit authorization to use its fresh-context subagents"
require_text "role-loop treats supergoal invocation as subagent authorization" "reference/role-loop.md" "explicit authorization to spawn the role-loop subagents"
require_text "role-loop avoids second subagent permission question" "reference/role-loop.md" 'Do not ask a second "may I use subagents?" question'
require_text "SKILL says invoked supergoal does not downgrade" "SKILL.md" "instead of downgrading to an inline shortcut"
require_text "role-loop says invoked supergoal uses loop" "reference/role-loop.md" "Once invoked, use this loop"
reject_text "SKILL has no trivial-inline shortcut" "SKILL.md" "Trivial single"
reject_text "SKILL has no very-easy shortcut" "SKILL.md" "Very easy"
reject_text "SKILL has no direct-edit shortcut" "SKILL.md" "edit directly"
reject_text "role-loop has no trivial-inline shortcut" "reference/role-loop.md" "Trivial single"
reject_text "role-loop has no very-easy shortcut" "reference/role-loop.md" "very easy"
reject_text "role-loop has no inline edit shortcut" "reference/role-loop.md" "edit inline"
reject_text "qa has no very-easy skip" "reference/qa.md" "very easy"
reject_text "delivery gate has no very-easy threshold" "reference/delivery-gate.md" "very easy"
# The verifier absorbs the adversarial review; a standalone mandatory review pass is removed ceremony.
reject_text "SKILL has no mandatory standalone review pass" "SKILL.md" "Mandatory Adversarial Review"
reject_text "role-loop has no mandatory standalone review pass" "reference/role-loop.md" "Mandatory Adversarial Review"
require_text "SKILL verifier stays fresh and adversarial" "SKILL.md" "fresh adversarial verifier"
require_text "role-loop verifier carries the adversarial stance" "reference/role-loop.md" "adversarial stance"
require_text "SKILL exact verification outranks review" "SKILL.md" "Exact verification outranks review"
require_text "role-loop exact verification outranks review" "reference/role-loop.md" "Exact verification outranks reviewer approval"
require_text "SKILL requires E2E/live/API/browser proof" "SKILL.md" "E2E/live/API/browser proof"
require_text "role-loop requires actual E2E/live/API/browser run" "reference/role-loop.md" "actual E2E/live/API/browser run"
require_text "role-loop compares request docs to behavior" "reference/role-loop.md" "compares the request/docs with current behavior"
require_text "role-loop frame discovery names concrete docs" "reference/role-loop.md" "request/ticket, README, design/API docs"
require_text "executor builds from the plan's checklist" "agents/executor.md" "every planned criterion"
reject_text "executor does not re-read spec docs" "agents/executor.md" "request/ticket, README, design/API docs"
require_text "role-loop says when to escalate" "reference/role-loop.md" "Use it when the task is under-specified"
require_text "role-loop says when not to escalate" "reference/role-loop.md" "Do not use it when the spec is explicit"
require_text "role-loop gates the escalation ladder" "reference/role-loop.md" "optional gated escalation"
# Standalone improve/review passes are removed: Frame discovers spec+edge coverage into the plan,
# Build implements only the approved plan, Verify owns the request/docs comparison and review.
require_text "role-loop frame owns full-spec discovery" "reference/role-loop.md" "Full-spec discovery"
require_text "discovery explores the actual code" "reference/role-loop.md" "grounded in observed code"
require_text "role-loop builder covers planned criteria" "reference/role-loop.md" "every planned criterion"
require_text "role-loop plan carries the acceptance checklist" "reference/role-loop.md" "## Acceptance checklist"
# One vault, one language: prose follows the user's request; gate-grepped markers stay verbatim.
require_text "vault prose follows the request language" "reference/role-loop.md" "language of the user's original request"
require_text "vault structural markers stay verbatim" "reference/role-loop.md" "Structural markers stay verbatim"
reject_text "role-loop has no standalone improve pass" "reference/role-loop.md" "standalone fresh-context improver"
reject_text "role-loop builder does not re-read spec docs" "reference/role-loop.md" "Full-spec sweep"
require_text "role-loop preserves user feedback for production domain" "reference/role-loop.md" "Production/domain behavior-changing ambiguity needs user feedback"
require_text "role-loop records conservative no-user default" "reference/role-loop.md" "conservative, reversible default"
require_text "qa-auditor stays fresh of the builder" "agents/qa-auditor.md" "fresh-context relative to the builder"
require_text "reviewer is trigger-gated escalation" "agents/code-reviewer.md" "trigger-gated escalation"

# Dispatch economy: the default run is builder + verifier only; anything more is
# trigger-gated escalation with a recorded trigger (turn/token diet, 2026-07-14).
require_text "SKILL caps default dispatches" "SKILL.md" "one builder + one verifier dispatch per iteration"
require_text "role-loop caps default dispatches" "reference/role-loop.md" "one builder + one verifier dispatch per iteration"
require_text "role-loop keeps only the plan attack as escalation" "reference/role-loop.md" "## Escalation (conditional plan attack)"
require_text "escalation needs a named trigger" "reference/role-loop.md" "named escalation trigger"
require_text "builder exits on a green suite" "reference/role-loop.md" "return only on a green suite"
require_text "executor covers planned edge criteria" "agents/executor.md" "edge-case and resilience criteria"
require_text "qa-auditor owns the adversarial review" "agents/qa-auditor.md" "adversarial stance"
require_text "role-loop caps default iterations at 3" "reference/role-loop.md" '`max_iterations` (default 3)'
require_text "frame enumerates edge cases at plan time" "reference/role-loop.md" "edge-case and resilience criteria"
require_text "verify keeps the R-LOOP loop-back" "reference/role-loop.md" "R-LOOP.md"

# LEGACY captures an existing API's exact behavior before a refactor (preserve-baseline),
# and Verify diffs the re-capture against it (parallel to DEBUG's screen->endpoint capture).
require_text "SKILL LEGACY captures preserve-baseline" "SKILL.md" "capture its exact behavior first as a preserve-baseline"
require_text "qa.md defines the API behavior baseline" "reference/qa.md" "## API behavior baseline (LEGACY preserve)"
require_text "qa.md baseline supports backend-only HTTP capture" "reference/qa.md" "Backend-only (no UI)"
require_text "role-loop Build captures the baseline first" "reference/role-loop.md" "capture its exact-behavior baseline FIRST"
require_text "role-loop Verify diffs the re-capture" "reference/role-loop.md" "re-capture the same call and diff against the pre-refactor baseline"
require_text "explore flags existing API for capture" "agents/explore.md" "flag it for a preserve-baseline capture"
require_text "qa.md defines characterization baseline" "reference/qa.md" "## Characterization baseline (non-UI code changes)"
require_text "role-loop generalizes baseline to shared code" "reference/role-loop.md" "any shared code/state change"
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

# Templates exist and carry the expected fields.
require_file "goal template exists" "templates/GOAL.md"
require_file "plan template exists" "templates/PLAN.md"
require_file "qa template exists" "templates/QA.md"
require_file "r-loop template exists" "templates/R-LOOP.md"
require_file "z-done template exists" "templates/Z-DONE.md"
require_text "goal template tags surfaced criteria" "templates/GOAL.md" "(surfaced: implied by"
require_text "goal template separates ask-user decisions" "templates/GOAL.md" 'go to `## Decision Gates` as `ask-user`'
require_text "code-reviewer carries requirement threshold" "agents/code-reviewer.md" "Requirement threshold"
require_text "executor blocks speculative critic tests" "agents/executor.md" "stop and report a decision gate"

# GOAL.md is the single source of done; the verifier owns the checkboxes.
require_text "role-loop writes goal first with verbatim request" "reference/role-loop.md" "user's prompt verbatim"
require_text "only the verifier ticks criteria" "reference/role-loop.md" "only the verifier ticks"
require_text "role-loop verify diffs implementer changes vs goal" "reference/role-loop.md" 'Diff the implementer'\''s changes (git diff in the run worktree) against `GOAL.md`'
require_text "role-loop records plain checklist QA results" "reference/role-loop.md" '`## Results` checklist sentences'

# Plan approval gate: blocking in interactive sessions, auto-approved (recorded) in autonomous runs.
require_text "role-loop has blocking plan approval gate" "reference/role-loop.md" "Plan approval gate (blocking"
require_text "role-loop waits for explicit user OK" "reference/role-loop.md" "WAIT for the user's explicit OK"
require_text "role-loop auto-approves autonomous runs" "reference/role-loop.md" "auto-approved"
require_text "SKILL blocks Build before approval" "SKILL.md" "Build starts only after approval"
require_text "executor is briefed by the plan alone" "agents/executor.md" "the frozen plan is your whole brief"

# R-LOOP channel: verifier appends timestamped gap sections; relaunched implementer reads the latest.
require_text "role-loop verifier appends r-loop sections" "reference/role-loop.md" 'APPEND a timestamped section to the vault'\''s `R-LOOP.md`'
require_text "qa-auditor appends r-loop sections" "agents/qa-auditor.md" 'APPEND a timestamped checklist section to `R-LOOP.md`'
require_text "implementer re-entry reads latest r-loop section" "agents/executor.md" 'the LATEST `R-LOOP.md` section'

# Z completion marker: written only when every criterion is checked.
require_text "role-loop writes z marker on full completion" "reference/role-loop.md" 'write `Z-<YYYY-MM-DD>.md`'
require_text "role-loop never writes z marker early" "reference/role-loop.md" "never earlier"

# Build->Verify loop has a hard stop with forced reflection, then escalates to the user.
require_text "role-loop caps build-verify at max iterations" "reference/role-loop.md" "max_iterations"
require_text "role-loop forces reflection at cap" "reference/role-loop.md" "forced reflection"
require_text "role-loop escalates to the user at cap" "reference/role-loop.md" "escalate to the user with that state instead of grinding"
require_text "role-loop reruns regression ledger" "reference/role-loop.md" 'Each iteration re-runs `regression_ledger`'
require_text "run state stores regression ledger" "templates/run-state.json" "regression_ledger"
require_text "role-loop has conditional plan attack" "reference/role-loop.md" "Adversarial plan attack"
require_text "role-loop gates plan attack to under-specified work" "reference/role-loop.md" "under-specified, wide-blast-radius"
# The escalation reviewer carries an explicit adversarial (disprove, not validate) stance.
require_text "reviewer stance is to disprove, not rubber-stamp" "agents/code-reviewer.md" "try to DISPROVE"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
