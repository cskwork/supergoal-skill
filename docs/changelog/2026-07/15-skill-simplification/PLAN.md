# PLAN - skill simplification and gate hardening

## Approval

- Status: approved-by-user
- Record: 2026-07-15 user said to implement every recommendation except the verifier question, which remains separate.

## Intent

- Completion promise: harden the machine gates, simplify duplicated skill/test surfaces without merging verifier and reviewer roles, then publish v0.6.4 from `dev-v2`.
- Required proof: focused red-green scenarios, migrated contract suites, full `bash tests/run-all.sh`, clean source checkout, remote branch/tag/release verification.
- Stop condition: every Success Criterion is proven or an explicit blocker is recorded.
- `max_iterations`: 3

## Acceptance checklist

- [x] Exact canonical QA PASS enforcement and invalid-verdict regressions.
- [x] Z marker no longer self-references a future gate pass.
- [x] Compact run state is schema-validated and enforced by commit gate.
- [x] Shared contract assertions preserve exact/case-insensitive/non-empty variants.
- [x] HARNESS-EVAL validator and fixture reuse preserve observable messages.
- [x] Verification runner recursively syntax-checks templates and aggregates failures.
- [x] `SKILL.md` detailed loop duplication is removed without losing hard gates or negative routes.
- [x] Mode parity is machine-checked with the documented landing exception.
- [x] Verifier and code-reviewer role files remain unchanged.
- [x] Focused and full tests pass.
- [x] Commit, merge, push, v0.6.4 tag, and GitHub release commands are frozen as the post-gate delivery sequence.

## Steps

1. Add one failing behavioral test for each gate/safety defect, then make the smallest implementation pass.
2. Extract only semantically identical shell assertions; keep explicit variants for different matching rules.
3. Separate HARNESS validation from CLI I/O and make test cases mutate the shipped valid result template.
4. Thin `SKILL.md` to routing/invariants and add surface parity coverage.
5. Re-run focused tests, full suite, syntax checks, and inspect the final diff.
6. Pass the commit gate, commit the run branch, merge it into `dev-v2`, push, tag `v0.6.4`, and publish/verify the GitHub release.

## Tools & Skills

- `supergoal`: isolated role-loop and delivery evidence.
- `refine-skill-terse`: contract-preserving `SKILL.md` compression.
- `tdd`: one observable red-green change at a time.
- `gh-release`: tag, push, publish, and verify v0.6.4.
- codebase-memory graph: structural discovery and impact checks.
- `apply_patch`, Bash, Node.js, Git.

## Verification strategy

- Gate behavior: execute `commit-gate.sh` against valid and intentionally invalid vaults.
- Run-state behavior: execute the public run-state validator and commit gate.
- Contract migrations: run each touched shell suite independently.
- HARNESS behavior: compare expected exit codes/messages through the CLI plus direct validator cases.
- Documentation: parse mode identifiers rather than matching implementation wording.
- Final: `bash tests/run-all.sh`; inspect `git diff --check` and both worktree statuses.
