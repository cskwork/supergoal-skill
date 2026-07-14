# PLAN - QA 실행자와 판정자 역할 분리

## Approval

- Status: approved-by-user
- Record: 사용자가 auditor와 tester 분리를 선택한 뒤 "좋아 그렇게 진행"이라고 승인했다.

## Intent

- Completion promise: tester는 증거 생산, auditor는 독립 판정이라는 단일 경계를 모든 관련 계약에 적용한다.
- Required proof: 역할별 positive/negative contract, focused QA/role-loop suite, full repository suite.
- Stop condition: 중복 브라우저 절차가 auditor에서 사라지고 모든 Success Criterion이 증명된다.
- `max_iterations`: 3

## Acceptance checklist

- [ ] tester는 실행/증거만 소유하고 verdict·GOAL 체크·R-LOOP를 소유하지 않는다.
- [ ] auditor는 브라우저를 직접 조작하지 않고 최종 verification 상태를 소유한다.
- [ ] browser default loop는 tester -> auditor, non-browser default loop는 auditor 단독이다.
- [ ] QA-ONLY는 tester 실행 + auditor 판정 + 선택적 db-reader 구조다.
- [ ] reviewer 계약은 변경하지 않는다.
- [ ] focused contracts와 전체 suite가 통과한다.

## Steps

1. 현재 중복과 원하는 역할 경계를 계약 테스트로 먼저 고정하고 RED를 확인한다.
2. `qa-tester.md`를 evidence producer로, `qa-auditor.md`를 final verifier로 최소 수정한다.
3. `reference/role-loop.md`, `reference/qa-only.md`, `reference/playwright-cli.md`,
   `reference/db-access.md`, `SKILL.md`, README와 랜딩의 dispatch 설명을 동기화한다.
4. focused contracts, skill validator, 전체 suite를 실행하고 diff를 역추적한다.

## Tools & Skills

- `supergoal`: 격리 worktree, vault, commit gate 계약.
- `skill-creator`: 기존 skill의 persona/reference를 간결하고 일관되게 수정.
- `tdd`: observable role contract를 RED -> GREEN 순서로 변경.
- codebase-memory graph: 관련 역할·참조·테스트 탐색.
- `apply_patch`, Bash, Git.

## Verification strategy

- `bash tests/qa-only-contract.test.sh`
- `bash tests/role-loop-contract.test.sh`
- `bash tests/reference-integrity.test.sh`
- skill-creator `quick_validate.py`
- `bash tests/run-all.sh`
