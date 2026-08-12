#!/usr/bin/env bash

# Shared assertions for shell contract tests. Callers provide ROOT, PASS, and FAIL.
# Skill files live under skills/supergoal/; resolve_path falls back there for paths
# that no longer exist at the repo root (repo-root files like README.md still resolve).

SKILL_ROOT="$ROOT/skills/supergoal"
[ -d "$SKILL_ROOT" ] || SKILL_ROOT="$ROOT"

resolve_path() {
  if [ -e "$ROOT/$1" ]; then
    printf '%s' "$ROOT/$1"
  else
    printf '%s' "$SKILL_ROOT/$1"
  fi
}

pass_check() {
  PASS=$((PASS + 1))
  printf '  PASS  %s\n' "$1"
}

fail_check() {
  FAIL=$((FAIL + 1))
  printf '  FAIL  %s\n' "$1"
  [ -z "${2:-}" ] || printf '        %s\n' "$2"
}

assert_file() {
  local label="$1" file="$2"
  if [ -f "$(resolve_path "$file")" ]; then
    pass_check "$label"
  else
    fail_check "$label" "missing file: $file"
  fi
}

assert_nonempty_file() {
  local label="$1" file="$2"
  if [ -s "$(resolve_path "$file")" ]; then
    pass_check "$label"
  else
    fail_check "$label" "missing/empty file: $file"
  fi
}

assert_text_ci_normalized() {
  local label="$1" file="$2" text="$3" normalized
  normalized="$(tr '\n\t\r' '   ' < "$(resolve_path "$file")" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    pass_check "$label"
  else
    fail_check "$label" "missing in $file: $text"
  fi
}

refute_text_ci_normalized() {
  local label="$1" file="$2" text="$3" normalized
  normalized="$(tr '\n\t\r' '   ' < "$(resolve_path "$file")" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    fail_check "$label" "forbidden in $file: $text"
  else
    pass_check "$label"
  fi
}

assert_text_exact() {
  local label="$1" file="$2" text="$3"
  if grep -Fq -- "$text" "$(resolve_path "$file")"; then
    pass_check "$label"
  else
    fail_check "$label" "missing exact text in $file: $text"
  fi
}
