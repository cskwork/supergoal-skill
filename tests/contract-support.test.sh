#!/usr/bin/env bash

set -u

SUPPORT="$(cd "$(dirname "$0")" && pwd)/support/contract.sh"
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT

printf 'Alpha\n\tBeta\n' > "$ROOT/text.txt"
: > "$ROOT/empty.txt"
. "$SUPPORT"

PASS=0; FAIL=0
assert_text_ci_normalized "normalizes whitespace and case" "text.txt" "alpha beta" >/dev/null
[ "$PASS" -eq 1 ] && [ "$FAIL" -eq 0 ] || exit 1

PASS=0; FAIL=0
assert_text_exact "exact text remains case-sensitive" "text.txt" "alpha" >/dev/null
[ "$PASS" -eq 0 ] && [ "$FAIL" -eq 1 ] || exit 1

PASS=0; FAIL=0
assert_file "regular files may be empty" "empty.txt" >/dev/null
assert_nonempty_file "non-empty files reject empty content" "empty.txt" >/dev/null
[ "$PASS" -eq 1 ] && [ "$FAIL" -eq 1 ] || exit 1

PASS=0; FAIL=0
refute_text_ci_normalized "refutes normalized text" "text.txt" "gamma" >/dev/null
[ "$PASS" -eq 1 ] && [ "$FAIL" -eq 0 ] || exit 1

printf '  PASS  shared contract assertion semantics\n'
