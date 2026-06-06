#!/usr/bin/env bash
# /supergoal HARNESS-MAKE contract checks.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1))
    printf ' PASS %-48s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf ' FAIL %-48s missing %s\n' "$label" "$file"
  fi
}

require_text() {
  local label="$1" file="$2" needle="$3"
  if [ ! -f "$ROOT/$file" ]; then
    FAIL=$((FAIL + 1))
    printf ' FAIL %-48s missing %s\n' "$label" "$file"
    return
  fi

  local normalized
  normalized="$(tr '\n' ' ' < "$ROOT/$file")"
  if printf '%s' "$normalized" | grep -Fq -- "$needle"; then
    PASS=$((PASS + 1))
    printf ' PASS %-48s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf ' FAIL %-48s missing %s\n' "$label" "$needle"
  fi
}

require_file "make reference exists" "reference/harness-make.md"
require_file "spec template exists" "templates/harness-spec.md"
require_file "agent template exists" "templates/harness-agent.md.template"
require_file "skill template exists" "templates/harness-skill.md.template"

require_text "mode router exposes HARNESS-MAKE" "SKILL.md" "HARNESS-MAKE"
require_text "make keeps draft separate from active" "reference/harness-make.md" "Draft paths are reviewable artifacts, not active runtime registries."
require_text "make requires adapter install target" "reference/harness-make.md" "Approved active files must be written to the selected runtime_adapter install_target."
require_text "make auto continues after approval" "reference/harness-make.md" "After explicit approval, generate, install, verify, and journal without asking again unless a new overwrite or new install target appears."
require_text "make rejects inactive agent storage" "reference/harness-make.md" "Treating .domain-agent/harness/agents/ as active agent installation."
require_text "spec records draft root" "templates/harness-spec.md" "- draft_root:"
require_text "spec records active install target" "templates/harness-spec.md" "- active_install_target:"
require_text "spec records auto continue flag" "templates/harness-spec.md" "- auto_continue_after_approval:"
require_text "agent template records install path" "templates/harness-agent.md.template" "## Install"
require_text "skill template records install path" "templates/harness-skill.md.template" "## Install"

printf '\nHARNESS-MAKE contract: %d passed, %d failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
