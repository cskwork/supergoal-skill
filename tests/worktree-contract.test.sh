#!/usr/bin/env bash
# /supergoal worktree workflow contract.
# Fails if the skill stops requiring branch-scoped worktree isolation for coding/debug runs.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

echo "=================================================================="
echo " /supergoal worktree contract   skill: $ROOT"
echo "=================================================================="

require_text "skill asks for base branch" "SKILL.md" "ask the user for the base git branch"
require_text "skill asks for target branch" "SKILL.md" "ask the user for the target branch"
require_text "target defaults to base" "SKILL.md" "default target branch is the base branch"
require_text "worktree comes from base" "SKILL.md" "create the run worktree from the base branch"
require_text "merge goes into target" "SKILL.md" "merge the accepted worktree commit into the target branch"
require_text "cleanup waits for acceptance" "SKILL.md" "remove the run worktree only after the user accepts"
require_text "conflict rationale is explicit" "SKILL.md" "multiple agents can work without editing the same checkout"
require_text "pipeline keeps implementation in worktree" "reference/pipeline.md" "implementation phases run inside the branch-scoped worktree"
require_text "experts dispatch uses run worktree" "reference/experts.md" "dispatch Build/Fix writers inside the run worktree"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
