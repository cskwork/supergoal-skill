#!/bin/bash
# local-verify-etree.sh <model.patch|NONE> <outdir>
#
# Evaluator-owned local verifier for DeepSWE task etree-xml-diff-patch.
# It reuses the REPO-OWNED grader (tests/grader.py, byte-identical f2p/p2p
# whitelists in config.json, byte-identical test.patch) and mirrors the two
# `go test` invocations from tests/test.sh VERBATIM (flags, -run regexes,
# build tag, the stray-root-test pre-delete, and the build- event filter).
# Only host-portability changes: env-dir overrides instead of /app,/tests,
# /logs (grader.py documents these overrides), report paths rewritten in a
# COPY of config.json, GIT_CONFIG_GLOBAL isolated, local GOCACHE.
set -uo pipefail
SCRATCH="$(cd "$(dirname "$0")" && pwd)"
TASK="$SCRATCH/deep-swe/tasks/etree-xml-diff-patch"
PATCH="$1"
OUT="$2"
APP="$OUT/app"
VER="$OUT/verifier"
ART="$OUT/artifacts"
rm -rf "$OUT"
mkdir -p "$VER" "$ART" "$OUT/tests"

git clone -q --no-hardlinks "$SCRATCH/etree-template" "$APP"
git -C "$APP" config core.hooksPath /dev/null

if [ "$PATCH" != "NONE" ]; then cp "$PATCH" "$ART/model.patch"; fi

cp "$TASK/tests/test.patch" "$OUT/tests/test.patch"
cp "$TASK/tests/grader.py" "$OUT/tests/grader.py"
python3 - "$TASK/tests/config.json" "$OUT/tests/config.json" "$VER" <<'EOF'
import json, sys
src, dst, ver = sys.argv[1], sys.argv[2], sys.argv[3]
c = json.load(open(src))
c["grade"]["reports"] = [f"{ver}/base-ctrf.json", f"{ver}/new-ctrf.json"]
json.dump(c, open(dst, "w"), indent=1)
EOF

export TESTS_DIR="$OUT/tests" VERIFIER_DIR="$VER" APP_DIR="$APP" ARTIFACTS_DIR="$ART"
export GIT_CONFIG_GLOBAL="$OUT/gitconfig"
touch "$GIT_CONFIG_GLOBAL"

python3 "$OUT/tests/grader.py" prepare || exit $?
if [ -f "$VER/reward.json" ]; then
  echo "[local-verify] model.patch did not apply"
  cat "$VER/reward.json"; echo
  exit 0
fi

cd "$APP"
export PATH="$(go env GOPATH)/bin:$PATH"
export GOCACHE="$OUT/.gocache"
export RUN_LOG="$VER/run.log"
: > "$RUN_LOG"
set +e
# >>> mirrored VERBATIM from tests/test.sh <<<
go test -json -count=1 -timeout 300s -run '^TestDocument$|^TestSelect|^TestFind|^TestPath$|^TestAbsolutePath$' 2>>"$RUN_LOG" \
  | grep -v '"Action":"build-' \
  | tee -a "$RUN_LOG" | go-ctrf-json-reporter -quiet -output "$VER/base-ctrf.json"
find . -maxdepth 1 -name '*_test.go' ! -name 'etree_test.go' ! -name 'diff_test.go' -delete 2>/dev/null || true
go test -json -count=1 -timeout 300s -tags diff -run '^TestOpType|^TestDiff|^TestApplyPatch|^TestMerge|^TestElementsDeepEqual$|^TestElementDeepEqualNamespace$|^TestConflict|^TestReverse|^TestDiffSummary|^TestGenerate' 2>>"$RUN_LOG" \
  | grep -v '"Action":"build-' \
  | tee -a "$RUN_LOG" | go-ctrf-json-reporter -quiet -output "$VER/new-ctrf.json"
# >>> end mirror <<<
set -e
python3 "$OUT/tests/grader.py" grade
echo
cat "$VER/reward.json"; echo
