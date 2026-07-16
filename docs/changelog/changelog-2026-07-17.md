# Changelog 2026-07-17

## Final no-skill rerun confirms cand1; v0.9.0 released

**Decision**: ship cand1 (regression reconciliation restored + ephemeral-workspace fast path) as
v0.9.0; merge dev-v2 to main.

- Final gate (owner-requested): rerun the no-skill baseline on the exact cell where cand1 won —
  csstree at medium. Result 76/79 @463s, consistent with the first baseline draw (75/79 @437s).
  Baseline is stable below full solve at n=2; cand1's 79/79 @400s stands as a reproducible
  quality-AND-time win, the first in this repo's eval history.
- Comprehensive standings (6 baseline / 5 recon / 5 cand1 valid task-runs, low+medium):
  f2p cand1 253/265 > recon 251 > baseline 248 (baseline 324/344 incl. basemed2); agent time
  cand1 ≈ baseline (−1.4%), recon +27%. Full data: `autoresearch/classic-260716-2120/`.
- Known open items carried forward: (1) debug-shaped tasks (termenv) show a small consistent
  cand1 loss vs baseline (−1 low, −3 medium; n=1 per cell) — five-gate scaffolding pays off where
  the solution surface is wide, not where a failing test already pins the fix; candidate future
  work is a debug-mode trim, evidence-gated. (2) Input tokens remain ~2x baseline in the
  all-files-embedded benchmark setup; mostly an embed artifact (97% cache hits), real usage loads
  references progressively.
