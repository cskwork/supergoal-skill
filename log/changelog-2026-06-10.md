# Changelog 2026-06-10

## LEARN mode: single recap question -> interview-style check

### What
Replaced the "ask exactly one recap/check question per turn" rule in LEARN mode with an
interview-style check: each teaching turn (and the opening) now ends with a short, difficulty-scaled
set of questions drawn from different angles (recall / why / process / apply-transfer / edge-failure
/ connect), then the difficulty menu.

Files (live only; `docs/experiments/*` snapshots and prior changelogs left untouched):
- `reference/learn.md` - Teach loop step, new `## Interview check` section, opening template, Rules
  block, Tutor contract item 11.
- `docs/learn-standalone-prompt.md` - mirrored the same change (template, code-topic line, Questions
  section, Teach loop) so the standalone prompt stays in sync with the skill contract.

### Why
User wants the bite-sized explain-then-check loop to actively induce learning rather than let the
user passively nod. A single flat recap question tests one facet; a small multi-angle interview
forces real retrieval and transfer (active recall + elaboration).

### How the prior concern is preserved
The 2026-06-07 change deliberately capped questions to stop "mid-lesson question spray." This reverses
that cap on purpose, but keeps it bite-sized by scaling count to difficulty (1-2: one gentle recall;
5 default: two-three; 8-10: three-four incl. edge/transfer) and staying conversational - answer in
any order, as far as you can, re-ask only the misses. Not an exam.

### Verification
- `tests/learn-contract.test.sh`: 12 passed, 0 failed (anchors unaffected - they check decomposition
  and process-trace requirements, not question count).
- grep confirms no leftover "exactly one recap" / "one question at a time" / "exactly two questions"
  in live `reference/` or the standalone prompt.
