#!/usr/bin/env bash
# /supergoal active-install audit contract.
# The audit is read-only: it reports copied/symlinked installs and fails only on
# content drift from the supplied source skill.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

PASS=0
FAIL=0
GATE="$ROOT/templates/skill-install-audit.mjs"

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

mk_source() {
  local dir="$T/source/supergoal"
  mkdir -p "$dir"
  cat > "$dir/SKILL.md" <<'EOF'
---
name: supergoal
description: Baseline-first delivery for one objective.
---

# /supergoal
EOF
  printf '%s' "$dir"
}

echo "=================================================================="
echo " /supergoal install-audit contract   skill: $ROOT"
echo "=================================================================="

src="$(mk_source)"
home="$T/home-pass"
mkdir -p "$home/.agents/skills" "$home/.codex/skills" "$home/.claude/skills"
ln -s "$src" "$home/.agents/skills/supergoal"
ln -s "$src" "$home/.codex/skills/supergoal"
ln -s "$src" "$home/.claude/skills/supergoal"
run_case "matching symlink installs pass" 0 "INSTALL-AUDIT PASS" node "$GATE" "$src" --home "$home"

home="$T/home-copy"
mkdir -p "$home/.agents/skills" "$home/.codex/skills" "$home/.claude/skills"
cp -R "$src" "$home/.agents/skills/supergoal"
cp -R "$src" "$home/.codex/skills/supergoal"
cp -R "$src" "$home/.claude/skills/supergoal"
run_case "matching copied installs warn but pass" 0 "WARN copied install" node "$GATE" "$src" --home "$home"

home="$T/home-drift"
mkdir -p "$home/.agents/skills" "$home/.codex/skills" "$home/.claude/skills"
ln -s "$src" "$home/.agents/skills/supergoal"
cp -R "$src" "$home/.codex/skills/supergoal"
printf '\n# stale copy\n' >> "$home/.codex/skills/supergoal/SKILL.md"
ln -s "$src" "$home/.claude/skills/supergoal"
run_case "hash drift fails" 1 "DRIFT" node "$GATE" "$src" --home "$home"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
