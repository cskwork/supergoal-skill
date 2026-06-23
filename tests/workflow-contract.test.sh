#!/usr/bin/env bash
# /supergoal workflow contract.
# Fails if coding/debug runs can mutate the original checkout, skip source/target
# branch verification, or ship browser UI without playwright-cli QA evidence.

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
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"
    printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

echo "=================================================================="
echo " /supergoal workflow contract   skill: $ROOT"
echo "=================================================================="

# Coding/debug branch isolation is required by default.
require_text "SKILL requires source/base and target refs" "SKILL.md" "source/base branch and target/integration branch"
require_text "SKILL verifies refs before mutation" "SKILL.md" "verify both refs before mutating files"
require_text "SKILL requires a run worktree" "SKILL.md" "create a run worktree from the source/base branch"
require_text "SKILL forbids original checkout mutation" "SKILL.md" "Do not mutate the original checkout"
require_text "SKILL commits only through target branch" "SKILL.md" "Commit or merge only into the verified target/integration branch"

# The role loop carries the same operational contract, not only the short spine.
require_text "role-loop resolves source and target" "reference/role-loop.md" "resolve the source/base branch and target/integration branch"
require_text "role-loop verifies both refs" "reference/role-loop.md" "verify both refs exist"
require_text "role-loop creates branch-scoped worktree" "reference/role-loop.md" "git worktree add"
require_text "role-loop protects original checkout" "reference/role-loop.md" "never edit the original checkout"

# Browser UI verification cannot end at lint/typecheck; playwright-cli evidence is a hard exit condition.
require_text "SKILL sends UI work through browser QA gate" "SKILL.md" 'browser app verification with `qa-gate.sh <vault> browser`'
require_text "role-loop names playwright-cli for UI verification" "reference/role-loop.md" "Tool: playwright-cli"
require_text "qa says UI changes are browser app verification" "reference/qa.md" "UI changes are browser app verification"
require_text "README documents worktree default" "README.md" "run worktree"
require_text "README documents playwright browser gate" "README.md" 'qa-gate.sh <vault> browser'
if [ -f "$ROOT/tests/run-all.sh" ]; then
  PASS=$((PASS + 1)); printf '  PASS  canonical runner exists\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  canonical runner exists\n'
fi
require_text "README documents canonical runner" "README.md" "bash tests/run-all.sh"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
