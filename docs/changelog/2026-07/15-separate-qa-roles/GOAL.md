# GOAL - QA 실행자와 판정자 역할 분리

## Original Request

> auditor tester는 분리하고 싶어

> 좋아 그렇게 진행

## Spec

`qa-tester`는 브라우저/CLI 시나리오를 실행하고 원시 증거를 생산한다. `qa-auditor`는 tester의
요약·증거와 실제 테스트 결과를 독립 검토해 최종 완료 여부를 판정한다. auditor는 브라우저를 직접
조작하지 않으며, tester는 `GOAL.md` 체크·최종 verdict·`R-LOOP.md`를 소유하지 않는다.
별도 `verifier.md`를 추가하지 않고 auditor가 default-loop verifier 역할을 맡는다.

## Success Criteria

- [x] `qa-tester`가 브라우저/CLI 실행, 시나리오 결과, 증거 경로만 소유하고 최종 판정을 소유하지 않는다 - verify: role contract test.
- [x] `qa-auditor`가 tester 증거 소비, REAL test 재실행, GOAL/diff 역추적, verdict, GOAL 체크, R-LOOP를 소유한다 - verify: role contract test.
- [x] `qa-auditor`에서 playwright 설치·브라우저 조작·스크린샷 수집 절차가 제거된다 - verify: negative contract assertions.
- [x] default-loop 브라우저 작업은 tester evidence -> auditor verdict의 순서를 명시하고, 비브라우저 작업은 auditor만 실행한다 - verify: role-loop contract.
- [x] QA-ONLY도 tester가 실행하고 auditor가 독립 판정하며, DB가 필요할 때만 db-reader가 증거를 보탠다 - verify: QA-ONLY contract.
- [x] `code-reviewer`의 pre-Build/REVIEW-ONLY 책임은 변경하지 않는다 - verify: final diff.
- [x] 관련 skill/reference/persona 문서가 한 가지 역할 경계를 말하고 전체 테스트가 통과한다 - verify: focused contracts and `bash tests/run-all.sh`.

## QA Cases (web apps only)

Not applicable; 제품 UI 변경이 아닌 역할 계약 변경이다.

## Decision Gates

| ID | Action | Status | Finding | Decision | Recheck |
|---|---|---|---|---|---|
| d1 | no-op | resolved | 별도 verifier persona 여부 | 추가하지 않고 qa-auditor가 최종 verifier 역할을 맡는다 | role contracts |
| d2 | no-op | resolved | 브라우저 경로의 추가 dispatch | tester와 auditor의 독립성을 위해 의도적으로 허용한다 | role-loop contract |
