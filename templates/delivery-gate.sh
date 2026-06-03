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
# sha256 over CR-stripped bytes, so CRLF/LF checkout drift cannot break the plan-freeze match.
hash_file_lf() {
  if command -v sha256sum >/dev/null 2>&1;   then tr -d '\r' < "$1" | sha256sum   | awk '{print $1}'
  elif command -v shasum  >/dev/null 2>&1;   then tr -d '\r' < "$1" | shasum -a 256 | awk '{print $1}'
  else echo "__NO_SHA_TOOL__"; fi
}

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

# 2.55) Committee soft gate — architect + security + code-review must all have APPROVED before Deliver
#       (SKILL.md Core Contract). Recorded as a single 'Committee:' line in verification.md, the same
#       line-checkable shape as the coverage lines above. A non-approval verdict blocks delivery.
COMMITTEE="$(grep -iE '^[[:space:]]*[-*]?[[:space:]]*Committee:' "$VAULT/verification.md" | head -1 || true)"
[ -n "$COMMITTEE" ] \
  || fail "verification.md has no 'Committee:' line — record architect + security + code-review verdicts (e.g. 'Committee: architect APPROVED, security APPROVED, code-review APPROVED')"
for who in architect security code; do
  printf '%s' "$COMMITTEE" | grep -qi "$who" \
    || fail "Committee line does not name the '$who' reviewer — all three (architect, security, code-review) must be recorded"
done
if printf '%s' "$COMMITTEE" | grep -qiE 'reject|changes[ -]?requested|not[ -]approved'; then
  fail "Committee line shows a non-approval (reject/changes-requested) — resolve it before Deliver"
fi
printf '%s' "$COMMITTEE" | grep -qi 'approv' \
  || fail "Committee line records no APPROVED verdict"
pass "committee approved (architect + security + code-review)"

# 2.56) Plan freeze — Build implements the approved plan, it does not redesign. plan.md must hash-match
#       state.json.plan_hash, unless README.md logs a 'RE-PLAN:' escape (an approved re-plan).
if [ -f "$VAULT/README.md" ] && grep -qiE '^[[:space:]]*[-*#]*[[:space:]]*RE-?PLAN:' "$VAULT/README.md"; then
  pass "plan freeze waived (README.md logs RE-PLAN)"
else
  [ -s "$VAULT/state.json" ] \
    || fail "state.json missing/empty — cannot verify plan freeze; record sha256 of the approved plan.md in state.json.plan_hash, or log 'RE-PLAN:' in README.md"
  expected="$(grep -oE '"plan_hash"[[:space:]]*:[[:space:]]*"[0-9a-fA-F]{64}"' "$VAULT/state.json" | grep -oiE '[0-9a-f]{64}' | head -1 || true)"
  [ -n "$expected" ] \
    || fail "state.json has no 64-hex 'plan_hash' (scope was never frozen) — record sha256 of the approved plan.md, or log 'RE-PLAN:' in README.md"
  actual="$(hash_file_lf "$VAULT/plan.md")"
  [ "$actual" = "__NO_SHA_TOOL__" ] && fail "no sha256 tool (sha256sum/shasum) available to verify plan freeze"
  [ "$(printf '%s' "$expected" | tr 'A-F' 'a-f')" = "$actual" ] \
    || fail "plan.md hash ($actual) does not match state.json.plan_hash — Build changed scope past the approved plan; re-approve and log 'RE-PLAN:' in README.md, or restore the approved plan"
  pass "plan freeze (plan.md matches approved plan_hash)"
fi

# 2.6) QA evidence backstop — if this run produced browser-QA evidence (a qa/ dir), it must still
#      satisfy the QA gate at delivery (as-is/to-be + named driver + justified fallback). CLI/library
#      and DEBUG-non-web runs have no qa/ dir, so this is skipped for them. Defense-in-depth behind the
#      QA-phase exit gate — catches a non-compliant QA that slipped through (e.g. a silent fallback).
QA_GATE="$(dirname "$0")/qa-gate.sh"
if [ -d "$VAULT/qa" ] && [ -f "$QA_GATE" ]; then
  bash "$QA_GATE" "$VAULT" browser || fail "qa/ evidence present but QA gate fails — re-run QA properly (bash $QA_GATE $VAULT browser)"
  pass "QA gate (browser evidence verified)"
fi

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
