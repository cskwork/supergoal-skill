#!/usr/bin/env bash
# /supergoal REVIEW-ONLY contract.
# Fails if the review mode stops being findings-only (starts editing source), drops a reviewer,
# stops verifying findings before reporting, or loses its routing out to DEBUG/LEGACY for fixes.

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
echo " /supergoal REVIEW-ONLY contract   skill: $ROOT"
echo "=================================================================="

# Routing: SKILL.md carries the mode row and the reference exists.
require_text "SKILL routes review/audit intent" "SKILL.md" "REVIEW-ONLY"
require_text "SKILL points to the mode reference" "SKILL.md" "reference/review-only.md"
require_file "review-only reference exists" "reference/review-only.md"

# Findings-only boundary.
require_text "mode is findings, not fixes" "reference/review-only.md" "findings, not fixes"
require_text "no source or test edits" "reference/review-only.md" "NO source or test edits"
require_text "read-only except the run folder" "reference/review-only.md" "read-only except the run folder"

# Independent reviewers, all named.
require_text "dispatches the code-reviewer persona" "reference/review-only.md" "agents/code-reviewer.md"
require_text "dispatches spec axis" "reference/review-only.md" "**Spec axis**"
require_text "dispatches standards axis" "reference/review-only.md" "**Standards axis**"
require_text "dispatches the security persona" "reference/review-only.md" "agents/security-reviewer.md"
require_text "critic stance writes no test files here" "reference/review-only.md" "does NOT write failing test files"
require_text "standards axis uses smell baseline" "reference/review-only.md" "fixed smell baseline"
require_text "repo rules override smell findings" "reference/review-only.md" "Documented repo rules override smell findings"
require_text "keeps review axes separate" "reference/review-only.md" "Keep Standards, Spec, and Security reports separate"

# Findings are verified evidence, not vibes.
require_text "findings re-checked before reporting" "reference/review-only.md" "re-checked against the cited code"
require_text "findings never override passing real tests" "reference/review-only.md" "Findings never override a passing real test"

# Report anchors.
require_text "report names what was not covered" "reference/review-only.md" "Not covered:"
require_text "report lists untested behaviors" "reference/review-only.md" "Untested behaviors:"
require_text "report has standards block" "reference/review-only.md" "## Standards"
require_text "report has spec block" "reference/review-only.md" "## Spec"
require_text "report has security block" "reference/review-only.md" "## Security"
require_text "findings carry file:line" "reference/review-only.md" "file:line"

# Fixes are a different mode.
require_text "fixing routes to DEBUG/LEGACY" "reference/review-only.md" "route to DEBUG/LEGACY"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
