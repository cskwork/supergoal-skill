#!/bin/bash
# Iteration-0 seed: 6 debug tasks x {baseline, harness=v0.9.0}, two lanes in parallel.
# Usage: run_it0.sh [seed-label] [skill-repo] [arms]
# Seed label convention: <armset>-s<N>, e.g. v090-s1 (harness arm = v0.9.0), cand1-s1.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SEED="${1:-v090-s1}"
SKILL="${2:-/Users/danny/Documents/PARA/Resource/supergoal-skill}"
ARMS="${3:-baseline,harness}"
LOG=/tmp/sg-debug-luna/logs
mkdir -p "$LOG"

lane() {
  local lane_id="$1"; shift
  for t in "$@"; do
    echo "[lane $lane_id] START $t $(date +%H:%M:%S)"
    bash "$HERE/run_cell.sh" "$t" "$SEED" "$ARMS" "$SKILL" \
      > "$LOG/${SEED}-${t}.log" 2>&1
    echo "[lane $lane_id] END $t rc=$? $(date +%H:%M:%S)"
  done
}

lane A sympy-21627-cosh-is-zero-recursion sympy-20442-convert-to-orthogonal-units sympy-21055-refine-complex-arg &
PA=$!
lane B sympy-23191-vector-pretty-print-order sympy-24909-milli-prefix-product sympy-22714-point2d-evaluate-false &
PB=$!
wait "$PA" "$PB"
echo "IT0-SEED-DONE $SEED"
