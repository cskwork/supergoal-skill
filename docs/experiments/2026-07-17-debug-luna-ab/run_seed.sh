#!/bin/bash
# Run one seed over an explicit task list, two lanes.
# Usage: run_seed.sh <seed-label> <arms> <skill-repo> <task> [task...]
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SEED="$1"; ARMS="$2"; SKILL="$3"; shift 3
TASKS=("$@")
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

half=$(( (${#TASKS[@]} + 1) / 2 ))
lane A "${TASKS[@]:0:$half}" &
PA=$!
if [ "${#TASKS[@]}" -gt "$half" ]; then
  lane B "${TASKS[@]:$half}" &
  PB=$!
  wait "$PA" "$PB"
else
  wait "$PA"
fi
echo "SEED-DONE $SEED"
