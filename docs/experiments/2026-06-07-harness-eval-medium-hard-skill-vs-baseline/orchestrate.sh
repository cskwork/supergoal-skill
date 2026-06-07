#!/usr/bin/env bash
# Drive both cases (003 medium refactor, 002 hard async-race) in parallel.
# baseline vs harness (supergoal role-loop), gpt-5.5 @ low via headroom.
set -u
cd "$(dirname "$0")"
export SG_EVAL_MODEL=gpt-5.5 SG_EVAL_EFFORT=low
export SG_EVAL_BASELINE_SEEDS=2 SG_EVAL_HARNESS_SEEDS=2

SG_EVAL_CASE=003 SG_EVAL_RUN_ROOT=/tmp/sg-eval-svb-003 node run.mjs >run-003.console.log 2>&1 &
P3=$!
SG_EVAL_CASE=002 SG_EVAL_RUN_ROOT=/tmp/sg-eval-svb-002 node run.mjs >run-002.console.log 2>&1 &
P2=$!
echo "launched: case-003 pid=$P3, case-002 pid=$P2"
wait $P3; echo "case-003 exit=$?"
wait $P2; echo "case-002 exit=$?"
echo "ALL DONE"
