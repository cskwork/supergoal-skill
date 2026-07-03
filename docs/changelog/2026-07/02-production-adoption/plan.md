# 프로덕션 채택 계획 — supergoal을 실제 프로덕션 코드 작업에서 의미 있게 쓰이게 만든다

날짜: 2026-07-02. 모드: 계획 문서 (이 커밋에서는 제품 코드 없음). 선행 문서:
`SUGGESTIONS.md`, `docs/changelog/2026-07/02-workflow-optimization/plan.md`,
`docs/experiments/2026-07-02-lean-skill-confirmatory-ab/PLAN.md`.

목표 한 줄: 스킬의 가치 검증 장(場)을 합성 fixture에서 **사용자의 실제 프로덕션 코드 작업**으로
옮긴다 — 프로덕션 세션이 (a) 저장소가 검증한 바로 그 파일을 실행하고, (b) 실제 업무 문구에서
발동하며, (c) 과제마다 측정 가능한 증거를 남기게 한다.

## 1. 문제 정의 (변경 전 증거)

- **검증이 전부 합성이다.** `docs/experiments/` 26개 폴더 전부 authored fixture 기반.
  측정된 결론(메모리 supergoal-baseline-first): explicit-spec 과제에서 스킬은 강한 베이스라인을
  못 이긴다. 스킬이 주장하는 가치 영역 — under-specified 요구, 레거시 blast radius, 데이터
  하중 변경 — 에서의 **프로덕션 증거는 0건**이다.
- **배포본이 복사본이다.** `~/.claude/skills/supergoal`은 2026-07-02 06:23 동기화로 지금은
  저장소와 해시가 같지만, 다음 커밋부터 다시 달라질 수 있다. 6/21 사본은 commit gate·delivery
  gate·lean 루프가 빠진 채 11일간 실행된 전례가 있다 (저장소는 A를 검증, 세션은 B를 실행).
- **발동률이 미측정이다.** description은 e3328e6에서 압축됐고, 실제 업무 문구("리팩토링 해줘",
  "why is this slow")에서 트리거되는지 측정치가 없다. 발동하지 않으면 사용 자체가 0이다.
- **증거 수집 채널이 없다.** 프로덕션 실행이 남겨야 할 산출물(run vault의 `delivery-proof.md`,
  `surfaced-requirements.md`, commit-gate 기록)이 어디에도 집계되지 않는다 — "의미 있게
  쓰였는가"라는 질문에 답할 데이터 자체가 없다.

## 2. "의미 있는 사용"의 조작적 정의 (반증 가능 기준)

| ID | 기준 | 측정 방법 |
|---|---|---|
| M1 | 실행 충실도: 세션이 저장소가 검증한 파일을 실행 | `readlink ~/.claude/skills/supergoal` == 이 저장소; 커밋 후에도 해시 동일 |
| M2 | 발동: 실제 업무 문구에서 트리거 정확도 측정치 존재 | should/shouldn't-trigger 쿼리 세트의 recall·precision 점수 파일 |
| M3 | 개입 가치: 실제 과제 N>=10에서 장치별 기여 신호 | run-vault 기반 ledger — Forced Verify가 visible-green 이후 잡은 격차 수, commit gate가 저지한 비green 커밋 수, surfaced requirement 수 |
| M4 | 수용 가능한 비용 | 과제당 오버헤드(대략 토큰·벽시계)와 마찰 메모가 ledger에 기록되고, 사용자가 계속 쓴다 |

## 3. 단계별 계획

### P0 — 배포 무결성 (SUGGESTIONS #1; 선행 조건)

- sync-skill로 `~/.claude/skills/supergoal` 복사본을 이 저장소로의 심링크로 교체.
- 가드: skills-manager 앱이 심링크된 스킬 디렉터리를 허용하는지 먼저 확인 (읽기 목록·수정 동작).
- 검증: `readlink` 확인 + 저장소에 더미 커밋 없이도 파일 해시가 항상 일치함을 확인.

### P0.5 — 실행 위생 (SUGGESTIONS #4, #7; P0과 동시 진행)

- `tests/reference-integrity.test.sh`에 디렉터리 토큰 검사 추가(~10줄): 소스 텍스트의
  `(reference|agents|templates)/<segment>/` 슬래시 종단 토큰이 디스크에 존재해야 함.
- 모드별 로드 예산 스크립트(~30줄): SKILL.md + 각 모드 라우트가 지목하는 파일의 줄수/대략
  토큰을 표로 출력. report-only — 게이트 아님 (supergoal-baseline-first: 실패하지 않는
  게이트는 의례).
- 검증: `bash tests/run-all.sh` green + 주입 실험으로 새 검사의 red 증명.

### P1 — 발동 측정 (SUGGESTIONS #3)

- 실제 업무 문구 기반 ~20 쿼리 작성: 발동해야 하는 것(한/영, near-miss 포함)과 발동하면 안
  되는 것. skill-creator의 description-optimization 루프로 `claude -p` 트리거 테스트 실행.
