#!/usr/bin/env bash
# /supergoal standing rules (rules/RULES.md) contract.
# Fails if the skill stops reading per-project standing rules before every mode,
# loses the safety-precedence / scaffold-on-request contract, or drops the template/docs.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal standing rules contract   skill: $ROOT"
echo "=================================================================="

# Router reads project standing rules before any mode runs.
assert_text_ci_normalized "SKILL reads project standing rules" "SKILL.md" ".supergoal/rules/RULES.md"
assert_text_ci_normalized "standing rules read before mode classification" "SKILL.md" "before classifying the mode"
assert_text_ci_normalized "standing rules never weaken safety gates" "SKILL.md" "never weaken safety gates"
assert_text_ci_normalized "SKILL reference map points to rules reference" "SKILL.md" "reference/rules.md"

# Loading contract reference exists and carries the key invariants.
assert_file "rules reference exists" "reference/rules.md"
assert_text_ci_normalized "read before the run worktree" "reference/rules.md" "before creating any run worktree"
assert_text_ci_normalized "rules injected into role subagents" "reference/rules.md" "inject"
assert_text_ci_normalized "precedence above distilled domain-rules" "reference/rules.md" "above distilled domain-rules"
assert_text_ci_normalized "precedence below safety gates" "reference/rules.md" "never weaken safety gates"
assert_text_ci_normalized "scaffold only on explicit request" "reference/rules.md" "only when the user explicitly asks"
assert_text_ci_normalized "scaffold gitignores the .supergoal dir" "reference/rules.md" "add \`.supergoal/\` to \`.gitignore\`"
assert_text_ci_normalized "conservative: no edits during a run" "reference/rules.md" "never edit"

# Template scaffold ships and is a no-op until filled.
assert_file "rules template exists" "templates/rules.md"
assert_text_ci_normalized "template has a Rules section" "templates/rules.md" "## Rules"

# Documented in the README.
assert_text_ci_normalized "README documents standing rules" "README.md" "Standing rules"
assert_text_ci_normalized "README names the rules path" "README.md" ".supergoal/rules/RULES.md"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
