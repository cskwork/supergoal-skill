# Improve-Pass Docs And Symphony Kanban Workflow Plan

> Plan only. Do not implement these changes until the plan is approved.

## Goal

Document the latest eval learning in `supergoal-skill`, then apply the same delivery loop to Symphony's default Kanban workflow in `/Users/danny/Documents/PARA/Resource/symphony-multi-agent`.

Target loop:

```text
Build -> Improve full spec -> Improve edge cases -> Final Verify
```

Expected outcome:

- Supergoal docs explain the result plainly: meaningful lift over single-pass baseline, but no overclaim that "skill use" alone beat the equal-compute no-skill loop.
- Symphony default workflow makes the same loop visible and checkable on every non-trivial ticket.
- Symphony keeps the current 4 active Kanban lanes unless evidence says strict fresh-agent role fidelity is worth more lane complexity.

## Theory

The latest result suggests the useful variable is not the label "skill" by itself. The useful variable is forcing comparable compute into three extra checks after the first build:

1. Re-read the whole stated and implied spec.
2. Attack edge/error/recovery/concurrency/compatibility cases.
3. Run a fresh adversarial verification against real evidence.

Real-world mapping for Symphony:

- `In Progress` is the maker lane: build the change, then run two explicit improvement passes before handing off.
- `Verify` is the release gate: review, QA, merge preflight, and evidence.
- `Learn` stays the knowledge handoff lane.
- The ticket body is the durable contract between agents, so the new loop should be written as named ticket sections, not only hidden prompt prose.

## Important Current State

Supergoal already changed the contract spine:

- `SKILL.md` says the default core is `Build -> Improve full spec -> Improve edge cases -> Final Verify`.
- `reference/role-loop.md` defines those roles and keeps Critic/Fixer as optional escalation.
- `docs/changelog/changelog-2026-07-03.md` records the latest retest numbers and interpretation.

Supergoal docs still need public-facing sync:

- `README.md` and `README.ko.md` still summarize the loop as `Build -> Forced Verify`.
- `docs/index.html` and `docs/harness-eval-explained.md` should explain the same result without overclaim.
- `reference/harness-eval.md` should include the interpretation rules that came up in the conversation: hidden tests, false green, headroom, equal-compute, and `Not proven`.

Symphony current default workflow:

- Active states are `Todo`, `In Progress`, `Verify`, `Learn`.
- `WORKFLOW.file.example.md` and `WORKFLOW.example.md` describe `"In Progress": "Plan + TDD implementation + self-critique"`.
- `docs/symphony-prompts/{file,linear}/stages/in-progress.md` asks for `## Self-Critique`.
- `src/symphony/orchestrator/contracts.py` requires `## Plan`, `## Acceptance Tests`, `## Done Signals`, `## Implementation`, and `## Self-Critique` before leaving `In Progress`.
- `tests/test_workflow_pipeline_prompt.py`, `tests/test_orchestrator_contracts.py`, `tests/test_orchestrator_contract_integration.py`, and `tests/test_agent_lifecycle_e2e.py` pin the prompt and contract behavior.

## Recommended Approach

Keep four visible active lanes for this change:

```text
Todo -> In Progress -> Verify -> Learn -> Human Review -> Done
```

Inside `In Progress`, replace the vague self-critique-only handoff with a checkable sequence:

```text
Build -> Improve Full Spec -> Improve Edge Cases -> Self-Critique -> Verify
```

Rationale:

- It preserves the recent 4-stage simplification and avoids a second workflow migration.
- It makes the better loop measurable by requiring named sections in the ticket.
- It gives `Verify` a concrete audit surface.
- It is lower risk than adding new lanes before dogfooding.

Known limitation:

- This does not guarantee fresh agent context for each improve pass on every backend. It asks for subagents where the CLI supports them and uses a fresh `Verify` agent as the independent gate. If dogfood still shows false green, the next plan should promote `Improve Full Spec` and `Improve Edge Cases` into separate active states.

