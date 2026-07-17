#!/bin/bash
# Screen/A-B one seed over an explicit task list, 3 arms, 2 lanes.
#   lane A: main-s<N> arms=baseline,harness skill=current -> baseline + v091
#   lane B: v090-s<N> arms=harness          skill=/tmp/sg-v090 -> v090
# Usage: run_screen.sh <seedN> <task> [task...]
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
N="${1:?seedN}"; shift
TASKS=("$@")
CUR=/Users/danny/Documents/PARA/Resource/supergoal-skill
V090=/tmp/sg-v090
LOG=/tmp/sg-debug-luna/logs; mkdir -p "$LOG"

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
echo "SCREEN-SEED-${N}-DONE $(date +%H:%M:%S)"
