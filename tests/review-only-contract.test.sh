#!/usr/bin/env bash
# /supergoal REVIEW-ONLY contract.
# Fails if the review mode stops being findings-only (starts editing source), drops a reviewer,
# stops verifying findings before reporting, or loses its routing out to DEBUG/LEGACY for fixes.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal REVIEW-ONLY contract   skill: $ROOT"
echo "=================================================================="

# Routing: SKILL.md carries the mode row and the reference exists.
assert_text_ci_normalized "SKILL routes review/audit intent" "SKILL.md" "REVIEW-ONLY"
assert_text_ci_normalized "SKILL points to the mode reference" "SKILL.md" "reference/review-only.md"
assert_file "review-only reference exists" "reference/review-only.md"

# Findings-only boundary.
assert_text_ci_normalized "mode is findings, not fixes" "reference/review-only.md" "findings, not fixes"
assert_text_ci_normalized "no source or test edits" "reference/review-only.md" "NO source or test edits"
assert_text_ci_normalized "read-only except the run folder" "reference/review-only.md" "read-only except the run folder"

# Two independent reviewers, both named.
assert_text_ci_normalized "dispatches the critic persona" "reference/review-only.md" "agents/code-reviewer.md"
assert_text_ci_normalized "dispatches the security persona" "reference/review-only.md" "agents/security-reviewer.md"
assert_text_ci_normalized "critic stance writes no test files here" "reference/review-only.md" "does NOT write failing test files"

# Findings are verified evidence, not vibes.
assert_text_ci_normalized "findings re-checked before reporting" "reference/review-only.md" "re-checked against the cited code"
assert_text_ci_normalized "findings never override passing real tests" "reference/review-only.md" "Findings never override a passing real test"

# Report anchors.
assert_text_ci_normalized "report names what was not covered" "reference/review-only.md" "Not covered:"
assert_text_ci_normalized "report lists untested behaviors" "reference/review-only.md" "Untested behaviors:"
assert_text_ci_normalized "findings carry file:line" "reference/review-only.md" "file:line"

# Fixes are a different mode.
assert_text_ci_normalized "fixing routes to DEBUG/LEGACY" "reference/review-only.md" "route to DEBUG/LEGACY"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
