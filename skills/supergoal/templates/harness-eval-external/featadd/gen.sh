#!/bin/bash
# FeatAdd generator (BugPilot-style): one feature -> a validated DeepSWE debug task, or DISCARD.
# A builder agent adds a feature that unintentionally breaks existing tests (B); an oracle agent
# fixes it; the broken (feature-applied) state becomes the task, B is fail-to-pass, the fix is gold.
# Runs codex twice (break + oracle) -> do NOT run concurrently with a codex A/B (rate-limit ceiling).
# Usage: gen.sh <feature-id>   (ids from features.tsv). Env: MODEL (default gpt-5.6-luna).
set -uo pipefail
FEAT="${1:?feature-id}"
GEN=/tmp/sympy-gen
PYBIN="$GEN/.venv/bin/python"
HERE="$(cd "$(dirname "$0")" && pwd)"
MODEL="${MODEL:-gpt-5.6-luna}"
WORK=/tmp/featadd/$FEAT; mkdir -p "$WORK"

row=$(awk -F'\t' -v id="$FEAT" '$1==id{print}' "$HERE/features.tsv")
[ -z "$row" ] && { echo "no feature '$FEAT' in features.tsv"; exit 1; }
MODULE=$(printf '%s' "$row" | cut -f3)
PROMPT=$(printf '%s' "$row" | cut -f4)

junit_pass() {  # xml -> passing testcase names, one per line
  "$PYBIN" - "$1" <<'PY'
import sys,xml.etree.ElementTree as ET
for tc in ET.parse(sys.argv[1]).getroot().iter('testcase'):
    if not any(c.tag in ('failure','error') for c in tc): print(tc.get('name'))
PY
}
run_tests() { PYTHONPATH="$GEN" "$PYBIN" -m pytest -q -p no:cacheprovider --junitxml="$1" "$GEN/$MODULE" >/dev/null 2>&1 || true; }
reset_base() { cd "$GEN"; git checkout -q -B master "$BASE" 2>/dev/null; git clean -qfd sympy/ 2>/dev/null; }

cd "$GEN"; git checkout -q -- . 2>/dev/null; git clean -qfd sympy/ 2>/dev/null
BASE=$(git rev-parse HEAD)

echo "[1] base snapshot ($MODULE)"; run_tests "$WORK/base.xml"; junit_pass "$WORK/base.xml" | sort > "$WORK/P0.txt"
echo "    P0=$(wc -l < "$WORK/P0.txt") passing"

echo "[2] BREAK: builder adds feature"
codex exec -m "$MODEL" -s workspace-write -C "$GEN" --skip-git-repo-check \
  "$PROMPT Implement it now in the source. Do NOT edit anything under a tests/ directory." \
  -o "$WORK/break.msg" >/dev/null 2>&1
git add -A 2>/dev/null; git -c user.name=f -c user.email=f@l commit -qm feature 2>/dev/null
git diff "$BASE" HEAD -- 'sympy/**' ':(exclude)sympy/**/tests/**' > "$WORK/feature.diff"
FEATURE=$(git rev-parse HEAD)
[ -s "$WORK/feature.diff" ] || { echo "DISCARD $FEAT: builder produced no source diff"; reset_base; exit 2; }

echo "[3] compute newly-failing B"; run_tests "$WORK/feat.xml"; junit_pass "$WORK/feat.xml" | sort > "$WORK/P1.txt"
comm -23 "$WORK/P0.txt" "$WORK/P1.txt" > "$WORK/B.txt"
nB=$(wc -l < "$WORK/B.txt")
echo "    B=$nB newly-failing; P1=$(wc -l < "$WORK/P1.txt") still passing"
if [ "$nB" -lt 1 ] || [ "$nB" -gt 6 ]; then echo "DISCARD $FEAT: |B|=$nB outside [1,6]"; reset_base; exit 2; fi

echo "[4] ORACLE: solver fixes the regression"
codex exec -m "$MODEL" -s workspace-write -C "$GEN" --skip-git-repo-check \
  "A feature was just added to this repo. These tests in $MODULE now fail: $(paste -sd, "$WORK/B.txt"). Find the root cause and fix the source so they pass again. Do NOT revert the feature and do NOT edit tests." \
  -o "$WORK/oracle.msg" >/dev/null 2>&1
git add -A 2>/dev/null; git -c user.name=f -c user.email=f@l commit -qm fix 2>/dev/null
git diff "$FEATURE" HEAD -- 'sympy/**' ':(exclude)sympy/**/tests/**' > "$WORK/fix.diff"

echo "[5] validate oracle restores B with no P1 regression"; run_tests "$WORK/oracle.xml"; junit_pass "$WORK/oracle.xml" | sort > "$WORK/P2.txt"
stillbad=$(comm -23 "$WORK/B.txt" "$WORK/P2.txt" | wc -l)
p1reg=$(comm -23 "$WORK/P1.txt" "$WORK/P2.txt" | wc -l)
if [ "$stillbad" -ne 0 ] || [ ! -s "$WORK/fix.diff" ] || [ "$p1reg" -ne 0 ]; then
  echo "DISCARD $FEAT: oracle invalid (B still failing=$stillbad, P1 regressions=$p1reg, fix empty=$([ -s "$WORK/fix.diff" ] && echo no || echo yes))"; reset_base; exit 3
fi
echo "    valid: oracle restores all $nB, no P1 regression, fix.diff $(wc -l < "$WORK/fix.diff") lines"

echo "[6] package DeepSWE task"
"$PYBIN" "$HERE/package.py" "$FEAT" "$FEAT" "Regression after adding: $FEAT" "$BASE" "$WORK" "$MODULE"
reset_base
echo "FEATADD-GEN-DONE $FEAT (build image, then dual-validate with pier oracle/nop before A/B)"
