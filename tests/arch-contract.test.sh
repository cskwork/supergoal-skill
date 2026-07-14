#!/usr/bin/env bash
# /supergoal ARCHITECTURE-mode contract.
# Fails if the architecture survey loses its findings-only boundary, its depth/seam
# vocabulary, its run-vault report with recommendation strengths, its grill reuse,
# or its route-out to LEGACY/WAYFINDER.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
. "$ROOT/tests/support/contract.sh"

echo "=================================================================="
echo " /supergoal arch contract   skill: $ROOT"
echo "=================================================================="

# SKILL.md wiring
assert_text_ci_normalized "mode table routes ARCHITECTURE" "SKILL.md" "| ARCHITECTURE |"
assert_text_ci_normalized "reference map lists arch" "SKILL.md" "reference/arch.md"

# findings-only boundary
assert_file "arch reference exists" "reference/arch.md"
assert_text_ci_normalized "arch writes no source or test edits" "reference/arch.md" "NO source or test edits"
assert_text_ci_normalized "arch is read-only except the run vault" "reference/arch.md" "read-only except the run vault"

# vocabulary discipline (depth/seam language, used exactly)
assert_text_ci_normalized "arch forbids vocabulary drift" "reference/arch.md" "do not drift into"
assert_text_ci_normalized "arch defines depth" "reference/arch.md" "a lot of behavior behind a small interface"
assert_text_ci_normalized "arch defines shallow" "reference/arch.md" "interface nearly as complex as the implementation"
assert_text_ci_normalized "arch defines the deletion test" "reference/arch.md" "Deletion test"
assert_text_ci_normalized "arch defines seam" "reference/arch.md" "Seam"
assert_text_ci_normalized "arch defines locality" "reference/arch.md" "Locality"

# survey respects existing language and decisions
assert_text_ci_normalized "arch reads repo language first" "reference/arch.md" "CONTEXT.md"
assert_text_ci_normalized "arch does not re-litigate ADRs" "reference/arch.md" "decisions not to re-litigate"
assert_text_ci_normalized "arch explores organically" "reference/arch.md" "Explore organically"

# report
assert_text_ci_normalized "arch report lives in the run vault" "reference/arch.md" "report.html"
assert_text_ci_normalized "arch report never goes to TMPDIR" "reference/arch.md" "not \$TMPDIR"
assert_text_ci_normalized "arch report matches docs language" "reference/arch.md" "docs language (SKILL.md)"
assert_text_ci_normalized "arch grades recommendation strength" "reference/arch.md" "Strong | Worth exploring | Speculative"
assert_text_ci_normalized "arch report ends with top recommendation" "reference/arch.md" "Top recommendation"
assert_text_ci_normalized "arch verifies strong candidates" "reference/arch.md" "re-checked against the cited code"
assert_text_ci_normalized "arch defers interface design" "reference/arch.md" "Do NOT propose interfaces yet"

# visual html report (self-contained, offline - upstream improve-codebase-architecture, supergoal form)
assert_text_ci_normalized "arch report clones the html template" "reference/arch.md" "templates/arch-report.html"
assert_text_ci_normalized "arch report is offline inline css" "reference/arch.md" "inline CSS only"
assert_text_ci_normalized "arch report shows before/after" "reference/arch.md" "before/after"
assert_file "arch report template exists" "templates/arch-report.html"
assert_text_ci_normalized "arch report template grades strength" "templates/arch-report.html" "Worth exploring"
assert_text_ci_normalized "arch report template is self-contained" "templates/arch-report.html" "inline CSS only"
assert_text_ci_normalized "arch report template defaults to Korean lang" "templates/arch-report.html" '<html lang="ko">'
assert_text_ci_normalized "arch report template uses readable Korean body size" "templates/arch-report.html" "17px/1.72"
assert_text_ci_normalized "arch report requires Korean readable minimums" "reference/arch.md" 'at least `17px/1.7`'

# grill the pick (reuse, not reinvent)
assert_text_ci_normalized "arch reuses the wayfinder depth protocol" "reference/arch.md" "reference/wayfinder.md"
assert_text_ci_normalized "arch records rejections as ADRs" "reference/arch.md" "so future surveys don't re-suggest it"
assert_text_ci_normalized "arch skips ephemeral rejection reasons" "reference/arch.md" "skip ephemeral"

# route out
assert_text_ci_normalized "arch routes the refactor out" "reference/arch.md" "hands off to LEGACY or WAYFINDER"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
