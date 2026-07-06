# QA - vault-restructure

- Verdict: PASS

## Before

- [x] main@b0c0240 full suite green under the old vault convention - `bash tests/run-all.sh`
- [x] after core-doc rewrite, delivery-gate suite red on 5 old-name checks (expected before lockstep) - `bash tests/run-all.sh` output captured

## Results

- [x] full suite green: 654 checks passed, 0 failed, exit 0 - `bash tests/run-all.sh` (frozen_repo)
- [x] delivery-gate contract green (91 checks) incl. new template/gate assertions - `bash tests/delivery-gate-contract.test.sh` (frozen_repo)
- [x] role-loop contract green (92 checks) incl. approval-gate, R-LOOP, Z-marker assertions - `bash tests/role-loop-contract.test.sh` (frozen_repo)
- [x] gate scenarios green (65 cases) incl. 13.x commit-gate block/pass matrix rebuilt on GOAL/PLAN/QA/Z vaults - `bash tests/gate-scenarios.test.sh` (frozen_repo)
- [x] qa-only contract green (71 checks) with QA.md fixtures - `bash tests/qa-only-contract.test.sh` (frozen_repo)
- [x] reference integrity green: all path tokens resolve, no orphan agents, deleted templates unreferenced - `bash tests/reference-integrity.test.sh` (frozen_repo)
- [x] stale-name grep over SKILL.md/reference/agents/templates/READMEs returns nothing - grep (evaluator_owned)
- [x] historical contract string present once each in SKILL.md and role-loop.md after whitespace normalization - tr|grep (evaluator_owned)
- [x] live commit gate: this vault passes; unchecking a criterion / removing Z / setting approval pending each blocks - `bash templates/commit-gate.sh docs/changelog/2026-07/06-vault-restructure none` (frozen_repo)

Backward-trace: clean

## Commands

| Command | Source | Proves |
|---|---|---|
| bash tests/run-all.sh | frozen_repo | whole contract + gate-scenario suite green |
| bash templates/commit-gate.sh docs/changelog/2026-07/06-vault-restructure none | frozen_repo | new gate passes a green vault and blocks mutations |
| grep -rn -E 'delivery-proof\.md\|surfaced-requirements\.md\|verification\.md\|([^A-Z/a-z])plan\.md' SKILL.md reference/ agents/ templates/ README.md README.ko.md | evaluator_owned | no stale artifact names |

## QA

Tool: playwright-cli
UI-tier: n/a (docs/gates only, no UI surface)
DB: n/a
- no browser scenarios: the change has no web app surface; gate scenarios exercise the CLI gates instead

## Reproduction Fidelity

- Fidelity level: exact
- Residual risk from data gap:
- Post-deploy confirmation plan:

## Residual Risk

- Not proven: behavior of third-party forks/snapshots under docs/experiments (intentionally untouched
  history); real-session ergonomics of the interactive approval gate (first live run will show).
