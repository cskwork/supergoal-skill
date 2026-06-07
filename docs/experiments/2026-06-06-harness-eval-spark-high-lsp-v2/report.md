# HARNESS-EVAL Spark high LSP run

Runtime adapter: codex-exec:gpt-5.3-codex-spark:reasoning-high
Pass winner: baseline
Quality winner: harness
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
| revfactory-case-015-lsp | fail | fail | 81 | 82 |

## Quality

- Baseline total: 81/100.
- Harness total: 82/100.
- Quality winner: harness.

## Cost

- Baseline: 4054247 tokens, 254598 ms, 126 parsed tool calls.
- Harness: 2714539 tokens, 207214 ms, 80 parsed tool calls.

## Not Proven

This run has only one hard case, so it cannot prove general harness effectiveness.

## Decision

Not proven
