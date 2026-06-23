#!/usr/bin/env bash
# /supergoal SKILL.md frontmatter contract.
# The gate must parse portable YAML frontmatter well enough for block-scalar
# descriptions, because active installs often use `description: >-`.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

PASS=0
FAIL=0
GATE="$ROOT/templates/skill-frontmatter-gate.mjs"

run_case() {
  local label="$1" expected="$2" needle="$3"; shift 3
  local out status
  out="$("$@" 2>&1)"
  status=$?
  if [ "$status" -eq "$expected" ] && printf '%s' "$out" | grep -Fq "$needle"; then
    PASS=$((PASS + 1))
    printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %s\n        exit=%s want=%s needle=%s out=%s\n' \
      "$label" "$status" "$expected" "$needle" "$(printf '%s' "$out" | tr '\n' '|' | cut -c1-180)"
  fi
}

skill_dir() {
  local name="$1"
  local dir="$T/$name"
  mkdir -p "$dir"
  printf '%s' "$dir"
}

echo "=================================================================="
echo " /supergoal skill-frontmatter contract   skill: $ROOT"
echo "=================================================================="

d="$(skill_dir alpha-skill)"
cat > "$d/SKILL.md" <<'EOF'
---
name: alpha-skill
description: Build the smallest correct thing and verify it.
---

# Alpha
EOF
run_case "plain description passes" 0 "OK:" node "$GATE" "$d"

d="$(skill_dir folded-skill)"
cat > "$d/SKILL.md" <<'EOF'
---
name: folded-skill
description: >-
  Baseline-first delivery for one objective.
  Use when work needs real verification.
when_to_use: >-
  Bug fixes, features, QA-only checks, and harness evaluation.
---

# Folded
EOF
run_case "folded description parses and passes" 0 "OK:" node "$GATE" "$d"

d="$(skill_dir empty-folded)"
cat > "$d/SKILL.md" <<'EOF'
---
name: empty-folded
description: >-
---

# Empty
EOF
run_case "empty folded description fails" 1 "description is empty" node "$GATE" "$d"

d="$(skill_dir huge-folded)"
{
  printf -- '---\nname: huge-folded\ndescription: >-\n'
  i=0
  while [ "$i" -lt 110 ]; do
    printf '  repeated sentence that makes the skill listing too long.\n'
    i=$((i + 1))
  done
  printf -- '---\n\n# Huge\n'
} > "$d/SKILL.md"
run_case "folded description counts toward cap" 1 "description + when_to_use" node "$GATE" "$d"

d="$(skill_dir claude)"
cat > "$d/SKILL.md" <<'EOF'
---
name: claude
description: Reserved names must be rejected.
---

# Reserved
EOF
run_case "reserved name fails" 1 "reserved word" node "$GATE" "$d"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