Rejected for this pass:

- Add new default lanes `Build`, `Improve Full Spec`, `Improve Edge Cases`, `Verify`: best role fidelity, but higher operator/UI churn and a reversal of the just-shipped 4-stage simplification.
- Prompt-only guidance with no contract sections: lowest migration risk, but weak models can still skip the useful passes silently.
- Make Critic/Fixer the default again: latest evidence says equal-compute improve passes are the stronger default; Critic/Fixer remain for under-specified latent-correctness work.

## Task 1 - Supergoal Public Docs Sync

Files to edit in `/Users/danny/Documents/PARA/Resource/supergoal-skill`:

- `README.md`
- `README.ko.md`
- `docs/index.html`
- `docs/harness-eval-explained.md`
- `reference/harness-eval.md`
- `docs/changelog/changelog-2026-07-04.md`

Changes:

- Replace public shorthand `Build -> Forced Verify` with `Build -> Improve full spec -> Improve edge cases -> Final Verify`.
- Explain "meaningful improvement" as:
  - improved over single-pass baseline in hidden tests and false-green count;
  - not proven to beat the no-skill equal-compute loop;
  - therefore the adopted lesson is the equal-compute loop, not extra ceremony.
- Add a short glossary:
  - `Hidden tests`: evaluator-owned checks the agent cannot see.
  - `False green`: the arm reports done/green while hidden or ground-truth checks still fail.
  - `Headroom`: room for a harness to improve; if both arms saturate, report `Not proven`.
  - `Equal-compute`: both arms spend comparable build/improve/verify passes, so the process shape is the measured variable.
- Keep English and Korean README surfaces aligned.
- Add the decision and rejected alternatives to `docs/changelog/changelog-2026-07-04.md` per repo rule.

Checks:

```bash
cd /Users/danny/Documents/PARA/Resource/supergoal-skill
rtk proxy bash tests/role-loop-contract.test.sh
rtk proxy bash tests/run-all.sh
rtk rg -n "Build -> Forced Verify|Forced Verify" README.md README.ko.md docs/index.html docs/harness-eval-explained.md
rtk rg -n "Build -> Improve full spec -> Improve edge cases -> Final Verify" README.md README.ko.md docs/index.html docs/harness-eval-explained.md reference/harness-eval.md
```

Acceptance:

- No remaining public doc implies the old default is only `Build -> Forced Verify`.
- Docs state the latest result as measured evidence, not a blanket skill win.
- `tests/run-all.sh` passes.

## Task 2 - Symphony Tests First

Worktree:

```bash
cd /Users/danny/Documents/PARA/Resource/symphony-multi-agent
git status --short
git switch -c feat/improve-pass-default-workflow
```

Files to edit first:

- `tests/test_workflow_pipeline_prompt.py`
- `tests/test_orchestrator_contracts.py`
- `tests/test_orchestrator_contract_integration.py`
- `tests/test_agent_lifecycle_e2e.py`
- `docs/PIPELINE-DEMO.md`

Test changes:

- In `IN_PROGRESS_RULES`, require:
  - `Build -> Improve full spec -> Improve edge cases -> Final Verify`
  - `## Improve Full Spec`
  - `## Improve Edge Cases`
  - production/domain ambiguity becomes an `ask-user` gate
  - ambiguous generic coding-task choices use a conservative reversible default and record it
  - `state to Verify`
- In the complete `In Progress` body fixture, add:
  - `## Improve Full Spec`
  - `## Improve Edge Cases`
  - keep `## Self-Critique` as a short residual-risk summary for compatibility and readability.
- Add a failing contract test proving `In Progress` cannot move on when either improve-pass section is missing.
- Update `docs/PIPELINE-DEMO.md` so the worked ticket has both improve-pass sections.
- Add/adjust a Verify prompt test that checks Verify reviews the implementation against both improve-pass sections, not only `Self-Critique`.

First expected test state:

