#!/bin/bash
# Dual pre-validation gate (PREREG): oracle must grade reward=1, nop must grade
# reward=0 with all F2P failing and all P2P passing. Zero model tokens.
set -uo pipefail
ROOT="${VALIDATE_ROOT:-/tmp/sg-debug-luna/validate}"
mkdir -p "$ROOT"
TASKS=(
  sympy-21627-cosh-is-zero-recursion
  sympy-20442-convert-to-orthogonal-units
  sympy-21055-refine-complex-arg
  sympy-23191-vector-pretty-print-order
  sympy-24909-milli-prefix-product
  sympy-22714-point2d-evaluate-false
)
for t in "${TASKS[@]}"; do
  for agent in oracle nop; do
    out="$ROOT/$t-$agent"
    if [ -f "$out"/*/*/verifier/reward.json ] 2>/dev/null; then echo "skip $t-$agent (done)"; continue; fi
    echo "=== pier $agent $t ==="
    pier run -p "/tmp/deep-swe-sg/tasks/$t" --agent "$agent" -o "$out" --job-name v -q -y \
      || echo "PIER-EXIT-NONZERO $t $agent"
  done
done
echo ALL-VALIDATION-RUNS-DONE
