# HARNESS-EVAL Spark high LSP run

Runtime adapter: codex-exec:gpt-5.3-codex-spark:reasoning-high
Pass winner: tie
Quality winner: tie
Overall winner: tie
Claim status: not_proven

## Summary

- Baseline condition: Codex without supergoal or harness references.
- Harness condition: same Codex model and high reasoning with a copied supergoal skill reference.
- Clean slate: each arm ran in a fresh /tmp sandbox.
- Hidden tests were injected after each agent run.

## Machine Checks

| Case | Baseline | Harness | Baseline quality | Harness quality |
|---|---|---|---:|---:|
| revfactory-case-015-lsp | fail | fail | 85 | 85 |

## Quality

- Baseline total: 85/100.
- Harness total: 85/100.
- Quality winner: tie.

## Cost

- Baseline: 3281396 tokens, 198484 ms, 88 parsed tool calls.
- Harness: 2166493 tokens, 136723 ms, 88 parsed tool calls.

## Findings

- "fail/fail" above means "not a clean sweep": each arm passed **11/12** checks. Both miss the
  SAME single hidden requirement — `parser recovers from syntax errors and still reports semantic
  diagnostics`. All 5 visible + 2 other hidden tests pass on both arms.
- **No crash.** The pre-INLINE skill crashed this exact regime (turns 0, exit 1, 0 tokens; harness
  log 191-267 lines with leaked eval yaml + repeated full rewrites). With the current INLINE skill
  and a stripped skill-ref (SKILL.md + reference + agents, no `templates/`), the harness arm ran
  clean in a 110-line log and completed in 1 turn.
- **Harness was cheaper, same result:** 2.17M vs 3.28M tokens (-34%), 137s vs 198s (-31%).
- Symmetric visible-only false-GREEN: both arms pass all visible tests yet miss the parser-recovery
  hidden requirement — no delta between arms. The harness here was the single-pass skill-ref arm, so
  no critic ran to surface that gap; role-loop @ spark-high is the natural follow-up.

This run is part of the medium+hard+expert sweep; cross-regime analysis lives in
`../2026-06-07-harness-eval-medium-hard-skill-vs-baseline/results.md`.

## Not Proven

This run has only one expert case at n=1, so it cannot prove general harness effectiveness.

## Decision

Not proven
