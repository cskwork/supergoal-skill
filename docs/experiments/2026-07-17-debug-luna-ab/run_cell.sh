#!/bin/bash
# One A/B cell: run-full-cycle on one task, given arms/seed/skill-repo.
# Usage: run_cell.sh <task> <seed-label> <arms> [skill-repo]
set -uo pipefail
TASK="$1"; SEED="$2"; ARMS="$3"; SKILL="${4:-/Users/danny/Documents/PARA/Resource/supergoal-skill}"
RUN_ROOT="/tmp/sg-debug-luna/runs/${SEED}/${TASK}"
mkdir -p "$(dirname "$RUN_ROOT")"
node /Users/danny/Documents/PARA/Resource/supergoal-skill/templates/harness-eval-external/deepswe/run-full-cycle.mjs \
  --task "$TASK" \
  --benchmark-root /tmp/deep-swe-sg \
  --run-root "$RUN_ROOT" \
  --agent codex \
  --model gpt-5.6-luna \
  --reasoning-effort medium \
  --codex-auth-json auto \
  --timeout-seconds 900 \
  --arms "$ARMS" \
  --skill-repo "$SKILL" \
  --force
echo "CELL-DONE ${SEED} ${TASK} ${ARMS} exit=$?"
