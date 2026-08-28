#!/usr/bin/env bash
# Agent prompts are shared across harnesses. A bare Claude alias such as
# `model: opus` or `model: sonnet` breaks Pi before a child run can start and
# also outranks Pi's agentOverrides. Model routing belongs to the harness.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
failed=0

for file in "$ROOT"/skills/supergoal/agents/*.md; do
  if grep -Eq '^model:[[:space:]]*' "$file"; then
    echo "FAIL: ${file#"$ROOT"/} pins a harness-specific model"
    failed=1
  fi
done

[ "$failed" -eq 0 ] || exit 1
echo "PASS: all agent prompts are model-neutral"
