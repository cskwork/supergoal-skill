#!/usr/bin/env bash
# Under-specified greenfield: does the critic's requirement-surfacing lever beat a
# literal baseline when the unstated requirements are latent-correctness traps?
# baseline=single literal pass; harness=role-loop (build+critic+fixer+verifier).
# n=3 each to beat the +-1-test n=1 noise that produced false "wins" before.
set -u
cd "$(dirname "$0")"
export SG_EVAL_MODEL=gpt-5.5 SG_EVAL_EFFORT=low
export SG_EVAL_BASELINE_SEEDS=3 SG_EVAL_HARNESS_SEEDS=3

SG_EVAL_CASE=u1 SG_EVAL_RUN_ROOT=/tmp/sg-eval-uspec-u1 node run.mjs >run-u1.console.log 2>&1 &
P1=$!
SG_EVAL_CASE=u2 SG_EVAL_RUN_ROOT=/tmp/sg-eval-uspec-u2 node run.mjs >run-u2.console.log 2>&1 &
P2=$!
echo "launched: u1 pid=$P1, u2 pid=$P2"
wait $P1; echo "u1 exit=$?"
wait $P2; echo "u2 exit=$?"
echo "ALL DONE"
