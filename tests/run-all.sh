#!/usr/bin/env bash
# Canonical local verification for /supergoal. Runs the shell contract suite,
# syntax-checks Node templates, and exercises the zero-dependency example.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== /supergoal all checks =="
echo "root: $ROOT"

for test in "$ROOT"/tests/*.test.sh; do
  echo
  echo "== bash ${test#"$ROOT"/} =="
  bash "$test"
done

echo
echo "== node --check templates =="
for file in "$ROOT"/templates/*.mjs "$ROOT"/templates/teach/assets/*.js; do
  echo "node --check ${file#"$ROOT"/}"
  node --check "$file" >/dev/null
done

echo
echo "== example url-shortener =="
if command -v npm >/dev/null 2>&1; then
  (cd "$ROOT/examples/url-shortener" && npm test)
else
  echo "SKIP npm not on PATH"
fi

echo
echo "== /supergoal all checks passed =="
