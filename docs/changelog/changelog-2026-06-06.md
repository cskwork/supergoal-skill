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

## HARNESS-MAKE active install target

Decision: approved harness generation installs to an active runtime adapter target, not an inert draft folder.

Changed:
- `reference/harness-make.md` separates `draft_root` from `active_install_target`, states that draft paths are not active runtime registries, and continues automatically after explicit approval unless a new overwrite or install target appears.
- `templates/harness-spec.md`, `templates/harness-agent.md.template`, and `templates/harness-skill.md.template` record draft and active install paths.
- `README.md` and `SKILL.md` reflect the active install target rule.

Verification: added `tests/harness-make-contract.test.sh` to assert the HARNESS-MAKE active-install contract.
## SSRF harness-eval and regression-ratchet hardening

Decision: treat the SSRF skill-vs-no-skill result as a claim-completeness failure, not proof that the
skill catches every hard security bug.

Reason: both arms still shipped the trailing-dot SSRF bypass, so the effective lever is bounding the
verified claim set and forcing durable regression protection for high-risk fixes.

Changed: HARNESS-EVAL now records bug-catch, false-GREEN, and regression-protection outcomes. Deliver
now requires `High-risk fixed RED:` in `verification.md` and blocks high-risk fixed REDs with
`Regression tests: none` unless a `Regression exception:` reason is recorded.

## HARNESS-EVAL 3-case pilot run

Decision: run the requested one-pass eval as a 3-case clean-slate Codex pilot, not as a generalized effectiveness claim.

Reasoning: one easy, one medium, and one hard case can prove the eval harness works mechanically, but it is too small to prove that `supergoal` improves outcomes.

Outcome:
- Baseline Codex and Codex with a copied `supergoal` skill reference both passed all three cases.
- Winner is `tie`; `claim_status` remains `not_proven`.
- The harness arm used more runtime, tokens, and parsed tool calls, so the pilot shows overhead without a quality delta.

Artifacts:
- Ignored local run files live under `docs/experiments/2026-06-06-harness-eval-3case/`.

## HARNESS-EVAL RevFactory-style quality score

Decision: make HARNESS-EVAL report both pass/fail evidence and a RevFactory-style 100-point quality score.

Reasoning: the upstream Harness experiment scores outputs across 10 quality dimensions, so supergoal evals should not collapse comparison to machine-check pass status alone.

Changed:
- `reference/harness-eval.md` adds a `Quality Score` phase before blind grading.
- `templates/harness-eval-result.json` now includes `quality.baseline` and `quality.harness` scored across 10 dimensions.
- `templates/harness-eval-report.md` adds a `## Quality Score` section and score anchors.
- `templates/harness-eval-gate.mjs` blocks missing or out-of-range quality scores and blocks `claim_status: proven` unless the harness also wins quality.
- `tests/harness-eval-contract.test.sh` covers complete, missing, invalid, and quality-loss result cases.

## HARNESS-EVAL low-effort 2-case rerun

Decision: rerun HARNESS-EVAL with `gpt-5.5` low reasoning effort on two fresh tasks and evaluate both pass/fail and quality.

Reasoning: the previous 3-case pilot only showed pass/fail parity. The RevFactory-style quality score gives a second axis for structure, test coverage, correctness, and maintainability.

Outcome:
- Medium price-basket task: baseline pass, harness pass, quality 77 vs 77.
- Hard JSON Patch task: baseline pass, harness pass, quality 74 vs 78.
- Aggregate pass winner is `tie`; quality winner is `harness` at 77.5 vs 75.5.
- Overall `claim_status` remains `not_proven` because two cases are too small and harness cost was higher.

## HARNESS-EVAL reusable case templates

Decision: keep reusable HARNESS-EVAL case templates all and only from RevFactory's
`claude-code-harness`. Reasoning: ignored local experiment folders are run evidence, while future
clean-slate evaluations need stable external templates with machine-check, hidden-check,
regression-protection, cost, and RevFactory-style quality-score fields.

Changed: replaced local pilot/rerun reusable case templates with RevFactory case-001 through case-015
under `templates/harness-eval-cases/`. Each template keeps the upstream source URL plus supergoal's
HARNESS-EVAL fields. `reference/harness-eval.md`, `README.md`, `SKILL.md`, and
`templates/harness-eval-report.md` now point at the reusable case directory. HARNESS-EVAL contract
test requires exactly 15 `revfactory-case-*.yaml` files and checks each reusable case for
`machine_checks`, `hidden_checks`, `quality_score`, `source_url`, and `persist_path`.