- 채택 기준: held-out 세트에서 이길 때만 description 수정; 현재 점수가 충분하면 무변경 + 점수
  기록만 남긴다.

### P2 — 프로덕션 파일럿 (신규; 이 계획의 핵심)

- **대상 과제 프로파일**: 사용자의 실제 업무 저장소에서 스킬이 겨냥하는 작업만 — under-specified
  요구, 레거시 수정(blast radius 있음), 데이터 하중 변경. explicit-spec 단순 과제는 제외
  (lift 없음이 이미 측정된 영역; 스킬 자체도 trivial은 skip을 지시).
- **계측**: 과제별 run vault(delivery-proof.md, surfaced-requirements.md, gate 로그)는 해당 작업
  저장소에 남긴다. 이 저장소에는 `docs/experiments/production-pilot/LEDGER.md`에 과제당 한 행만
  기록한다 — 날짜, 모드, 난이도, verify가 잡은 격차 수, 게이트 결과, 대략 오버헤드, 마찰 한 줄.
- **마찰 로그**: 매 과제 후 한 줄 — 스킬이 도운 지점/방해한 지점. SKILL-MINE의 입력이 된다.
- **기간/규모**: 2주 또는 10과제 중 먼저 도달하는 쪽.

### P3 — 판정과 환류

- **장치별 판정**: N>=10에서 어떤 장치의 M3 신호가 0이면(verify가 잡은 격차 0, gate 저지 0)
  그 장치는 프로덕션에서 의례 — 축소 후보로 상정하고 근거와 함께 커밋. 신호가 있으면 유지 확정
  + 마찰 상위 항목을 스킬 수정으로 환류.
- **SUGGESTIONS #2(합성 확인 A/B, ~$100-170) 재평가**: 파일럿이 같은 질문(lean 무회귀, 비평가
  존폐)에 실사용 데이터로 답하면 합성 A/B는 축소하거나 대체한다. 표본 부족·교란으로 답하지
  못하면 그때 `2026-07-02-lean-skill-confirmatory-ab/PLAN.md`를 원안대로 집행한다.
  → **현 결정: 집행 보류** (아래 기각 대안 참조).

## 4. SUGGESTIONS.md 매핑

| SUGGESTIONS 항목 | 이 계획에서의 처리 |
|---|---|
| 1 심링크 배포 | P0 — 즉시 실행 |
| 2 확인 A/B ($100-170) | P3 — 파일럿 결과 볼 때까지 보류 |
| 3 트리거 정확도 | P1 — 즉시 실행 |
| 4 디렉터리 토큰 무결성 | P0.5 — 즉시 실행 |
| 5 upstream 신선도 감사 | 후순위 유지 (프로덕션 사용과 직교; UI 작업이 파일럿에 포함되면 재평가) |
| 6 teach.md 분할 | 기존 결정 유지 — 실측 비용 없이는 하지 않음 |
| 7 모드별 로드 예산 | P0.5 — 즉시 실행 |

## 5. 기각한 대안 (왜 안 하는가)

- **합성 A/B(#2)를 먼저 집행**: $100-170을 쓰고도 "프로덕션에서 의미 있게 쓰이는가"에는 답하지
  못한다 — fixture는 발동·배포본 차이·마찰을 측정하지 않는다. 파일럿이 답 못 주는 질문이
  남으면 그때 집행 (계획서는 이미 완성돼 있어 지연 비용이 없다).
- **프로덕션 RCT(과제별 스킬 on/off 무작위)**: 같은 과제를 두 번 할 수 없고 과제 간 이질성이
  커서 현실적 n으로는 검정력이 없다. 관찰 지표(M3) + 마찰 로그로 대체한다.
- **다른 저장소의 run vault를 이 저장소에 수집**: 이 계획에는 요약 지표만 필요하다.
- **hook 기반 자동 텔레메트리**: ledger 수기 한 행이 먼저다. 파일럿이 유지 판정을 받으면
  그때 자동화를 검토한다 (선제적 계측은 의례가 될 위험).

## 6. 검증 계획 (계획 자체의 완료 판정)

1. P0: `readlink ~/.claude/skills/supergoal`가 이 저장소를 가리키고, skills-manager가 정상 동작.
2. P0.5: `bash tests/run-all.sh` green; 주입한 dangling 디렉터리 토큰을 새 검사가 red로 잡음;
   로드 예산 표가 stdout에 출력됨.
3. P1: 트리거 점수 파일이 `docs/experiments/`에 존재하고 채택/무변경 판정이 기록됨.
4. P2: `docs/experiments/production-pilot/LEDGER.md`에 10행 또는 2주 경과.
5. P3: 장치별 판정과 #2 집행/대체 결정이 근거와 함께 커밋됨.

## 7. 롤백

- P0: 심링크 제거 후 복사본 복원 한 줄 (`cp -r`).
- P0.5: 테스트 검사 블록 revert; 예산 스크립트는 report-only라 삭제만으로 원복.
- P2 ledger: 추가 전용 문서 — 롤백 불필요.
