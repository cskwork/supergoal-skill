# GOAL - vault-restructure

Single source of "done". Only the verifier ticks a box; unticking needs regression evidence.

## Original Request

> Currently docs made at year month make relevant topic path and the different markdown i want this to
> be more structured. first markdown made will be GOAL.md this states the original prompt by user then
> improves the prompt so that it is detailed as spec with checklist by the agent that sets clear success
> criteria and verification and if is a web app clear qa case to check functionality (qa agent to test
> browser apis. All testing done and result of testing leave as checklist sentences succinct and plain
> language in QA.md) [...] Then PLAN.md where clear plain language plan on how to implement goal is made
> [...] then implementation by subagent with clean context and read just the PLAN.md happens after
> getting explicit OK by the user. [...] Then verifier with separate context checks the implementation
> the git diff files that implementer made and checks the GOAL.md to tickoff what has clearly been
> implemented. if goal success criteria not met state that in R-LOOP.md with clear checklist of missing
> with current timestamp then launch implementer subagent again [...] When all goal md success criteria
> met make a Z-{DateofCompletion}.md file [...] / READ.md 는 이제 필요 없을 것 같은데

## Spec

Restructure the supergoal run vault to a fixed file set - GOAL.md / PLAN.md / QA.md / R-LOOP.md /
Z-<date>.md (+ run-state.json, qa/) - fully replacing delivery-proof.md, surfaced-requirements.md,
verification.md, plan.md, and the vault README.md. Add a blocking plan-approval gate (interactive only;
autonomous runs auto-approve with a record). Keep the loop's phase structure, iteration caps, and the
historical contract string intact; update gates, agents, and contract tests in lockstep. Vault path and
QA-ONLY/REVIEW-ONLY report artifacts unchanged (QA-ONLY renames verification.md to QA.md only).

## Success Criteria

- [x] Five new templates exist (GOAL/PLAN/QA/R-LOOP/Z-DONE) and run-state.json carries plan_approval - verify: `bash tests/delivery-gate-contract.test.sh`
- [x] commit-gate.sh blocks on unchecked criterion, pending approval, missing/duplicate/empty Z marker, and passes a green vault - verify: `bash tests/gate-scenarios.test.sh` (scenario 13)
- [x] role-loop/SKILL wire GOAL-first Frame, plan approval gate, PLAN-only implementer brief, R-LOOP relaunch, Z-on-completion - verify: `bash tests/role-loop-contract.test.sh`
- [x] No stale reference to the removed artifacts in skill files - verify: `grep -rn -E 'delivery-proof\.md|surfaced-requirements\.md|verification\.md|([^A-Z/a-z])plan\.md' SKILL.md reference/ agents/ templates/ README.md README.ko.md` returns nothing
- [x] Historical contract string preserved in SKILL.md and role-loop.md - verify: whitespace-normalized grep for `Build -> Improve full spec -> Improve edge cases -> Final Verify`
- [x] Full suite green - verify: `bash tests/run-all.sh`

## QA Cases (web apps only)

## Decision Gates

| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | ask-user | resolved | vault README.md fate | user: drop it; run-to-prove -> QA.md Commands, hypotheses/briefs -> PLAN.md | swept references |
