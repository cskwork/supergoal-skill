#!/usr/bin/env bash
# case-015 LSP (expert) at gpt-5.3-codex-spark, HIGH reasoning: baseline vs harness (skill-ref).
# Weaker model + high effort = the regime where the harness previously mattered
# (old skill crashed -> 63; current INLINE skill + stripped ref should stay clean).
# n=1 per arm probe; a crash is a recorded LOSS, not a missing datapoint.
set -u
cd "$(dirname "$0")"
export SG_EVAL_MODEL=gpt-5.3-codex-spark SG_EVAL_EFFORT=high
export SG_EVAL_RUN_ROOT=/tmp/sg-eval-015-spark-high SG_EVAL_TIMEOUT_MS=1800000
node run.mjs
echo "015-SPARK-HIGH DONE exit=$?"
