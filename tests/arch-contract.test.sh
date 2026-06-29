#!/usr/bin/env bash
# /supergoal ARCHITECTURE-mode contract.
# Fails if the architecture survey loses its findings-only boundary, its depth/seam
# vocabulary, its run-vault report with recommendation strengths, its grill reuse,
# or its route-out to LEGACY/SPEC.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n' "$label"
    printf '        missing file: %s\n' "$file"
  fi
}

echo "=================================================================="
echo " /supergoal arch contract   skill: $ROOT"
echo "=================================================================="

# SKILL.md wiring
require_text "mode table routes ARCHITECTURE" "SKILL.md" "| ARCHITECTURE |"
require_text "reference map lists arch" "SKILL.md" "reference/arch.md"

# findings-only boundary
require_file "arch reference exists" "reference/arch.md"
require_text "arch writes no source or test edits" "reference/arch.md" "NO source or test edits"
require_text "arch is read-only except the run vault" "reference/arch.md" "read-only except the run vault"

# vocabulary discipline (depth/seam language, used exactly)
require_text "arch forbids vocabulary drift" "reference/arch.md" "do not drift into"
require_text "arch defines depth" "reference/arch.md" "a lot of behavior behind a small interface"
require_text "arch defines shallow" "reference/arch.md" "interface nearly as complex as the implementation"
require_text "arch defines the deletion test" "reference/arch.md" "Deletion test"
require_text "arch defines seam" "reference/arch.md" "Seam"
require_text "arch defines locality" "reference/arch.md" "Locality"

# survey respects existing language and decisions
require_text "arch reads repo language first" "reference/arch.md" "CONTEXT.md"
require_text "arch does not re-litigate ADRs" "reference/arch.md" "decisions not to re-litigate"
require_text "arch explores organically" "reference/arch.md" "Explore organically"

# report
require_text "arch report lives in the run vault" "reference/arch.md" "report.html"
require_text "arch report never goes to TMPDIR" "reference/arch.md" "not \$TMPDIR"
require_text "arch report matches docs language" "reference/arch.md" "docs language (SKILL.md)"
require_text "arch grades recommendation strength" "reference/arch.md" "Strong | Worth exploring | Speculative"
require_text "arch report ends with top recommendation" "reference/arch.md" "Top recommendation"
require_text "arch verifies strong candidates" "reference/arch.md" "re-checked against the cited code"
require_text "arch defers interface design" "reference/arch.md" "Do NOT propose interfaces yet"

# visual html report (self-contained, offline - upstream improve-codebase-architecture, supergoal form)
require_text "arch report clones the html template" "reference/arch.md" "templates/arch-report.html"
require_text "arch report is offline inline css" "reference/arch.md" "inline CSS only"
require_text "arch report shows before/after" "reference/arch.md" "before/after"
require_file "arch report template exists" "templates/arch-report.html"
require_text "arch report template grades strength" "templates/arch-report.html" "Worth exploring"
require_text "arch report template is self-contained" "templates/arch-report.html" "inline CSS only"

# grill the pick (reuse, not reinvent)
require_text "arch reuses the spec grill protocol" "reference/arch.md" "reference/spec.md"
require_text "arch records rejections as ADRs" "reference/arch.md" "so future surveys don't re-suggest it"
require_text "arch skips ephemeral rejection reasons" "reference/arch.md" "skip ephemeral"

# route out
require_text "arch routes the refactor out" "reference/arch.md" "hands off to LEGACY or SPEC"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
