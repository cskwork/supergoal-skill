# Changelog 2026-06-03

## Domain Context Overlay

- Added `reference/domain-context.md` so `supergoal` can keep domain expertise separate from the run
  vault and model memory.
- Added `templates/domain-agent/` as the repo-local knowledge scaffold for first-run setup.
- Default storage is `.domain-agent/` at the target repo root, ignored by default through `.gitignore`
  before local knowledge is written.
- The contract keeps current code as the source of truth: saved domain knowledge routes exploration,
  but Plan must verify load-bearing facts against current docs/code.
- Added a freshness policy so future packs use light refresh after 5 days, full review after 30 days,
  and triggered refresh on stale evidence instead of full-pack refresh on every run.

## LEARN Human-to-Code Bridge

### Decision

Add a Human-to-Code bridge to LEARN mode for coding, algorithm, and codebase-mechanics lessons:
`human words -> tiny worked example -> explicit rules -> state/variables -> flow/code -> trace`.

`reference/learn.md` now requires a short "사람 생각 -> 기계 단계" bridge before code appears, and
defines the bridge as a two-column teaching tool that scales by difficulty level.

### Reasoning

The existing LEARN mode already handled terms, difficulty, interests, and explain-back, but it could
still jump too quickly from an intuitive explanation to code or system mechanics. The
`human-to-code-translation-skill` pattern is easier to follow because it makes the missing middle step
visible: what a person does naturally must become explicit state, rules, flow, and traceable cases
before it becomes code.

This change is LEARN-only. It does not alter build/debug/legacy gates, worktree isolation, or delivery
verification.

## Worktree Contract Test Anchors Restored

### Decision

Restore the explicit branch-scoped worktree wording required by `tests/worktree-contract.test.sh` in
`SKILL.md`, `reference/pipeline.md`, and `reference/experts.md`.

### Reasoning

The LEARN change did not touch worktree behavior, but verification exposed that earlier wording
compression removed three contract-anchor phrases. The test is intentionally literal because
branch-scoped isolation prevents multiple agents from editing the same checkout and keeps Build/Fix
writers inside the run worktree.

## Plan Grounding Pressure Test

### Decision

Fold design-tree pressure-test behavior into `supergoal` Plan grounding and the domain-agent
template:

- Walk a design tree by dependencies, one branch at a time.
- Answer questions from current docs/code before asking the human.
- Challenge vague or conflicting terminology against selected knowledge, current repo docs when
  present, and the domain-agent glossary.
- Stress decisions with concrete normal, boundary, failure, and ownership scenarios.
- Save glossary and decision knowledge only after it is resolved and useful for future routing.

### Reasoning

The fallback contract did not spell out terminology pressure, scenario pressure, code contradiction
checks, and the bar for durable decisions. The domain-agent template now carries those rules so
first-run knowledge packs avoid becoming generic implementation notes.
