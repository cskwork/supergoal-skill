# QA - QA 실행자와 판정자 역할 분리

- Verdict: PASS

## Before

- [x] `qa-auditor`가 final verifier 책임과 playwright/browser-driver 절차를 동시에 가진다 - evidence: `agents/qa-auditor.md`.
- [x] QA-ONLY가 auditor를 app driver로 정의해 `qa-tester`와 역할이 중복된다 - evidence: `reference/qa-only.md`.
- [x] default browser path가 tester summary 이후 Verify를 말하지만 최종 persona ownership이 명확하지 않다 - evidence: `agents/qa-tester.md`, `reference/role-loop.md`.

## Results

- [x] default-loop에서 tester는 브라우저/CLI 증거만 만들고 auditor만 최종 판정·GOAL 체크·R-LOOP를 소유한다 - `bash tests/role-loop-contract.test.sh`: 143 passed, 0 failed (frozen_repo).
- [x] QA-ONLY에서 tester 실행, auditor 판정, 선택적 read-only db-reader 증거 구조가 일관된다 - `bash tests/qa-only-contract.test.sh`: 86 passed, 0 failed (frozen_repo).
- [x] skill frontmatter와 이름 규칙이 유효하다 - `/opt/anaconda3/bin/python /Users/danny/.agents/skills/.system/skill-creator/scripts/quick_validate.py .`: `Skill is valid!` (evaluator_owned).
- [x] 전체 repository 계약과 재귀 Node template syntax 검사가 통과했다 - `bash tests/run-all.sh`: exit 0, `== /supergoal all checks passed ==` (frozen_repo).
- [x] `agents/code-reviewer.md`는 base `dev-v2`와 동일하다 - `git diff --exit-code dev-v2 -- agents/code-reviewer.md`: exit 0 (evaluator_owned).
- [x] 현재 diff에 공백 오류가 없다 - `git diff --check`: exit 0 (evaluator_owned).
- [x] 완료 상태가 commit backstop 계약을 충족한다 - `bash templates/commit-gate.sh docs/changelog/2026-07/15-separate-qa-roles none`: `COMMIT GATE PASS` (frozen_repo).

Backward-trace: clean

## Commands

| Command | Source | Proves |
|---|---|---|
| `bash tests/role-loop-contract.test.sh` | frozen_repo | default-loop final verdict ownership |
| `bash tests/qa-only-contract.test.sh` | frozen_repo | QA-ONLY tester/auditor/db-reader 분리 |
| `/opt/anaconda3/bin/python /Users/danny/.agents/skills/.system/skill-creator/scripts/quick_validate.py .` | evaluator_owned | skill 구조 유효성 |
| `bash tests/run-all.sh` | frozen_repo | 전체 계약 무회귀 |
| `git diff --exit-code dev-v2 -- agents/code-reviewer.md` | evaluator_owned | reviewer persona 무변경 |
| `git diff --check` | evaluator_owned | diff 공백 무결성 |
| `bash templates/commit-gate.sh docs/changelog/2026-07/15-separate-qa-roles none` | frozen_repo | 완료 vault backstop |

## QA

Tool: not-applicable

## Reproduction Fidelity

- Fidelity level: exact
- Residual risk from data gap:
- Post-deploy confirmation plan:

## Residual Risk

- Not proven: 실제 제품 브라우저/DB 동작은 이번 역할 계약 문서 변경의 대상이 아니다.
- Follow-up: 없음.
