#!/usr/bin/env bash

# Shared assertions for shell contract tests. Callers provide ROOT, PASS, and FAIL.

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
  if [ -f "$ROOT/$file" ]; then
    pass_check "$label"
  else
    fail_check "$label" "missing file: $file"
  fi
}

assert_nonempty_file() {
  local label="$1" file="$2"
  if [ -s "$ROOT/$file" ]; then
    pass_check "$label"
  else
    fail_check "$label" "missing/empty file: $file"
  fi
}

assert_text_ci_normalized() {
  local label="$1" file="$2" text="$3" normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    pass_check "$label"
  else
    fail_check "$label" "missing in $file: $text"
  fi
}

refute_text_ci_normalized() {
  local label="$1" file="$2" text="$3" normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    fail_check "$label" "forbidden in $file: $text"
  else
    pass_check "$label"
  fi
}

assert_text_exact() {
  local label="$1" file="$2" text="$3"
  if grep -Fq -- "$text" "$ROOT/$file"; then
    pass_check "$label"
  else
    fail_check "$label" "missing exact text in $file: $text"
  fi
}