```bash
cd /Users/danny/Documents/PARA/Resource/symphony-multi-agent
PYTHONPATH=src python -m pytest -q tests/test_workflow_pipeline_prompt.py tests/test_orchestrator_contracts.py tests/test_orchestrator_contract_integration.py tests/test_agent_lifecycle_e2e.py
```

Expected before implementation:

- Prompt and contract tests fail on missing anchors/sections.

## Task 3 - Symphony Prompt And Contract Implementation

Files to edit:

- `docs/symphony-prompts/file/stages/in-progress.md`
- `docs/symphony-prompts/linear/stages/in-progress.md`
- `docs/symphony-prompts/file/stages/verify.md`
- `docs/symphony-prompts/linear/stages/verify.md`
- `docs/symphony-prompts/file/base.md`
- `docs/symphony-prompts/linear/base.md`
- `src/symphony/orchestrator/contracts.py`
- `WORKFLOW.file.example.md`
- `WORKFLOW.example.md`
- `examples/WORKFLOW.smoke.md`
- `skills/using-symphony/oneshot/templates/WORKFLOW.oneshot.md`

Prompt changes:

- In `in-progress.md`, split the current build/self-critique step into:
  1. `Build`: TDD/minimal implementation and durable work notes.
  2. `## Improve Full Spec`: re-read ticket, acceptance criteria, current code, tests, and any wiki/domain rules; fix the smallest full-spec gap; stop as `ask-user` for production/domain ambiguity that changes user-visible behavior, data semantics, permissions, migrations, or API compatibility.
  3. `## Improve Edge Cases`: attack null/empty/boundary/error/recovery/state/protocol/concurrency/compatibility/security side effects; add tests only for grounded must behavior.
  4. `## Self-Critique`: short residual-risk summary and exact focus for Verify.
  5. `## Pipeline Route`: always route to `Verify`.
- Keep the existing `docs/{{ issue.identifier }}/work/` artifact requirement.
- Tell agents to use fresh-context subagents for the two improve passes when their CLI supports it. If not supported, run the passes sequentially and keep notes brief.
- In `verify.md`, add a direct audit step:
  - Review diff against ticket, `## Plan`, `## Acceptance Tests`, `## Done Signals`, `## Improve Full Spec`, and `## Improve Edge Cases`.
  - If either pass is missing, hollow, or contradicts evidence, append `## Review Findings` or `## QA Failure` and rewind to `In Progress`.

Contract changes:

- Update the module docstring in `src/symphony/orchestrator/contracts.py`.
- Extend `_IN_PROGRESS_REQUIRED` to include:
  - `## Improve Full Spec`
  - `## Improve Edge Cases`
- Keep `## Self-Critique` required for one release as the concise human summary.
- Do not add regex checks for section prose; keep the current contract style: section presence plus artifact existence.

Workflow example changes:

- Update `state_descriptions`:
  - `"In Progress": "Build + full-spec improve + edge-case improve"`
  - `Verify`: keep `Review + QA + Merge Gate`
- Keep `active_states: [Todo, "In Progress", Verify, Learn]`.
- Keep current budget settings. Do not change token caps unless dogfood shows budget failures.

Checks:

```bash
cd /Users/danny/Documents/PARA/Resource/symphony-multi-agent
PYTHONPATH=src python -m pytest -q tests/test_workflow_pipeline_prompt.py tests/test_orchestrator_contracts.py tests/test_orchestrator_contract_integration.py tests/test_agent_lifecycle_e2e.py
PYTHONPATH=src python -m symphony.cli.main doctor WORKFLOW.file.example.md --no-color
PYTHONPATH=src python -m symphony.cli.main doctor WORKFLOW.example.md --no-color
```

Acceptance:

- Targeted tests pass.
- Doctor passes or reports only environment-specific external CLI availability that is already known and documented.
- Rendered prompts include the new loop for both file and Linear workflows.

## Task 4 - Symphony Docs And Changelog

Files to edit:

- `README.md`
- `README.ko.md`
- `docs/index.html`
- `docs/architecture.md`
- `CHANGELOG.md`
- `docs/plans/2026-07-04-improve-pass-default-workflow.md` if implementation needs a Symphony-local handoff copy.

Changes:

- Explain the default Kanban mental model:
  - `Todo`: triage.
  - `In Progress`: build, improve full spec, improve edge cases.
  - `Verify`: independent review, QA, merge preflight.
  - `Learn`: wiki/human handoff.
- Add an upgrade note:
  - Existing active tickets already in `In Progress` may need the two new sections before advancing.
  - If a custom workflow still relies on the old `Self-Critique`-only prompt, update the prompt or pin the older package.
- Decide versioning before commit:
  - If publishing, bump patch from current `0.9.1` to `0.9.2` in `pyproject.toml` and `src/symphony/__init__.py`.
  - If this is only dogfood branch work, skip version bump until release.

Checks:

```bash
cd /Users/danny/Documents/PARA/Resource/symphony-multi-agent
rtk rg -n "Self-Critique" README.md README.ko.md docs/index.html docs/architecture.md CHANGELOG.md
rtk rg -n "Improve Full Spec|Improve Edge Cases|Build -> Improve full spec -> Improve edge cases -> Final Verify" README.md README.ko.md docs/index.html docs/architecture.md CHANGELOG.md
```

Acceptance:

- Public docs describe the same workflow as the shipped prompt templates.
- Breaking/upgrade risk is explicit.
- English and Korean README surfaces stay aligned.

## Task 5 - Symphony Full Verification

Run after targeted tests pass:

```bash
cd /Users/danny/Documents/PARA/Resource/symphony-multi-agent
PYTHONPATH=src python -m pytest -q
PYTHONPATH=src python -m symphony.cli.main doctor WORKFLOW.file.example.md --no-color
PYTHONPATH=src python -m symphony.cli.main doctor WORKFLOW.example.md --no-color
```

Runtime smoke, if local environment permits:

```bash
cd /Users/danny/Documents/PARA/Resource/symphony-multi-agent
tmpdir="$(mktemp -d /private/tmp/symphony-improve-pass-XXXXXX)"
cp WORKFLOW.file.example.md "$tmpdir/WORKFLOW.md"
mkdir -p "$tmpdir/kanban"
PYTHONPATH=src python -m symphony.cli.main doctor "$tmpdir/WORKFLOW.md" --no-color
```

Optional live smoke:

- Use a temp file-board workflow with `codex.command` changed to `python -m symphony.mock_codex`.
- Create one ticket with acceptance criteria.
- Confirm the ticket body receives `## Improve Full Spec` and `## Improve Edge Cases` before `Verify`.
- Confirm a ticket missing either section rewinds to `In Progress` with `## Contract Failure`.

Acceptance:

- Full pytest passes.
- Doctor validates both default workflow files.
- Smoke proves the loop is not just docs text.

## Task 6 - Cross-Repo Closeout

Before commit:

```bash
cd /Users/danny/Documents/PARA/Resource/supergoal-skill
git status --short

cd /Users/danny/Documents/PARA/Resource/symphony-multi-agent
git status --short
git diff --check
```

Commit strategy:

- Supergoal docs commit: `docs: explain equal-compute improve-pass result`
- Symphony workflow commit: `feat: add improve-pass default workflow`

Do not stage unrelated current dirty eval artifacts in `supergoal-skill`.

Push only after:

- Supergoal `tests/run-all.sh` passes.
- Symphony full pytest passes or any environment-only blocker is named with exact command output.
- The user approves moving beyond this plan.

## Open Questions For Implementation

1. Should Symphony ship this as a patch release (`0.9.2`) immediately, or keep it on a dogfood branch first?
2. Should old active `In Progress` tickets be auto-migrated with empty section stubs, or should the contract failure force an explicit agent/user update?
3. If dogfood shows the improve passes are hollow inside one lane, should the next workflow split into six active states for strict fresh-agent fidelity?
