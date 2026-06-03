# Changelog 2026-06-03

## LEARN Korean Label Naturalization

### Decision

Keep the internal atom-map decomposition contract, but make Korean LEARN output label it as
`핵심 용어`, `구성 요소`, and `사용되는 용어` instead of literal `원자`.

### Reasoning

The contract needs precise decomposition for agents, but the teaching surface should use idiomatic
Korean. Literal `원자` made the lesson feel translated and unnatural, while `핵심 용어` preserves the
same structure in language a learner expects.

## LEARN Atom Map and Process Trace Enforcement

### Decision

Make LEARN explanations visibly decompose knowledge into an atom map, plain definitions, a process
trace, and only then the composed explanation.

Added `tests/learn-contract.test.sh` so future edits keep the atom-role table, process-trace table,
low-difficulty trace requirement, and glossary-only rejection in place.

### Reasoning

Definitions alone do not explain behavior. The stricter contract forces each lesson to show what
the pieces are, what role each piece plays, and what happens step by step, including decision points,
side effects, and fallback/stop rows when they exist.

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

## Completed Run Worktree Retention

### Decision

Change the post-acceptance worktree policy from remove-after-merge to repo-scoped retention:
`supergoal` keeps the three most recent completed run worktrees and prunes only the oldest
repo-managed completed run worktree when the retained count exceeds three.

### Reasoning

Retained worktrees preserve recent run context for review and follow-up. The cap prevents unbounded
local checkout growth, and the repo-managed boundary avoids deleting the active run worktree, original
checkout, or manual worktrees.

## Agent-Only Skill Entrypoint Compression

### Decision

Compress `SKILL.md` into a thin agent contract: core invariants, mode routing, worktree setup,
gates, vault, dispatch, and reference map.

### Reasoning

Only agents need to operate this file. Detailed explanations already live in `reference/` and gate
scripts, so the entrypoint should route behavior with minimal prose while preserving literal contract
anchors for tests.

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

## Branch Ref Verification Before Worktree

### Decision

Require coding/debug/legacy runs to resolve the target repository first, ask for the source branch
and target branch unless both are explicit, and verify both refs in that repo before creating the run
worktree. Missing refs now stop the run and ask for corrected source/target branch names instead of
guessing from nearby branches.

### Reasoning

The previous wording required base/target collection but did not force repo-local ref verification
before worktree creation. In a multi-repo checkout, a branch name can exist at the umbrella root while
being absent in the actual target repo. The new check prevents wasted `git worktree add` attempts and
keeps branch choice explicit.

## Functional UI design tier

### Decision

Split the UI/UX overlay into two tiers. `reference/ui-ux.md` now classifies a surface as Expressive
(landing/marketing -> `reference/taste-skill-v2.md`) or Functional (dashboard/table/admin/internal
tool -> new `reference/functional-ui.md`). Designer reads whichever authority the conductor names.

### Reasoning

The overlay previously skipped dashboards and internal tools entirely, so the Designer agent and the
contrast gate never ran on them and a plain executor built them with no design discipline. The cause
was not "design does not matter for admin UI" but that taste-skill-v2 is a landing-page ruleset
(hero, motion choreography, anti-slop) that is wrong for dense UI - its own section 13 says so.

Functional UI still needs a baseline: a real design system (Carbon/Fluent/Material/Polaris/Atlaskit/
Radix/shadcn - reusing taste-skill-v2 section 2), computed WCAG contrast (reusing
`templates/contrast-gate.mjs` unchanged), one accent/type/spacing/radius, all UI states
(loading/empty/error/focus/...), density-first dials, minimal motion. The new file carries only that
baseline; the heavy marketing rules stay scoped to the Expressive tier.

Designer hard-visual-bans are now marked: starred (*) bans (one accent, contrast, color-scheme, no
empty decoration) are universal across tiers; the rest stay Expressive-only.

### Files

`reference/functional-ui.md` (new), `reference/ui-ux.md` (tier dispatcher), `agents/designer.md`
(tier-aware authority + starred universal bans), `SKILL.md` (routing + reference map), 
`reference/pipeline.md`, `README.md` (layout note). Full suite green: 74 + 17 + 30 + 11 = 132 passed.

## Gate hardening: tier follow-through + enforced committee/plan-freeze/contrast/cycle-bound

### Decision

Close the loose ends the v0.1.4 tier split left, and convert four contract claims that were prose-only
into machine-checked gates. Driven by an adversarial review (consistency audit + critic) of the skill.

### P0 — finish the tier split

- `reference/experts.md`: the Designer dispatch row pointed only at `taste-skill-v2.md`, so a conductor
  following the table verbatim would hand a Functional surface the Expressive (marketing) authority -
  the exact bug the split was meant to fix. Row + planning note are now tier-routed via `ui-ux.md`.
- `agents/designer.md`: frontmatter and the `taste Pre-Flight` wording were single-tier; made
  tier-neutral and added explicit FUNCTIONAL-TIER bans (design-system-not-hand-rolled, table states,
  density-matches-dial, low motion) so the Functional self-audit is not weaker than Expressive's.
- `reference/qa.md`, `reference/quality-gates.md`: documented the two tiers, the `UI-tier:` line, and
  the now-enforced contrast/committee/plan-freeze/cycle-bound checks.
- `tests/ui-ux-contract.test.sh` (new): 17-assertion contract test guarding the dispatcher, the
  Functional authority, the tier-aware Designer, and the gate wiring against silent regression.

### P1 — enforce the claimed gates

- **Contrast wired into QA gate.** `templates/qa-gate.sh` now detects a `UI-tier:` line (or a
  `qa/contrast-pairs.json`) and runs `contrast-gate.mjs`, failing the gate (and, via the existing
  delivery backstop, Deliver) on a missing pair list or any sub-threshold pair. Previously the
  "contrast blocks Deliver" claim was prose with no gate (`grep -c contrast qa-gate.sh` was 0).
- **Committee + plan-freeze in delivery gate.** `templates/delivery-gate.sh` now requires a
  `Committee:` line in `verification.md` with all three reviewers APPROVED (no reject/changes), and
  recomputes a CR-stripped sha256 of `plan.md` to match `state.json.plan_hash` (RE-PLAN escape via
  `README.md`). Both were declared in SKILL.md/quality-gates but checked nowhere.
- **Cycle bound.** `templates/cycle-bound.mjs` (new) trips at `max_cycles_per_phase` (default 5)
  regardless of error identity - the runaway case the identical-signature circuit breaker never caught.

### Deployment

`supergoal` is symlinked into `~/.claude/skills`, `~/.codex/skills`, and `~/.config/opencode/skills`,
so all three CLIs pick up the repo edits with no copy step.

### Verification

Full suite green: gate-scenarios 92 (was 74; +18 for committee/plan-freeze/contrast/cycle-bound),
ui-ux-contract 17 (new), worktree 17, domain-context 30, learn 11 = 167 passed, 0 failed. The three
REAL committed example vaults (5.2-5.4) updated with a Committee line + computed plan_hash and still
deliver GREEN.

### Files

`reference/experts.md`, `agents/designer.md`, `reference/qa.md`, `reference/quality-gates.md`,
`reference/ui-ux.md`, `reference/functional-ui.md`, `templates/qa-gate.sh`,
`templates/delivery-gate.sh`, `templates/cycle-bound.mjs` (new), `SKILL.md`,
`tests/gate-scenarios.test.sh`, `tests/ui-ux-contract.test.sh` (new), and the three example vaults'
`state.json` + `verification.md`.
