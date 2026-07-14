#!/usr/bin/env bash
# /supergoal research reference contract.
# Research is a source-quality helper for planning/wayfinding decisions, not a
# top-level delivery mode and not product-code proof.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal research reference contract   skill: $ROOT"
echo "=================================================================="

assert_file "research reference exists" "reference/research.md"
assert_text_ci_normalized "SKILL points to research reference" "SKILL.md" "reference/research.md"
assert_text_ci_normalized "wayfinder invokes research reference" "reference/wayfinder.md" "reference/research.md"
assert_text_ci_normalized "research uses primary sources" "reference/research.md" "primary sources"
assert_text_ci_normalized "research follows claims to source owner" "reference/research.md" "source that owns it"
assert_text_ci_normalized "research writes a single Markdown asset" "reference/research.md" "single Markdown"
assert_text_ci_normalized "research cites claims" "reference/research.md" "cite each claim"
assert_text_ci_normalized "research records gaps" "reference/research.md" "Gaps"
assert_text_ci_normalized "research stays non-delivery" "reference/research.md" "does not satisfy delivery Done"
assert_text_ci_normalized "research output can live under wayfinder ticket" "reference/research.md" "wayfinder/tickets"
assert_text_ci_normalized "public README mentions research helper" "README.md" "reference/research.md"
assert_text_ci_normalized "Korean README mentions research helper" "README.ko.md" "reference/research.md"
refute_text_ci_normalized "research is not a top-level mode" "SKILL.md" "| research"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
