#!/usr/bin/env bash
# /supergoal HARNESS-MAKE contract.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

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

echo "/supergoal HARNESS-MAKE contract"
echo "=================================="

require_file "harness make reference exists" "reference/harness-make.md"
require_file "harness pattern reference exists" "reference/harness-patterns.md"
require_file "harness spec template exists" "templates/harness-spec.md"
require_file "harness agent template exists" "templates/harness-agent.md.template"
require_file "harness skill template exists" "templates/harness-skill.md.template"

require_text "route hook names HARNESS-MAKE" "SKILL.md" "HARNESS-MAKE"
require_text "route hook points at make reference" "SKILL.md" "reference/harness-make.md"
require_text "step 0 has harness make row" "SKILL.md" "| \"build/design/integrate/audit harness"
require_text "make pipeline has human gate" "reference/harness-make.md" "Human Feedback"
require_text "make is runtime neutral" "reference/harness-make.md" "Runtime-neutral"
require_text "make blocks auto-install" "reference/harness-make.md" "Never install or overwrite generated agents/skills without explicit human approval."
require_text "patterns include fan-out/fan-in" "reference/harness-patterns.md" "Fan-out/fan-in"
require_text "patterns include producer-reviewer" "reference/harness-patterns.md" "Producer-reviewer"
require_text "spec records adapter" "templates/harness-spec.md" "runtime_adapter"
require_text "agent template records contract" "templates/harness-agent.md.template" "Quality contract"
require_text "skill template is portable" "templates/harness-skill.md.template" "No runtime-specific tool names"

printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
