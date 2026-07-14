# QA - skill simplification and gate hardening

- Verdict: PASS

## Before

- [x] Existing contract suite is green but does not reject an unknown `QA.md` verdict - evidence: source audit of `templates/commit-gate.sh` and prior passing suite.
- [x] Existing Z template claims commit-gate PASS before the gate can pass - evidence: `templates/Z-DONE.md` line 9.
- [x] Existing commit gate does not read `run-state.json` - evidence: no run-state reference in `templates/commit-gate.sh`.
- [x] Existing `SKILL.md` repeats the detailed default loop already owned by `reference/role-loop.md` - evidence: `SKILL.md` lines 64-130.
- [x] Existing shell contract tests duplicate common assertions and HARNESS fixture data - evidence: 17 `require_text` definitions and 796-line HARNESS contract test.

## Results

- [x] Focused behavioral regressions pass - gate scenarios 74/74, delivery 112/112, role-loop 122/122, HARNESS 307/307, runner 5/5, and mode parity 12/12.
- [x] Full repository suite passes - `bash tests/run-all.sh` exit 0, including recursive syntax checks for 48 JavaScript/MJS templates.
- [x] Scope remains surgical - verifier/reviewer role files are unchanged; original `dev-v2` checkout was clean before integration.

Backward-trace: clean

## Commands

| Command | Source | Proves |
|---|---|---|
| `bash tests/gate-scenarios.test.sh` | frozen_repo | invalid QA verdicts and unsafe final run states are blocked |
| `bash tests/harness-eval-contract.test.sh` | frozen_repo | reusable validator and fixture deltas preserve HARNESS behavior |
| `bash tests/run-all.sh` | frozen_repo | canonical full verification |

## QA

Tool: not-applicable

## Reproduction Fidelity

- Fidelity level: exact
- Residual risk from data gap:
- Post-deploy confirmation plan:

## Residual Risk

- HARNESS fixture reuse improves maintainability, not measured speed; the focused suite changed from 17.95s to 19.12s in one local comparison.
- Git push, tag, and GitHub release are post-commit delivery operations and are verified separately after this gate.
