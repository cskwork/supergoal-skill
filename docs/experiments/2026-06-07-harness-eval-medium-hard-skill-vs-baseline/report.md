# Harness Eval Report — supergoal skill vs baseline (medium + hard + expert)

## Summary

- Cases: revfactory-case-003 (refactoring, medium), -002 (async race, hard), -015 (LSP, expert).
- Runtime adapter: codex-exec; gpt-5.5 @ low (003, 002); gpt-5.3-codex-spark @ high (015).
- Case source: RevFactory hard/expert corpus (`templates/harness-eval-cases/`).
- Pass winner: tie (all three).
- Quality winner: tie (all three).
- Overall winner: tie.
- Claim status: **Not proven** — no machine-check win and no quality win in any regime.

## Verification

| Case | Both arms verified on ground truth? | Hidden-check REDs | REDs fixed | Visible-only false-GREEN? |
|---|---|---|---|---|
| 003 medium (gpt-5.5/low) | yes (`node --test`, canonical test/ reset) | 0 (starter already 14/14; measures preservation) | n/a | no (both 14/14) |
| 002 hard (gpt-5.5/low) | yes | starter fails 3/5 hidden | both arms fixed all (8/8) | no |
| 015 expert (spark/high) | yes | both miss parser error-recovery (1 hidden) | neither fixed | yes, BOTH arms (symmetric, no delta) |

Notes: ground truth = the real source on disk + injected hidden tests; scoring runs on a
throwaway copy whose `test/` is reset to the canonical visible+hidden suite, so neither arm can
move its own denominator.

## Machine Checks

- 003: baseline 14/14, harness 14/14 (n=2 each).
- 002: baseline 8/8, harness 8/8 (n=2 each).
- 015: baseline 11/12, harness 11/12 (n=1 each; same single hidden failure).

## Quality Score (RevFactory 100-pt, label-blind machine scorer)

- 003: 80 / 80. 002: 85 / 83. 015: 85 / 85. No harness quality win anywhere.

## Bug-Catch Matrix

- 002 planted traps (over-serialization on a global lock; concurrent-callers-must-all-reject):
  baseline caught both — no discrimination.
- 015 hidden requirement (parser recovery + semantic diagnostics): missed by both arms.
- Extra bugs discovered: none beyond planted/known.

## Regression Protection

- Permanent hidden tests retained per case (002 race suite, 003 characterization suite, 015 LSP
  hidden suite). All embedded in each run's `run.mjs` and re-runnable.

## Cost / overhead

- 003: harness 4.7x tokens, 9x wall-clock (4-pass role-loop) for identical result.
- 002: harness 2.1x tokens, 2.2x wall-clock (4-pass role-loop) for identical result.
- 015: harness 0.66x tokens, 0.69x wall-clock (1-pass skill-ref) for identical result; no crash.

## Decision

**Not proven.** The skill does not beat a capable baseline on correctness or quality on these
explicit-spec tasks. Demonstrated value is narrow and real: (1) prevents the high-effort
context-window crash of the pre-INLINE skill (confirmed clean at spark/high); (2) in single-pass
skill-ref form, trims ~30% cost on a weaker/high-effort model for the same result. The
4-pass role-loop buys no correctness here and costs 2-5x — reserve it for under-specified work
where the critic has hidden requirements to surface (untested regime). Full analysis: `results.md`.
