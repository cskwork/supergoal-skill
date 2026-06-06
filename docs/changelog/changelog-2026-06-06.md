# 2026-06-06

## LEARN wording polish without runtime checklist

Decision: polish compressed `supergoal`/LEARN contract prose without adding a new LEARN response checklist.

Why: the runtime checklist idea would add another instruction to evaluate on every teaching turn. The safer improvement is to restore clipped sentences that could be misread, while keeping the existing contract tests as the guardrail.

Changed:

- Clarified that the conductor orchestrates and does not approve work directly.
- Reworded LEARN's no-code boundary and lightweight flow sentence.
- Tightened LEARN journal/profile prose without changing the teaching sequence.

Verification target:

- Existing LEARN and gate contract tests should continue to pass unchanged.
