#!/usr/bin/env bash
# /supergoal standing rules (rules/RULES.md) contract.
# Fails if the skill stops reading per-project standing rules before every mode,
# loses the safety-precedence / scaffold-on-request contract, or drops the template/docs.

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
echo " /supergoal standing rules contract   skill: $ROOT"
echo "=================================================================="

# Router reads project standing rules before any mode runs.
require_text "SKILL reads project standing rules" "SKILL.md" ".supergoal/rules/RULES.md"
require_text "standing rules read before mode classification" "SKILL.md" "before classifying the mode"
require_text "standing rules never weaken safety gates" "SKILL.md" "never weaken safety gates"
require_text "SKILL reference map points to rules reference" "SKILL.md" "reference/rules.md"

# Loading contract reference exists and carries the key invariants.
require_file "rules reference exists" "reference/rules.md"
require_text "read before the run worktree" "reference/rules.md" "before creating any run worktree"
require_text "rules injected into role subagents" "reference/rules.md" "inject"
require_text "precedence above distilled domain-rules" "reference/rules.md" "above distilled domain-rules"
require_text "precedence below safety gates" "reference/rules.md" "never weaken safety gates"
require_text "scaffold only on explicit request" "reference/rules.md" "only when the user explicitly asks"
require_text "scaffold gitignores the .supergoal dir" "reference/rules.md" "add \`.supergoal/\` to \`.gitignore\`"
require_text "conservative: no edits during a run" "reference/rules.md" "never edit"

# Template scaffold ships and is a no-op until filled.
require_file "rules template exists" "templates/rules.md"
require_text "template has a Rules section" "templates/rules.md" "## Rules"

# Documented in the README.
require_text "README documents standing rules" "README.md" "Standing rules"
require_text "README names the rules path" "README.md" ".supergoal/rules/RULES.md"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
