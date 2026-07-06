# PLAN - vault-restructure

## Approval

- Status: approved-by-user
- Record: 2026-07-06 user approved the plan via plan-mode ExitPlanMode (plan file: GOAL/PLAN/QA/R-LOOP/Z
  restructure); mid-run amendment "READ.md 는 이제 필요 없을 것 같은데" folded in (drop vault README.md).

## Intent

- Goal: fixed goal-centric vault file set; blocking interactive plan-approval gate; file-carried
  verify->implement loop (R-LOOP.md); mechanical completion marker (Z-<date>.md).
- Constraints: no new agent phases (repo anti-goal: no always-on ceremony), historical contract string
  preserved, contract tests updated in lockstep, QA-ONLY only renames its evidence file.
- Rejected: keeping old files alongside new ones (more files, less structure); moving the vault path.
- Completion promise: all Success Criteria in GOAL.md checked via the listed commands; stop when
  tests/run-all.sh is green and the stale-reference grep is empty; max_iterations 8.

## Steps

1. Add templates/GOAL.md, PLAN.md, QA.md, R-LOOP.md, Z-DONE.md; add plan_approval to run-state.json.
2. Rewrite templates/commit-gate.sh (10 checks incl. approval + Z marker); point qa-gate.sh /
   qa-only-gate.sh VERIF at QA.md.
3. Rewire reference/role-loop.md, delivery-gate.md, plan-grounding.md, SKILL.md (Frame writes GOAL.md
   first; approval gate at Frame exit; verifier ticks GOAL.md, appends R-LOOP.md, writes Z on completion).
4. Sweep reference/ (domain-context, qa, qa-only, debugging, spec, interview, ui-ux, functional-ui,
   db-access, domain-rules) and agents/ (executor, code-reviewer, qa-auditor, qa-tester, debugger,
   architect, designer, explore) - old artifact names and vault README.md uses.
5. Update tests (delivery-gate, role-loop, gate-scenarios, qa-only, domain-context) in lockstep.
6. Update README.md / README.ko.md; delete templates/delivery-proof.md, surfaced-requirements.md.

## Tools & Skills

- bash tests/run-all.sh; bash tests/<suite>.test.sh; bash -n for gate syntax; git rm; python3 for
  multi-line test-fixture rewrites.

## Verification strategy

- Before proof: main@b0c0240 suite green with old conventions; delivery-gate suite failed 5 checks after
  core-doc rewrite (expected, lockstep pending).
- Steps 1-2 -> criteria 1-2; step 3 -> criterion 3; steps 4,6 -> criterion 4; step 3 -> criterion 5;
  steps 5-6 -> criterion 6.
- Trusted commands: `bash tests/run-all.sh` (frozen_repo)

## Grounding ledger

- Where do run-to-prove lines go without vault README.md? -> QA.md ## Commands (agent_detected row).
- Where do debugger hypotheses / Domain Brief / Priority Rules go? -> PLAN.md (grounding ledger area).
- Does the approval gate break autonomous runs? -> no: auto-approved + reason recorded in ## Approval.
