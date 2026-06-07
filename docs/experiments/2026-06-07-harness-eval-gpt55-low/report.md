# HARNESS-EVAL Spark high LSP run

Runtime adapter: codex-exec:gpt-5.5:reasoning-high
Pass winner: baseline
Quality winner: baseline
Overall winner: baseline
Claim status: not_proven

## Summary

- Baseline condition: Codex without supergoal or harness references.
- Harness condition: same Codex model and high reasoning with a copied supergoal skill reference.
- Clean slate: each arm ran in a fresh /tmp sandbox.
- Hidden tests were injected after each agent run.

## Machine Checks

| Case | Baseline | Harness | Baseline quality | Harness quality |
|---|---|---|---:|---:|
| revfactory-case-015-lsp | fail | fail | 81 | 79 |

## Quality

- Baseline total: 81/100.
- Harness total: 79/100.
- Quality winner: baseline.

## Cost

- Baseline: 437209 tokens, 190521 ms, 30 parsed tool calls.
- Harness: 352524 tokens, 141868 ms, 24 parsed tool calls.

## Not Proven

This run has only one hard case, so it cannot prove general harness effectiveness.

## Decision

Not proven
