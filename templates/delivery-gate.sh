#!/usr/bin/env bash
# /supergoal literal delivery gate.
# The orchestrator may NOT announce "done" unless this exits 0.
# NEVER edit this script to make a failing run pass — fix the work instead.
#
# Usage: delivery-gate.sh <vault-dir> [test-command]
#   <vault-dir>     the run's changelog folder, e.g. docs/changelog/2026-05-30-my-objective
#   [test-command]  optional; if omitted, auto-detected from the project
#
# Exit 0 only if: required vault artifacts exist, verification is GREEN with no RED,
# the verification enumerates its coverage and names its gaps (completeness contract),
# and the project's own test/build suite passes in this workspace.
#
# Verdict semantics: `verdict: GREEN` means "every ENUMERATED claim + coverage item re-verified",
# NOT "the code is safe". A gate is only as complete as the claim set behind it — so the
# completeness contract below forces that set to be enumerated and its gaps named, rather than
# letting an incomplete verification pass silently (the false-GREEN failure mode).

set -euo pipefail

VAULT="${1:?usage: delivery-gate.sh <vault-dir> [test-command]}"
TEST_CMD="${2:-}"
fail() { echo "GATE FAIL: $*" >&2; exit 1; }
pass() { echo "  ok: $*"; }

echo "== /supergoal delivery gate =="
echo "vault: $VAULT"

# 1) Required artifacts exist and are non-empty.
[ -s "$VAULT/brief.md" ]        || fail "brief.md missing/empty"
[ -s "$VAULT/plan.md" ]         || fail "plan.md missing/empty (scope was never frozen)"
[ -s "$VAULT/verification.md" ] || fail "verification.md missing/empty (nothing was verified)"
pass "artifacts present"

# 2) Verification is GREEN and contains no RED verdict.
grep -qi '^verdict:[[:space:]]*GREEN' "$VAULT/verification.md" \
  || fail "no 'verdict: GREEN' line in verification.md"
if grep -qi '^verdict:[[:space:]]*RED' "$VAULT/verification.md"; then
  fail "a 'verdict: RED' remains in verification.md — Verify rewound to Build and never cleared"
fi
pass "verification GREEN, no RED"

# 2.5) Completeness contract — bound and audit the claim set so an incomplete verification
#      cannot pass as a clean GREEN. Three line-checkable requirements in verification.md:
#        - a '## Coverage' section that maps acceptance criteria + the domain checklist to evidence
#        - a 'Not covered:' line that names the vectors/flows/properties NOT verified (or 'none')
#        - a 'Regression tests:' line — a fixed RED must land a permanent test ('none' for verify-only)
grep -qiE '^##[[:space:]]+Coverage\b' "$VAULT/verification.md" \
  || fail "verification.md has no '## Coverage' section — the claim set is unbounded; map each acceptance criterion + domain-checklist item to its evidence"
grep -qiE '^[[:space:]]*[-*]?[[:space:]]*Not[[:space:]]+covered:' "$VAULT/verification.md" \
  || fail "verification.md has no 'Not covered:' line — name what was NOT verified (or state 'none', justified). Silent omission is the false-GREEN bug"
grep -qiE '^[[:space:]]*[-*]?[[:space:]]*Regression[[:space:]]+tests?:' "$VAULT/verification.md" \
  || fail "verification.md has no 'Regression tests:' line — a fixed RED must add a permanent test; a verify-only run states 'none'"
pass "completeness contract (coverage map + named gaps + regression ratchet)"

# 3) If a Decision line exists (greenfield validation lives in brief.md), it must be GO.
#    Match the explicit "Decision:" line, not prose — so a brief that merely discusses NO-GO
#    criteria still passes when its decision is GO. DEBUG/LEGACY briefs have no Decision line.
if grep -qiE '^(#+[[:space:]]*)?Decision:' "$VAULT/brief.md"; then
  if grep -qiE '^(#+[[:space:]]*)?Decision:[[:space:]]*NO-?GO\b' "$VAULT/brief.md"; then
    fail "brief.md decision is NO-GO — building on spec is forbidden"
  fi
  grep -qiE '^(#+[[:space:]]*)?Decision:[[:space:]]*GO\b' "$VAULT/brief.md" \
    || fail "brief.md has a Decision line but it is not GO"
  pass "validation GO"
fi

# 4) Run the project's own suite in this workspace (the real correctness signal).
if [ -z "$TEST_CMD" ]; then
  if [ -f package.json ];        then TEST_CMD="npm test --silent"
  elif [ -f pyproject.toml ] || [ -f pytest.ini ] || [ -f setup.cfg ]; then TEST_CMD="pytest -q"
  elif [ -f go.mod ];            then TEST_CMD="go test ./..."
  elif [ -f Cargo.toml ];        then TEST_CMD="cargo test"
  elif [ -f Makefile ] && grep -q '^test:' Makefile; then TEST_CMD="make test"
  else fail "no test command given and none auto-detected — pass one explicitly; a build with no tests cannot be delivered"
  fi
fi
echo "  running: $TEST_CMD"
eval "$TEST_CMD" || fail "test suite did not pass: $TEST_CMD"
pass "test suite green"

echo "== GATE PASS =="
