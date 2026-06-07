# HARNESS-EVAL 3-case pilot

Runtime adapter: codex-exec:gpt-5.5
Winner: tie
Claim status: not_proven

## Summary

- Baseline condition: Codex without supergoal or harness references.
- Harness condition: same Codex model with a copied supergoal skill reference.
- Clean slate: each arm ran in a fresh `/tmp` sandbox.
- Grading: objective machine checks scored before comparing labels.

## Machine Checks

| Difficulty | Case | Baseline | Harness |
|---|---|---|---|
| easy | easy-slugify | pass | pass |
| medium | medium-order-summary | pass | pass |
| hard | hard-safe-redirect | pass | pass |

## Cost

- Baseline: 229344 tokens, 772992 ms, 63 parsed tool calls.
- Harness: 279219 tokens, 953596 ms, 78 parsed tool calls.

## Not proven

The run is a 3-case pilot, so it is too small to claim general harness effectiveness.
Use this as pilot evidence only; expand to 8-15 cases before claiming a stable improvement.

## Decision

Not proven
