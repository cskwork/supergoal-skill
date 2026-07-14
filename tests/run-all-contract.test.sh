#!/usr/bin/env bash
# Contract for the canonical runner: collect independent failures and syntax-check
# every JavaScript template recursively.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNNER="$ROOT/tests/run-all.sh"
PASS=0
FAIL=0

require_text() {
  local label="$1"
  local text="$2"
  if grep -Fq -- "$text" "$RUNNER"; then
    PASS=$((PASS + 1))
    printf ' PASS %-50s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf ' FAIL %-50s missing: %s\n' "$label" "$text"
  fi
}

require_text "runner keeps a failure total" 'FAILURES=0'
require_text "runner continues after failed shell test" 'FAILURES=$((FAILURES + 1))'
require_text "runner discovers JS recursively" 'find "$ROOT/templates" -type f'
require_text "runner checks JS and MJS" '-name '\''*.js'\'' -o -name '\''*.mjs'\'''
require_text "runner exits from aggregate status" 'exit "$FAILURES"'

printf '\n%s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
