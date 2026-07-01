# 워크플로 최적화 계획 — 스킬 작성 베스트 프랙티스 정합 + 실행 신뢰성

날짜: 2026-07-02. 모드: LEGACY (스킬 저장소 자체 개선, 제품 코드 없음).
목표: supergoal의 각 워크플로(모드)가 실행 시 깨지지 않고(신뢰성), 필요한 것만 로드하게(효율)
스킬 작성 베스트 프랙티스에 맞춘다. 기준: skill-creator 가이드 + mattpocock
`writing-great-skills` (predictability가 근본 덕목 — 매 실행이 같은 절차를 밟게 하라).

## 감사 결과 (변경 전 증거)

기준선: `bash tests/run-all.sh` green (contract 스위트 전부 + `node --check` templates + 예제).

이미 충족하는 것 (변경하지 않음):

- SKILL.md 139줄 (<500 가이드 충족), 라우터 패턴 + 단계적 로딩(progressive disclosure) 정상.
- 참조 경로 58개 전수 검사: 오늘 기준 깨진 포인터 0. 모든 `reference/*.md`가 SKILL.md 또는
  다른 파일에서 라우팅 가능. `agents/*.md` 고아 페르소나 0 (stem 기준).
- description은 e3328e6에서 의도적으로 "leading word + triggers"로 압축된 최신 결정 — 유지.
- SKILL.md와 role-loop.md의 중복 문장은 workflow-contract.test.sh가 양쪽에 기계 앵커로
  강제하는 의도된 이중화 — 유지.

발견한 격차:

| ID | 격차 | 근거 | 리스크 |
|---|---|---|---|
| G1 | 참조 무결성(경로·게이트 파일 존재, 페르소나 라우팅)이 기계 검증되지 않음 | 오늘은 수동 검사로 0건이지만, 파일 rename/삭제 한 번이면 라우터가 조용히 404 | 워크플로 실행이 로드 실패로 중단 — 재발 가능성 높음 |
| G2 | 300줄 초과 참조 파일에 TOC 없음: `reference/teach.md`(556), `taste-skill-v2.md`(371), `harness-eval.md`(328) | skill-creator 가이드: >300줄 참조 파일은 TOC 필수 | 로드한 에이전트가 필요한 섹션을 못 찾고 전체를 재스캔 — 비효율 |
| G3 | `agents/analyst.md`가 파일 경로로는 어디서도 지목되지 않음 (market-research.md가 "The Analyst"라는 단어로만 언급) | 다른 페르소나는 전부 `agents/<role>.md` 경로로 디스패치됨 | conductor가 페르소나 파일을 로드하지 않고 즉흥 프롬프트로 대체 — 실행마다 절차가 달라짐 (predictability 위반) |
| G4 | 설치본(~/.claude/skills/supergoal)이 심링크가 아닌 복사본 — 오늘 06:23 외부 동기화로 최신화됐지만 다음 커밋부터 다시 드리프트 | 6/21 사본은 delivery-gate, commit-gate, lean 루프가 빠진 채 11일간 실행됨 | 저장소에서 검증한 워크플로와 실제 실행되는 워크플로가 다름 |

## 변경 명세

- **C1 (G1) — `tests/reference-integrity.test.sh` 신설.** run-all.sh가 자동 수집(`tests/*.test.sh`).
  검사 3종, 전부 스킬 저장소 소유 경로(`reference/`, `agents/`, `templates/`)에 한정:
  1. SKILL.md / reference/*.md / agents/*.md / README.md 안의 모든
     `reference/... | agents/... | templates/...` 파일·디렉터리 토큰이 디스크에 존재.
  2. 본문이 bare 이름으로 부르는 게이트 스크립트(`*-gate.mjs`, `*-gate.sh` 등)가
     `templates/`에 실제로 존재 (예: SKILL.md의 `learn-grounding-gate.mjs`).
  3. 모든 `agents/*.md` 페르소나가 SKILL.md/reference/templates/tests/README 어딘가에서
     stem으로 언급됨 (고아 페르소나 금지) + 모든 `reference/*.md`가 라우팅 가능.
  실패 시 파일과 누락 토큰을 출력하고 exit 1.
- **C2 (G2) — TOC 추가 3건.** `teach.md`, `taste-skill-v2.md`, `harness-eval.md` 상단에
  한 줄짜리 컴팩트 TOC(섹션명 나열)만 추가. 본문·앵커 문구는 1자도 건드리지 않는다
  (teach-contract 52개 앵커 보존). taste-skill-v2.md는 upstream 압축 파생물이므로 TOC를
  supergoal 소유 헤더 주석 블록 아래(본문 밖)에 둔다.
- **C3 (G3) — analyst 디스패치 포인터.** `reference/market-research.md`의 "The Analyst writes..."
  문장에 `(agents/analyst.md)` 경로를 명시해 conductor가 페르소나 파일을 로드하게 한다.
- **C4 (G4) — 보고만, 변경 없음.** 오늘 사용자의 동기화 프로세스가 복사 방식으로 방금 갱신했으므로
  여기서 덮어쓰지 않는다. 권고: `sync-skill`(심링크 배포)로 전환하면 드리프트가 구조적으로 소멸.
  최종 보고에 명시한다.

## 기각한 대안 (왜 안 하는가)

- **teach.md 분할(556줄 → templates/teach/로 이동):** teach-contract.test.sh 앵커 52개가
  `reference/teach.md`를 지목 — 이동은 테스트 대량 개정을 유발하고, 실측된 이득 없이 churn만 큼.
  TOC로 탐색 비용만 줄인다.
- **description을 옛(긴) 형태로 복원:** e3328e6이 의도적으로 압축한 최신 결정. 재론하지 않음.
- **SKILL.md ↔ role-loop.md 중복 제거:** workflow-contract가 양쪽 텍스트를 기계 앵커로 요구.
  단독 로드 시에도 계약이 살아있게 하는 의도된 이중화.
- **의례(ceremony) 추가·HARNESS-MAKE 재도입:** 8회 평가에서 강한 베이스라인을 못 이겨 제거된
  전력 — 재도입 금지 (메모리 supergoal-baseline-first).
- **harness-eval 러너/게이트 로직 변경:** green이고, 2026-07-02 확인용 A/B 계획이 이 파일들에
  의존 — 실험 전 변경은 결과 해석을 오염시킴.

## 검증 계획

1. C1 자체의 red 증명: scratchpad에 저장소 사본을 만들어 dangling 참조를 주입 → 새 테스트가
   exit 1로 잡는지 확인. 원본 트리에서는 exit 0.
2. `bash tests/run-all.sh` 전체 green (기존 앵커 52개 포함 무회귀 — TOC/포인터 추가가
   아무 앵커도 깨지 않음을 증명).
3. 근거 기록: `docs/changelog/changelog-2026-07-02.md`.

## 롤백

각 변경은 독립 파일이므로 개별 revert 가능. C1은 테스트 삭제만으로 원복.
