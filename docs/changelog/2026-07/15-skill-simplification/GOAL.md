# GOAL - skill simplification and gate hardening

## Original Request

> p1 verifier 는 코드 리뷰어하고 다른가 나머지는 다 권장대로 개선 진행

> 여기까지 완료되면 commit push make v0.6.4 minor release then answer question on what verfier is actually doing as-is and what you suggest to-be

## Spec

Keep verifier and code-reviewer as distinct roles for this change. Implement the other approved improvements: exact QA verdict enforcement, non-circular Z marker semantics, enforced compact run state, shared test assertions, HARNESS-EVAL fixture and validator simplification, recursive verification coverage, a thinner `SKILL.md`, and mode-surface parity checks with documented public-surface exceptions.

## Success Criteria

- [x] `commit-gate.sh` accepts exactly one canonical `Verdict: PASS` in `QA.md` and rejects missing, unknown, placeholder, multiple, FAIL, or PARTIAL verdicts - verify: focused gate scenarios.
- [x] The Z marker remains required but no longer claims the commit gate passed before that gate can run - verify: contract test and source inspection.
- [x] `run-state.json` contains only unique resume/safety state, and the commit gate requires valid final state with verified refs and no blockers - verify: run-state gate scenarios.
- [x] Repeated shell assertions move behind a small shared interface without erasing matcher differences - verify: migrated contract suites.
- [x] HARNESS-EVAL uses a reusable validator and canonical result fixture deltas, reducing duplicated test data and process startup overhead without changing failures - verify: full HARNESS contract suite.
- [x] Canonical verification checks nested JavaScript/MJS templates and reports all suite failures - verify: runner contract and full suite.
- [x] `SKILL.md` remains the router and invariant spine while detailed five-gate procedure stays authoritative in `reference/role-loop.md` - verify: contract anchors plus size comparison.
- [x] Mode IDs remain aligned across canonical and public surfaces while intentional landing omissions remain explicit - verify: parity test.
- [x] Verifier/code-reviewer consolidation is not implemented in this change - verify: role files unchanged.
- [x] Full repository verification passes, pre-existing user work remains untouched, and the original `dev-v2` checkout is clean before integration - verify: `bash tests/run-all.sh` and git status in both worktrees.
- [x] The v0.6.4 post-commit delivery target and verifier as-is/to-be handoff are recorded for execution after the commit gate - verify: approved `PLAN.md`, changelog, and final diff.

## Post-commit Delivery

After this vault passes the commit gate: merge and push `dev-v2`, create/push tag `v0.6.4`, publish and
verify the GitHub release, then report the verifier as-is/to-be boundary with the remote evidence.

## QA Cases (web apps only)

Not applicable; this change has no user-facing web UI.

## Decision Gates

| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | no-op | resolved | verifier and code reviewer have different proof responsibilities | keep roles distinct; exclude consolidation | final diff |
| d2 | auto-fix | resolved | landing intentionally omits draw/diagram per changelog | parity checker permits that named exception | parity test |
