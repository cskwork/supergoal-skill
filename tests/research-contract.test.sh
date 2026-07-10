#!/usr/bin/env bash
# /supergoal research reference contract.
# Research is a source-quality helper for planning/wayfinding decisions, not a
# top-level delivery mode and not product-code proof.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing file: %s\n' "$file"
  fi
}

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

reject_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        forbidden in %s: %s\n' "$file" "$text"
  else
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  fi
}

echo "=================================================================="
echo " /supergoal research reference contract   skill: $ROOT"
echo "=================================================================="

require_file "research reference exists" "reference/research.md"
require_text "SKILL points to research reference" "SKILL.md" "reference/research.md"
require_text "wayfinder invokes research reference" "reference/wayfinder.md" "reference/research.md"
require_text "research uses primary sources" "reference/research.md" "primary sources"
require_text "research follows claims to source owner" "reference/research.md" "source that owns it"
require_text "research writes a single Markdown asset" "reference/research.md" "single Markdown"
require_text "research cites claims" "reference/research.md" "cite each claim"
require_text "research records gaps" "reference/research.md" "Gaps"
require_text "research stays non-delivery" "reference/research.md" "does not satisfy delivery Done"
require_text "research output can live under wayfinder ticket" "reference/research.md" "wayfinder/tickets"
require_text "public README mentions research helper" "README.md" "reference/research.md"
require_text "Korean README mentions research helper" "README.ko.md" "reference/research.md"
reject_text "research is not a top-level mode" "SKILL.md" "| research"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
