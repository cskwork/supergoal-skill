#!/bin/bash
# Candidate-edit A/B: v091 (current HEAD) vs v092 (/tmp/sg-v092, exception-owner generalization).
# Both are harness arms (no baseline; baseline is task-property, already measured).
#   lane A: v092-s<N>  harness skill=/tmp/sg-v092
#   lane B: v091b-s<N> harness skill=current HEAD
# Usage: run_v092ab.sh <seedN> <task> [task...]
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
N="${1:?seedN}"; shift
TASKS=("$@")
CUR=/Users/danny/Documents/PARA/Resource/supergoal-skill
V092=/tmp/sg-v092
LOG=/tmp/sg-debug-luna/logs; mkdir -p "$LOG"

lane() {
  local seed="$1" skill="$2"; shift 2
  for t in "$@"; do
    echo "[${seed}] START $t $(date +%H:%M:%S)"
    bash "$HERE/run_cell.sh" "$t" "$seed" "harness" "$skill" > "$LOG/${seed}-${t}.log" 2>&1
    echo "[${seed}] END $t rc=$? $(date +%H:%M:%S)"
  done
}

lane "v092-s${N}"  "$V092" "${TASKS[@]}" &
PA=$!
lane "v091b-s${N}" "$CUR"  "${TASKS[@]}" &
PB=$!
wait "$PA" "$PB"
echo "V092AB-SEED-${N}-DONE $(date +%H:%M:%S)"
