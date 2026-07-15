#!/usr/bin/env bash
# /supergoal workflow contract.
# Fails if coding/debug runs can mutate the original checkout, skip source/target
# branch verification, or ship browser UI without accepted browser-driver QA evidence.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal workflow contract   skill: $ROOT"
echo "=================================================================="

# SKILL.md routes; reference/role-loop.md owns the branch/worktree procedure.
assert_text_ci_normalized "SKILL keeps mode router" "SKILL.md" "## Mode (classify, state it in one line)"
refute_text_ci_normalized "SKILL has no IntentGate section" "SKILL.md" "IntentGate"
refute_text_ci_normalized "SKILL has no capability_refs contract" "SKILL.md" "capability_refs"
assert_text_ci_normalized "SKILL matches repo docs language for docs" "SKILL.md" "match the target repo's dominant prose language"
assert_text_ci_normalized "SKILL names run isolation hook" "SKILL.md" "Run isolation"
assert_text_ci_normalized "SKILL points to role-loop contract" "SKILL.md" "reference/role-loop.md"

assert_text_ci_normalized "role-loop resolves source and target" "reference/role-loop.md" "resolve the source/base branch and target/integration branch"
assert_text_ci_normalized "role-loop verifies both refs" "reference/role-loop.md" "verify both refs exist"
assert_text_ci_normalized "role-loop creates branch-scoped worktree" "reference/role-loop.md" "git worktree add"
assert_text_ci_normalized "role-loop protects original checkout" "reference/role-loop.md" "never edit the original checkout"
assert_text_ci_normalized "role-loop commits only through target branch" "reference/role-loop.md" "verified target/integration branch"

# Browser UI verification cannot end at lint/typecheck; agent-browser evidence is the default exit condition.
assert_text_ci_normalized "role-loop sends UI work through browser QA gate" "reference/role-loop.md" 'qa-gate.sh <vault> browser'
assert_text_ci_normalized "role-loop defaults UI verification to agent-browser" "reference/role-loop.md" "Tool: agent-browser"
assert_text_ci_normalized "role-loop limits playwright-cli to fallback" "reference/role-loop.md" "playwright-cli is fallback-only"
assert_text_ci_normalized "role-loop records why default QA failed" "reference/role-loop.md" "why agent-browser could not complete reliable QA"
assert_text_ci_normalized "qa says UI changes are browser app verification" "reference/qa.md" "UI changes are browser app verification"
assert_text_ci_normalized "qa exposes code-change scenario stencil" "reference/qa.md" "Scenario stencil (code changes)"
assert_text_ci_normalized "qa scenario stencil includes regression" "reference/qa.md" "Regression: previous passing neighbor scenarios"
assert_text_ci_normalized "qa scenario stencil includes synthetic data warning" "reference/qa.md" "Do not call one fabricated green case conclusive"
assert_text_ci_normalized "README documents worktree default" "README.md" "run worktree"
assert_text_ci_normalized "README documents playwright browser gate" "README.md" 'qa-gate.sh <vault> browser'
if [ -f "$ROOT/tests/run-all.sh" ]; then
  PASS=$((PASS + 1)); printf '  PASS  canonical runner exists\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  canonical runner exists\n'
fi
assert_text_ci_normalized "README documents canonical runner" "README.md" "bash tests/run-all.sh"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
