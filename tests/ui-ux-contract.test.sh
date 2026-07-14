#!/usr/bin/env bash
# /supergoal UI/UX tier contract.
# Fails if the UI/UX overlay (Expressive=taste-skill-v2 baseline, always; Functional=functional-ui
# density overlay on dense surfaces) regresses: the dispatcher, the overlay, the Designer, or gate wiring.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal UI/UX tier contract   skill: $ROOT"
echo "=================================================================="

# Dispatcher routes BOTH tiers.
assert_text_ci_normalized "ui-ux names Expressive tier"           "reference/ui-ux.md" "Expressive"
assert_text_ci_normalized "ui-ux names Functional tier"           "reference/ui-ux.md" "Functional"
assert_text_ci_normalized "ui-ux routes Expressive -> taste"      "reference/ui-ux.md" "taste-skill-v2.md"
assert_text_ci_normalized "ui-ux routes Functional -> functional" "reference/ui-ux.md" "functional-ui.md"
assert_text_ci_normalized "ui-ux checks localized copy"           "reference/ui-ux.md" "Localized UI copy"
assert_text_ci_normalized "ui-ux checks Korean line breaks"       "reference/ui-ux.md" "Korean should prefer complete, action-oriented sentences"

# Functional authority exists and carries its baseline.
assert_nonempty_file "functional-ui authority exists"        "reference/functional-ui.md"
assert_text_ci_normalized "functional names a design system"      "reference/functional-ui.md" "design system"
assert_text_ci_normalized "functional requires all UI states"     "reference/functional-ui.md" "loading"
assert_text_ci_normalized "functional declares color-scheme"      "reference/functional-ui.md" "color-scheme"
assert_text_ci_normalized "functional records UI-tier line"       "reference/functional-ui.md" "UI-tier: Functional"
assert_text_ci_normalized "functional enumerates contrast pairs"  "reference/functional-ui.md" "contrast-pairs.json"

# Tier-aware Designer.
assert_text_ci_normalized "designer is tier-aware"                "agents/designer.md" "TIER:"
assert_text_ci_normalized "designer marks universal (*) bans"     "agents/designer.md" "(*)"
assert_text_ci_normalized "designer has functional-tier bans"     "agents/designer.md" "FUNCTIONAL-TIER BANS"
assert_text_ci_normalized "designer loads aesthetic family"       "agents/designer.md" "taste-aesthetics.md"

# Expressive aesthetic families (optional overlays on taste-skill-v2).
assert_nonempty_file "aesthetics authority exists"           "reference/taste-aesthetics.md"
assert_text_ci_normalized "aesthetics names minimalist family"    "reference/taste-aesthetics.md" "minimalist-ui"
assert_text_ci_normalized "aesthetics names high-end family"      "reference/taste-aesthetics.md" "high-end-visual-design"
assert_text_ci_normalized "aesthetics names brutalist family"     "reference/taste-aesthetics.md" "industrial-brutalist-ui"
assert_text_ci_normalized "aesthetics is one-family-only"         "reference/taste-aesthetics.md" "never mix"
assert_text_ci_normalized "ui-ux routes to aesthetic families"    "reference/ui-ux.md" "taste-aesthetics.md"

# Gate wiring: contrast is enforced, not eyeballed.
assert_text_ci_normalized "qa records UI-tier"                    "reference/qa.md" "UI-tier:"
assert_text_ci_normalized "qa-gate runs the contrast gate"        "templates/qa-gate.sh" "contrast-gate.mjs"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
