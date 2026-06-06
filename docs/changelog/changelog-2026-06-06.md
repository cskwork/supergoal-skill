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

## Runtime-neutral harness workflows

Decision: integrate Harness as two supergoal workflows, not as a Claude-only runtime assumption.
HARNESS-MAKE designs approved agent/skill/orchestrator packs. HARNESS-EVAL tests whether a harness
actually helps by comparing the same repo snapshot with and without the harness.

Reasoning: the RevFactory workflow is useful for structure, but its reported effectiveness is
author-measured and Claude Code-specific. The durable supergoal value is the gated design method,
runtime adapter boundary, and evidence-first A/B evaluation.

Changed:
- Added `reference/harness-make.md`, `reference/harness-patterns.md`, and portable harness templates.
- Added `reference/harness-eval.md`, eval case/result/report templates, and `harness-eval-gate.mjs`.
- Added contract tests for both workflows.
- Added compact `SKILL.md` Step 0 route rows plus reference-map load pointers.

Verification target:
- Harness contract tests plus existing supergoal contract tests should pass.

## LEARN contract anchor restore

Decision: restore two exact `reference/learn.md` anchors required by `tests/learn-contract.test.sh`.

Reasoning: the LEARN prose already preserved process traces, but the contract suite checks literal
phrases. Restoring the anchors keeps the behavior and the safety test aligned.

## Harness review fixes

Decision: harden the harness integration after review.

Changed:
- HARNESS-EVAL gate now requires structured machine checks with name, status, and evidence.
- `claim_status: proven` requires passing machine checks for both baseline and harness runs.
- Cost evidence now includes `tool_calls`.
- HARNESS-MAKE and HARNESS-EVAL are in the Step 0 mode table, not only the addendum.
- LEARN compatibility anchors are comments, avoiding conflict with the visible no-table trace rule.

## README and landing harness copy

Decision: expose HARNESS-MAKE and HARNESS-EVAL in the public README and landing page without claiming
unproven effectiveness.

Changed:
- README now lists the two harness workflows, examples, and layout references.
- Landing page mode count and mode cards now include harness design and effectiveness testing.
- Landing copy says weak harness evidence is `Not proven`.
