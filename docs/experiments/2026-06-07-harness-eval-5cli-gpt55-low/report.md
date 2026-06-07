# HARNESS-EVAL: 5 CLIs, gpt-5.5 @ low, case-015 LSP

Runtime: same-model A/B/C/D/E. `gpt-5.5` @ `reasoning_effort=low`, all arms via the local headroom
proxy. Only the CLI/harness wrapper varies. n=1 (one hard case, one run per arm) -> **directional**.

## Verdict

| arm | tests | quality | wall-clock | tool calls | result |
|---|---|---:|---:|---:|---|
| codex (bare) | 7/9 | 81 | 181 s | 30 | tie-top |
| codex + supergoal | 7/9 | 81 | 172 s | 28 | tie-top |
| ohmypi | 7/9 | 81 | 189 s | 16 | tie-top |
| hermes | 7/9 | 81 | 145 s | 5 | tie-top, fastest |
| codex + AGENTS.md | 6/9 | 79 | 209 s | 36 | loser, costliest |

- **Best overall: bare `codex`** - top result at the lowest codex cost and simplest setup. **`hermes`**
  matches it with the lowest wall-clock / fewest tool calls (best efficiency if you want it).
- **No wrapper beat the bare baseline on score.** AGENTS.md coding rules *lowered* it and cost 1.52x the
  tokens; supergoal tied bare at ~3% overhead; ohmypi tied at a heavier loop.
- **All five shipped false-GREEN:** visible `npm test` 5/5 while 2-3 hidden behaviors stay broken.
  `completion prefix + signatures` was missed by every arm - a model/effort ceiling, not a harness gap.

## Decision

Directional, not proven (n=1). For a hard, explicitly-specified task at gpt-5.5/low, the plain CLI
(bare codex, or hermes for speed) is the best choice; added rule/skill scaffolding adds cost without
raising the score, and the coding-rules AGENTS.md is net-negative. To fix the unshipped hidden
behaviors, raise reasoning effort - not the harness. This corroborates the existing baseline-first
finding across one more, broader (cross-CLI) configuration.

See `results.md` for the full per-check vector, bug-catch matrix, and signal-vs-noise breakdown.
