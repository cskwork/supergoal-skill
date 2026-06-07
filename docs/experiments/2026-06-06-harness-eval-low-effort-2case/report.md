# HARNESS-EVAL low-effort 2-case rerun

Runtime adapter: codex-exec:gpt-5.5:reasoning-low
Pass winner: tie
Quality winner: harness
Overall winner: not_proven
Claim status: not_proven

## Summary

- Baseline condition: Codex without supergoal or harness references.
- Harness condition: same Codex model and low effort with a copied supergoal skill reference.
- Clean slate: each arm ran in a fresh `/tmp` sandbox.
- Hidden tests were injected after each agent run.
- Quality score mirrors RevFactory's 10 dimensions at 0-10 each, total 100.

## Machine Checks

| Difficulty | Case | Baseline pass | Harness pass | Baseline quality | Harness quality |
|---|---|---|---|---:|---:|
| medium | medium-price-basket | pass | pass | 77 | 77 |
| hard | hard-json-patch | pass | pass | 74 | 78 |

## Quality

- Baseline average: 75.5/100.
- Harness average: 77.5/100.
- Quality winner: harness.

## Cost

- Baseline: 126416 tokens, 230677 ms, 26 parsed tool calls.
- Harness: 167992 tokens, 277979 ms, 28 parsed tool calls.

## Not proven

This rerun has only two fresh cases, so it cannot prove general harness effectiveness.

## Decision

Not proven
