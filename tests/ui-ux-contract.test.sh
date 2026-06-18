#!/usr/bin/env bash
# /supergoal UI/UX tier contract.
# Fails if the two-tier UI/UX overlay (Expressive=taste-skill-v2, Functional=functional-ui) regresses:
# the dispatcher, the Functional authority, the tier-aware Designer, or their gate wiring.

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
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"
    printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

require_file() {
  local label="$1" file="$2"
  if [ -s "$ROOT/$file" ]; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"
    printf '        missing/empty file: %s\n' "$file"
  fi
}

echo "=================================================================="
echo " /supergoal UI/UX tier contract   skill: $ROOT"
echo "=================================================================="

# Dispatcher routes BOTH tiers.
require_text "ui-ux names Expressive tier"           "reference/ui-ux.md" "Expressive"
require_text "ui-ux names Functional tier"           "reference/ui-ux.md" "Functional"
require_text "ui-ux routes Expressive -> taste"      "reference/ui-ux.md" "taste-skill-v2.md"
require_text "ui-ux routes Functional -> functional" "reference/ui-ux.md" "functional-ui.md"
require_text "ui-ux checks localized copy"           "reference/ui-ux.md" "Localized UI copy"
require_text "ui-ux checks Korean line breaks"       "reference/ui-ux.md" "Korean should prefer complete, action-oriented sentences"

# Functional authority exists and carries its baseline.
require_file "functional-ui authority exists"        "reference/functional-ui.md"
require_text "functional names a design system"      "reference/functional-ui.md" "design system"
require_text "functional requires all UI states"     "reference/functional-ui.md" "loading"
require_text "functional declares color-scheme"      "reference/functional-ui.md" "color-scheme"
require_text "functional records UI-tier line"       "reference/functional-ui.md" "UI-tier: Functional"
require_text "functional enumerates contrast pairs"  "reference/functional-ui.md" "contrast-pairs.json"

# Tier-aware Designer.
require_text "designer is tier-aware"                "agents/designer.md" "TIER:"
require_text "designer marks universal (*) bans"     "agents/designer.md" "(*)"
require_text "designer has functional-tier bans"     "agents/designer.md" "FUNCTIONAL-TIER BANS"
require_text "designer loads aesthetic family"       "agents/designer.md" "taste-aesthetics.md"

# Expressive aesthetic families (optional overlays on taste-skill-v2).
require_file "aesthetics authority exists"           "reference/taste-aesthetics.md"
require_text "aesthetics names minimalist family"    "reference/taste-aesthetics.md" "minimalist-ui"
require_text "aesthetics names high-end family"      "reference/taste-aesthetics.md" "high-end-visual-design"
require_text "aesthetics names brutalist family"     "reference/taste-aesthetics.md" "industrial-brutalist-ui"
require_text "aesthetics is one-family-only"         "reference/taste-aesthetics.md" "never mix"
require_text "ui-ux routes to aesthetic families"    "reference/ui-ux.md" "taste-aesthetics.md"

# Gate wiring: contrast is enforced, not eyeballed.
require_text "qa records UI-tier"                    "reference/qa.md" "UI-tier:"
require_text "qa-gate runs the contrast gate"        "templates/qa-gate.sh" "contrast-gate.mjs"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
