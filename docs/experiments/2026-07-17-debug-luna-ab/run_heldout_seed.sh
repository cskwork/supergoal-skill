#!/bin/bash
# Held-out A/B one seed: 3 tasks x {baseline, v091(current HEAD), v090(/tmp/sg-v090)} in 2 lanes.
#   lane A: main-s<N>  arms=baseline,harness  skill=current repo  -> baseline + v091
#   lane B: v090-s<N>  arms=harness           skill=/tmp/sg-v090  -> v090
# Peak concurrency = 2 codex agents (host-proven in debug-luna). Usage: run_heldout_seed.sh <N>
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
N="${1:?seed number}"
CUR=/Users/danny/Documents/PARA/Resource/supergoal-skill
V090=/tmp/sg-v090
LOG=/tmp/sg-debug-luna/logs; mkdir -p "$LOG"
TASKS=(
  sympy-20212-zero-pow-neg-inf
  sympy-24066-collect-factor-exp-dimensionless
  sympy-24213-collect-factor-equivalent-dims
)

lane() {
  local seed="$1" arms="$2" skill="$3"; shift 3
  for t in "$@"; do
    echo "[${seed}] START $t $(date +%H:%M:%S)"
    bash "$HERE/run_cell.sh" "$t" "$seed" "$arms" "$skill" > "$LOG/${seed}-${t}.log" 2>&1
    echo "[${seed}] END $t rc=$? $(date +%H:%M:%S)"
  done
}

lane "main-s${N}" "baseline,harness" "$CUR"  "${TASKS[@]}" &
PA=$!
lane "v090-s${N}" "harness"          "$V090" "${TASKS[@]}" &
PB=$!
wait "$PA" "$PB"
echo "HELDOUT-SEED-${N}-DONE $(date +%H:%M:%S)"
