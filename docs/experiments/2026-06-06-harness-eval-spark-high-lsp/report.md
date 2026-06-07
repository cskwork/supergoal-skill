# HARNESS-EVAL Spark high LSP run

Runtime adapter: codex-exec:gpt-5.3-codex-spark:reasoning-high
Pass winner: tie
Quality winner: baseline
Overall winner: not_proven
Claim status: not_proven

## Summary

- Baseline condition: Codex without supergoal or harness references.
- Harness condition: same Codex model and high reasoning with a copied supergoal skill reference.
- Clean slate: each arm ran in a fresh /tmp sandbox.
- Hidden tests were injected after each agent run.

## Machine Checks

| Case | Baseline | Harness | Baseline quality | Harness quality |
|---|---|---|---:|---:|
| revfactory-case-015-lsp | fail | fail | 65 | 63 |

## Quality

- Baseline total: 65/100.
- Harness total: 63/100.
- Quality winner: baseline.

## Cost

- Baseline: 2191777 tokens, 189720 ms, 0 parsed tool calls.
- Harness: 0 tokens, 407302 ms, 0 parsed tool calls.

## Not Proven

This run has only one hard case, so it cannot prove general harness effectiveness.

## Decision

Not proven
