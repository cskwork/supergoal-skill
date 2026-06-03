# 2026-06-03 - LEARN Human-to-Code bridge

## Decision

Add a Human-to-Code bridge to LEARN mode for coding, algorithm, and codebase-mechanics lessons:
`human words -> tiny worked example -> explicit rules -> state/variables -> flow/code -> trace`.

`reference/learn.md` now requires a short "사람 생각 -> 기계 단계" bridge before code appears, and
defines the bridge as a two-column teaching tool that scales by difficulty level.

## Reasoning

The existing LEARN mode already handled terms, difficulty, interests, and explain-back, but it could
still jump too quickly from an intuitive explanation to code or system mechanics. The
`human-to-code-translation-skill` pattern is easier to follow because it makes the missing middle step
visible: what a person does naturally must become explicit state, rules, flow, and traceable cases
before it becomes code.

This change is LEARN-only. It does not alter build/debug/legacy gates, worktree isolation, or delivery
verification.

---

# 2026-06-03 - Worktree contract test anchors restored

## Decision

Restore the explicit branch-scoped worktree wording required by `tests/worktree-contract.test.sh` in
`SKILL.md`, `reference/pipeline.md`, and `reference/experts.md`.

## Reasoning

The LEARN change did not touch worktree behavior, but verification exposed that earlier wording
compression removed three contract-anchor phrases. The test is intentionally literal because
branch-scoped isolation prevents multiple agents from editing the same checkout and keeps Build/Fix
writers inside the run worktree.
