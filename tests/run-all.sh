#!/usr/bin/env bash
# Canonical local verification for /supergoal. Runs the shell contract suite,
# syntax-checks Node templates, and exercises the optional zero-dependency example
# when the checkout vendors it.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILURES=0

echo "== /supergoal all checks =="
echo "root: $ROOT"

for test in "$ROOT"/tests/*.test.sh; do
  echo
  echo "== bash ${test#"$ROOT"/} =="
  if ! bash "$test"; then
    FAILURES=$((FAILURES + 1))
  fi
done

echo
echo "== node --check templates =="
while IFS= read -r file; do
  echo "node --check ${file#"$ROOT"/}"
  if ! node --check "$file" >/dev/null; then
    FAILURES=$((FAILURES + 1))
  fi
done < <(find "$ROOT/templates" -type f \( -name '*.js' -o -name '*.mjs' \) -print | sort)

echo
echo "== example url-shortener =="
if [ ! -d "$ROOT/examples/url-shortener" ]; then
  echo "SKIP examples/url-shortener not present in this checkout"
elif command -v npm >/dev/null 2>&1; then
  if ! (cd "$ROOT/examples/url-shortener" && npm test); then
    FAILURES=$((FAILURES + 1))
  fi
else
  echo "SKIP npm not on PATH"
fi

echo
if [ "$FAILURES" -eq 0 ]; then
  echo "== /supergoal all checks passed =="
else
  echo "== /supergoal checks failed: $FAILURES step(s) =="
fi

exit "$FAILURES"
