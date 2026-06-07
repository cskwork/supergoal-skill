# HARNESS-EVAL: Archon workflow vs plain Claude (case-015 LSP)

Runtime adapter: claude-baseline vs archon-workflow (model=sonnet)
Pass winner: tie
Quality winner: baseline
Overall winner: not_proven
Claim status: not_proven

## Summary

- Baseline condition: plain Claude Code (`claude -p`, model sonnet), no Archon.
- Harness condition: same Claude model (sonnet) driven through an Archon workflow (bundled archon-implement command).
- Model held constant; the only difference is the Archon workflow scaffolding.
- Clean slate: each arm ran in a fresh /tmp sandbox; hidden tests injected after each agent run.
- Cost note: baseline tokens are precise (claude --output-format json); harness tokens are Archon-pino best-effort (adapter-measured, not directly comparable).

## Machine Checks

| Case | Baseline | Harness | Baseline quality | Harness quality |
|---|---|---|---:|---:|
| revfactory-case-015-lsp | fail | fail | 83 | 82 |

## Quality

- Baseline total: 83/100.
- Harness total: 82/100.
- Quality winner: baseline.

## Cost

- Baseline: 657249 tokens, 434491 ms, null parsed tool calls.
- Harness: 0 tokens, 546305 ms, null parsed tool calls.

## Not Proven

This run has only one hard case, so it cannot prove general harness effectiveness.

## Decision

Not proven
