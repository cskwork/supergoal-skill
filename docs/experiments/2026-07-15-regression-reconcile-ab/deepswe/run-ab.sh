#!/bin/bash
# DeepSWE old-vs-new harness A/B: forced 5-task suite, medium effort, per-task paired.
# new skill = current checkout (8c01712); old skill = /tmp/sg-skill-old (git worktree @eb1b5c7).
# Interleaved per task so an interruption still leaves complete comparison pairs.
# Requires: Docker running, pier, codex + ~/.codex/auth.json, /tmp/deep-swe-sg benchmark checkout.
set -u
NEW_REPO="/Users/danny/Documents/PARA/Resource/supergoal-skill"
OLD_REPO="/tmp/sg-skill-old"                 # git worktree add /tmp/sg-skill-old eb1b5c7
BENCH="/tmp/deep-swe-sg"
OUT="/tmp/sg-deepswe-ab"
mkdir -p "$OUT"
# Edit TASKS to only the remaining tasks when resuming a partial run.
TASKS=(etree-xml-diff-patch cliffy-config-file-parsing csstree-shorthand-expansion-compression skrub-duration-encoding termenv-preserve-ansi-resets)
COMMON="--arms harness --agent codex --model gpt-5.5 --reasoning-effort medium --codex-auth-json auto --timeout-seconds 900"

run_arm () {
  local repo="$1" arm="$2" task="$3"
  local rr="$OUT/${arm}-${task}"
  echo "[$(date +%H:%M:%S)] START ${arm} ${task}"
  node "$repo/templates/harness-eval-external/deepswe/run-full-cycle.mjs" \
    --task "$task" $COMMON --benchmark-root "$BENCH" --run-root "$rr" --force \
    > "$OUT/${arm}-${task}.log" 2>&1 || echo "[$(date +%H:%M:%S)] ${arm} ${task} runner exited nonzero (continuing)"
  local sc
  sc=$(grep -E "\"reward\"|f2p_passed|p2p_passed|\"partial\"|process_outcome" "$rr/summary.json" 2>/dev/null | head -6 | tr '\n' ' ')
  echo "[$(date +%H:%M:%S)] DONE ${arm} ${task} :: $sc"
}

for t in "${TASKS[@]}"; do
  run_arm "$NEW_REPO" new "$t"
  run_arm "$OLD_REPO" old "$t"
  echo "[$(date +%H:%M:%S)] ---- pair complete: $t ----"
done
echo "ALL_DONE"
