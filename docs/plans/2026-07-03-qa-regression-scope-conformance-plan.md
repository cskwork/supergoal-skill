# supergoal QA 개선 계획 — 회귀·부작용 차단 + 요구사항 준수(RTM)

**작성:** 2026-07-03 · **상태:** 제안(proposed, 미구현) · **방법:** deep-research 하네스(105 에이전트, 23 소스 → 103 주장 추출 → 상위 25 적대적 3-vote 검증 → 21 확증(3-0) / 4 반증(0-3)) + 로컬 스킬 정독(SKILL.md, role-loop, delivery-gate, qa, qa-only, interview, qa-auditor, code-reviewer, delivery-proof, commit-gate.sh, run-state.json, delivery-gate-contract.test.sh).

**사용자 통증점(원문):** "수정이 원치 않는 부작용을 내고 다른 기존 기능을 바꾼다 · 사용자가 준 요구사항/계획을 정확히 안 따른다 · QA와 QA 시나리오 만들기·검증·재반복을 개선하고 싶다."

**이 문서의 범위:** 계획만. 스킬 코드는 아직 수정하지 않음. 구현은 승인 후 Phase 1부터.

---

## 0. 설계 제약 (먼저 못 박음 — 이걸 어기면 계획이 해롭다)

1. **baseline-first 유지 (측정된 교훈).** 과거 8개 eval에서 하네스의 게이트 의식(gated ceremony)은 *명시 스펙(explicit-spec) 작업*에서 강한 baseline(동일 compute의 forced verification)을 이기지 못했다. 그래서 gated ceremony와 HARNESS-MAKE는 이미 제거됨. **이 계획의 모든 변경은 tiered/조건부다.** trivial·명시적·좁은 타겟 변경에는 의식을 추가하지 않는다. 새 게이트는 오직 (a) *very easy* 초과 **그리고** (b) 변경이 공유 코드/상태를 건드리거나(회귀 축) 요구사항이 미충족/미추적일 때(준수 축)만 발동한다. 항상 켜지는 새 절차 = 이 계획의 실패 모드.
2. **reference 편집은 terse.** reference 파일은 에이전트가 읽는다. 편집분은 문장이 아니라 최소 지시로. 근거·대안·측정값은 **이 plan 문서와 changelog에** 남기고 reference 본문에 넣지 않는다.
3. **flag ≠ proof.** 리서치 핵심: 코드를 생성한 모델의 자기검토는 회귀 게이트가 될 수 없다(동작 변경 수정의 31.7%를 조용히 "정상" 승인, 모델별 miss율 0~100% 양극화). 자기검토·metamorphic·characterization은 모두 **신호(flag)**로 쓰고, 최종 판정은 프로젝트의 REAL 테스트 + 산문 스펙 + 캡처된 baseline 재실행이라는 **실행 가능한 증거**로 한다.
4. **회귀 signal은 correctness oracle이 아니다.** characterization 스냅샷은 *현재 동작(버그 포함)*을 고정한다. 변경 전 대비 드리프트를 잡는 회귀 신호이지 정확성 증명이 아니다. 알려진 버그를 인코딩한 스냅샷은 의도적으로 갱신한다(맹목 갱신 금지).

---

## 1. 진단 — 현재 QA 아키텍처와 갭

현재 스킬은 **변경 대상 자체를 스펙 대비 검증하는 축**이 매우 성숙하다: `reference/role-loop.md`의 Forced Verify(전체 산문 스펙 재독 + REAL 테스트 재실행)가 mandatory core, `reference/delivery-gate.md`의 Before/After Eval, `templates/commit-gate.sh`의 6-step 하드 게이트, 증거 기반 done(신뢰 명령 manifest). 이건 유지·강화 대상이지 교체 대상이 아니다.

사용자의 두 통증점은 정확히 **가장 약하고 옵션화된 두 축**에 떨어진다.

| 통증점 | 현재 대응 (파일:섹션) | 실제 갭 |
|---|---|---|
| **① 다른 기존 기능이 깨짐 (부작용)** | preserve-baseline이 `role-loop.md` Build(1)에 있으나 **"Refactor/integrate an existing API" 전용**으로 좁음. 인접 표면 회귀를 잡는 Impact Matrix는 **`qa-only.md` 전용**, 기본 루프는 `qa.md`에서 "high-blast-radius일 때만 빌려 씀". blast-radius 확인(`interview.md`)은 "Explore가 이미 매핑했음(discovery 아님)"에 의존 | 회귀가 실제로 나는 **DEBUG/LEGACY 기본 루프에 인접-기능 회귀 보호가 mandatory가 아님**. Explore가 blast-radius를 과소 매핑하면 confirm이 안 뜨고 부작용이 불가시. 변경 전 이웃 동작을 **캡처해 두는 강제 단계가 refactor 외엔 없음** |
| **② 요구사항 미준수 / 스코프 드리프트** | `SKILL.md` Frame이 "한 줄 acceptance criteria", Forced Verify가 산문 스펙 재독. over-build 차단("No padding")은 **opt-in Critic 경로(`role-loop.md` Fixer 3)에만** | **요구사항 추적 원장(RTM) 부재.** 요구사항이 번호 리스트 → 구현 → 검증으로 매핑되지 않아, "산문 재독"이라는 실패하기 쉬운 단계에 준수 판정을 의존. **요청 안 한 걸 만드는 over-build(역방향 스코프 크립)가 기본 경로에서 미차단** |
| ③ 검증(verifying) | 강함 — `commit-gate.sh`가 신뢰 명령·증거·QA verdict·open 요구사항을 하드 체크 | 미미. 단 "변경 대상"만 증명; **캡처된 회귀 세트 재실행을 요구하지 않음** |
| ④ QA 시나리오 만들기 | `qa-only.md` Impact Matrix는 우수(before/during/after·인접·feature family·complexity probe·risk tier) | 그 방법론이 **QA-ONLY에 사일로화**. 기본 루프 Verify는 "degenerate values(null/empty/boundary)"만; 등가분할·부정·metamorphic·**회귀 카테고리 없음** |
| ⑤ 재반복(re-iterating) | `role-loop.md` max_iterations=8 + forced reflection, critic cap 3, doubt-theater 안티시그널 | 재반복 성찰에 **"직전 iteration에서 green이던 체크를 새 수정이 다시 깼나" 회귀 재검사 항목 없음** |

**한 줄 진단:** 스킬은 *변경 대상*을 스펙 대비 잘 검증하지만, *그 외 모든 것(인접 기능)*의 보호와 *요구사항 추적성*이 약하고 옵션이다. 사용자의 두 불만은 그 두 축에 정확히 대응한다.

---

## 2. 리서치 근거 (확증 21/25, 3-vote)

| # | 확증된 주장 (vote) | 이 계획에의 함의 | 출처 |
|---|---|---|---|
| R1 | 생성 모델의 자기검토는 신뢰 불가한 회귀 게이트다. 동작 변경 수정의 **31.7% 조용히 승인**, 모델별 miss율 0~100% 양극화, 유창한 자기설명 ≠ 정확성 증거 (3-0) | 회귀 검증은 **코드를 안 쓴 fresh-context**가 하거나 실행 증거로 뒷받침. 독립 Critic이 opt-in인 게 약점 → 회귀 축은 항상 독립 | arXiv 2606.17076, 2605.21537 |
| R2 | 자기검토 루프의 관측된 실패모드: sycophantic regression(거짓 비평에 굴복해 옳은 코드 훼손), 미해결 REVISE, stub/placeholder 제출 (3-0) | 가드: REVISE/open 요구사항은 해결 전 done 차단(드롭 금지), 실행 증거에 반하는 비평 거부, stub 제출 금지 | arXiv 2606.17076 |
| R3 | compile+unit-test 통과는 불충분. **제약 보존·비인가 상태 변경·환경 일관성** 추가 확인, done을 **관측 가능 산출물(diff·명령 트레이스·상태 체크)에 묶기**(서술 아님), read-before-write (3-0) | 이미 있는 증거 기반 done을 강화. "비인가 상태 변경" = 스코프 크립 축 | arXiv 2605.30777 |
| R4 | **characterization/approval/golden-master 스냅샷** = 변경 전 기존 동작을 잠그는 메커니즘. 코드 이해 없이 "아무것도 안 깨졌음"을 앎. 3단계: (1)테스트 하에 두기 (2)출력 캡처 (3)입력 변형·의도 버그로 최소 1개 실패 확인 (3-0) | **변경 ①의 핵심.** preserve-baseline을 refactor 전용 → shared-code 변경 일반으로 승격 | understandlegacycode.com |
| R5 | **metamorphic/self-consistency**: ground-truth 오라클 없이 회귀·의미 드리프트 탐지("동등 입력→의미상 동등 출력"). 오류 프로그램 ~75~83% 탐지. **단 후보 실행 필요** (3-0) | 오라클 없는 인접 동작의 회귀 신호. 변경 ④의 metamorphic 카테고리 | arXiv 2406.06864, 2605.28321 |
| R6 | 모호한 스펙이 코드젠 불안정성의 **주 원인** → 구현 전 스펙 명확화 + 불변식 도출을 acceptance로 (3-0) | 이미 있는 interview + plan-grounding 강화. Frame의 요구사항을 번호+불변식으로 | arXiv 2511.18249 |
| R7 | **RTM(Requirements Traceability Matrix)**: 빈 셀이 스코프 드리프트 신호. **정방향 갭=미구현/미검증 요구사항, 역방향 갭=어떤 요구사항에도 안 걸리는 고아 코드(=스코프 크립)**. 양방향. 커버리지 측정 가능 (3-0) | **변경 ②의 핵심.** delivery-proof에 경량 RTM + commit gate 양방향 | trace.space |

**채택 금지 (0-3 반증 — 계획에 넣지 말 것):**
- 6개 회귀테스트 명칭이 *동일* 기법 → 아님(계열family일 뿐). "characterization = approval = golden master"로 단정하는 문구 금지.
- 역방향 추적*만*이 유일한 안티-스코프크립 메커니즘 → 아님. **양방향** 필수.
- "run stats 그대로 reviewer에 주입" / "Empirical Defiance Protocol" 안티-sycophancy → 1-2 약함. 휴리스틱으로만, 규칙화 금지.

**caveat (리서치 자체 명시):** LLM 자기검토 수치는 Python2→3 modernization + 적대적 의미 트랩 도메인 측정 → 방향은 독립 코로보, 크기는 도메인 특이(일상 작업엔 base drift가 더 낮을 수 있음). characterization/RTM은 practitioner 블로그지만 수십 년 정착된 textbook 실무(Feathers, ISO 29148)라 high. metamorphic/characterization은 **후보 코드 실행 러너 필요** → 순수 markdown 불가지만 supergoal은 이미 REAL 테스트·playwright-cli로 실제 리포를 구동하므로 적합. 러너 없는 맥락(순수 문서)에선 "named residual risk"로 강등.

---

## 3. 설계 원칙 (근거→원칙)

- **P1 회귀 보호는 캡처-후-변경.** 공유 코드를 건드리는 non-trivial 변경은 이웃 동작을 *먼저* characterization 스냅샷으로 고정하고, 변경 후 재실행해 드리프트를 red로 만든다. (R4)
- **P2 준수는 추적으로 증명.** 요구사항은 번호 리스트 → RTM. 정방향(모든 요구사항이 구현+통과 체크)과 역방향(모든 diff가 요구사항에 역추적; 고아=스코프 크립)을 commit gate가 강제. (R7, R3)
- **P3 회귀 판정은 독립·실행 기반.** 코드를 쓴 컨텍스트의 "괜찮아 보임"에 게이트 걸지 않는다. (R1, R2)
- **P4 시나리오는 회귀 카테고리를 포함.** 등가분할·경계·부정에 더해 "이 변경이 깰 수 있는 이전 통과 시나리오"와 오라클 없을 때 metamorphic 관계. (R5)
- **P5 재반복은 누적 회귀를 유지.** 매 iteration이 직전 green 체크를 재실행. (R2 미해결-회귀 방지)
- **P6 게이트는 부패 방지 계약 테스트로 고정.** 새 계약은 `tests/*.test.sh`가 grep-검증. (R3 산출물 기반)

---

## 4. 변경 상세 (6개, 우선순위·파일·정확한 편집·수락기준·계약테스트)

> 표기: `파일:섹션` 은 실제 확인한 현행 앵커. "추가/수정" 편집분은 terse 원칙에 따라 최소 문장으로 요약(실제 구현 시 이보다 짧게).

### 변경 ① [P0] 인접 회귀 보호를 기본 루프 mandatory core로 (characterization baseline)

**해결 통증점:** ① 다른 기능이 깨짐. **근거:** R4, P1.

**대상 파일 및 편집:**

1. **`reference/qa.md`** — 새 섹션 `## Characterization baseline (non-UI code changes)` 추가:
   - 언제: *very easy* 초과 **AND** 변경이 다른 기능과 공유하는 코드/상태(함수·모듈·전역·DB·설정)를 건드릴 때. (very-easy·좁은 타겟 단독 변경은 skip — P0 제약.)
   - 3단계(R4): (1) 이웃 도달 동작을 캡처 체크 하에 둔다 → (2) 현재 출력을 baseline 스냅샷으로 `<vault>/qa/baseline/<neighbor>.txt`에 기록 → (3) 변경 후 재실행, 스냅샷과 diff. 의도치 않은 drift = red.
   - 저장/증거: `<vault>/qa/baseline/`, 재실행 결과를 `delivery-proof.md` After Evidence에 행으로.
   - 가드(P4 제약): 스냅샷은 현재 동작(버그 포함) 고정 = 회귀 신호이지 correctness 아님. 알려진 버그를 담은 스냅샷은 의도적으로 갱신.

2. **`reference/role-loop.md` Build(step 1)** — 현행 "Refactor/integrate an existing API: capture its exact-behavior baseline FIRST" 를 일반화:
   - "공유 코드/상태를 건드리는 *very easy* 초과 변경: 도달 이웃 동작의 characterization baseline을 먼저 캡처(`reference/qa.md` Characterization baseline). refactor뿐 아니라 bug fix·feature-add 포함."

3. **`reference/role-loop.md` Verify(step 4, mandatory core)** — 불릿 추가:
   - "캡처된 이웃 baseline 재실행; intentional로 명시되지 않은 drift는 해결할 red(approval 방식)."

4. **`reference/role-loop.md` Guardrails** — 한 줄: "characterization은 pre-change 대비 회귀 신호이지 correctness oracle 아님."

5. **`SKILL.md`** — Build 라인에 "공유 코드 변경(very easy 초과): 이웃 characterization baseline 먼저"; Done 라인에 "캡처된 이웃 스냅샷 재실행 green(unnamed drift 없음)".

6. **`reference/delivery-gate.md`** — Before State: "LEGACY/brownfield: preserve current behavior" 를 "DEBUG/GREENFIELD도 변경이 공유 코드에 도달하면 이웃 baseline 캡처"로 확장. After Eval "Required old behavior still works" 를 "= 캡처된 이웃 스냅샷이 unnamed drift 없이 재실행"으로 구체화.

7. **`templates/delivery-proof.md`** — 선택 미니테이블 `## Neighbor Baseline` (`snapshot | captured_at | re-run status`) 또는 기존 After Evidence 행 활용 지침.

**수락 기준:** 공유 코드를 건드리는 DEBUG/LEGACY 실행에서 (a) Build 전 baseline 스냅샷이 `<vault>/qa/baseline/`에 존재, (b) Verify가 재실행해 drift를 red로 판정, (c) very-easy/좁은-타겟 변경은 이 단계를 skip(로그에 이유 1줄).

**계약 테스트(변경 ⑥):** `role-loop-contract.test.sh`에 `require_text ... "characterization baseline"` / `"shared code"`; `delivery-gate-contract.test.sh`에 qa.md 섹션 존재 assert.

---

### 변경 ② [P0] 요구사항 추적 원장(RTM) + commit gate 양방향

**해결 통증점:** ② 요구사항 미준수 + over-build 스코프 크립. **근거:** R7, R3, R6, P2.

**대상 파일 및 편집:**

1. **`templates/delivery-proof.md`** — 새 섹션:
   ```
   ## Requirement Trace
   | # | Requirement (user's words) | Source | Implementing change (file:line) | Verifying check | Status |
   |---|---|---|---|---|---|
   | r1 |  |  |  |  | open / met / blocked |

   Backward-trace: clean | <orphan file:line list>
   ```
   지침 1줄: 모든 명시 요구사항 = 1행(정방향). diff의 모든 변경은 요구사항 #로 역추적(역방향); 어디에도 안 걸리는 변경 = 스코프 크립 → 제거하거나 `ask-user` 게이트.

2. **`reference/delivery-gate.md`** — Contract 필수 필드에 `requirement_trace` 추가. Commit gate holds에 추가: "정방향 갭(`## Requirement Trace`에 미충족 요구사항) 또는 역방향 갭(요구사항에 역추적 안 되는 diff hunk = 스코프 크립)."

3. **`templates/commit-gate.sh`** — 새 step 7 (기존 awk 스타일):
   - 7a 정방향: `## Requirement Trace` 표를 awk, Status(col 6)에 `open`/`blocked` 있으면 fail. 미기입 placeholder(`open / met / blocked`)도 fail.
   - 7b 역방향: `Backward-trace:` 라인 필수. `clean`이 아니고 orphan을 나열하면 fail. (diff 자동 대조는 러너 의존 → 우선 attestation 라인 + reviewer가 채움. 후속으로 `git diff --name-only` 대조 자동화 검토.)
   - 절대 게이트를 통과시키려 편집 금지 문구 유지.

4. **`reference/role-loop.md`** — Frame: "목표를 번호 매긴 요구사항 리스트로 재진술, `## Requirement Trace` 행 시드"(R6). Verify(4): "각 Requirement Trace 행을 met+verifying check로 닫거나 block; Backward-trace 라인 채움."

5. **`SKILL.md`** — Frame "falsifiable acceptance criteria in one line" → "+ 번호 요구사항을 `## Requirement Trace`에 시드". Done → "+ 모든 요구사항 met·추적, 고아 스코프 없음".

**수락 기준:** non-trivial 실행에서 (a) 모든 사용자 요구사항이 RTM 행으로 존재, (b) commit gate가 open/blocked 요구사항에 block, (c) `Backward-trace: clean` 없거나 orphan 나열 시 block. very-easy 단독 변경은 단일 행 + clean으로 최소 통과.

**계약 테스트:** `delivery-gate-contract.test.sh`에 `require_text "template records requirement trace" "templates/delivery-proof.md" "## Requirement Trace"`, `"commit gate blocks unmet requirement"`, `"delivery gate blocks scope-creep orphan"`; commit-gate.sh가 `Requirement Trace`/`Backward-trace` 문자열 포함 assert.

---

### 변경 ③ [P1] 회귀 축의 독립 검증을 명시적 mandatory로

**해결 통증점:** ①②의 근본(self-review 신뢰). **근거:** R1, R2, P3. **주의:** 새 의식 아님 — Verify는 이미 mandatory core이고 기본적으로 fresh-context subagent(`qa-auditor`)로 dispatch됨. 이 변경은 *독립성*을 명문화하고 값싼 가드절만 추가(baseline-first 제약 준수).

**대상 파일 및 편집:**

1. **`reference/role-loop.md` Verify(4) + Guardrails** — 명시:
   - "mandatory core Verify(이웃 baseline 재실행 + RTM close)는 코드를 쓰지 않은 fresh-context가 수행. 빌더의 self-review는 회귀 게이트가 아니다(생성 모델이 동작 변경의 31.7%를 조용히 승인)."
   - 실패모드 가드(R2): "open 요구사항/미해결 REVISE는 해결 전 done 차단(드롭 금지). 실행 증거에 반하는 비평은 거부. stub/placeholder를 done으로 제출 금지."

2. **`agents/qa-auditor.md`** — 한 줄: 코드 미작성 격리 재확인 + 안티-sycophancy + no-stub.

**수락 기준:** Verify 단계가 빌더 컨텍스트와 분리됨이 문서·페르소나에 명시; open 항목이 있으면 done/commit이 막힘(기존 gate와 정합).

**계약 테스트:** `role-loop-contract.test.sh`에 `"self-review is not a regression gate"`, `"no stub"` assert.

---

### 변경 ④ [P1] 코드 변경용 시나리오 스텐실을 기본 Verify로 표면화

**해결 통증점:** ④ 시나리오 만들기. **근거:** R5, P4.

**대상 파일 및 편집:**

1. **`reference/qa.md`** — 새 섹션 `## Scenario stencil (code changes)`:
   - 등가분할(equivalence partitioning) · 경계값(boundary value) · 부정/에러(negative) · **회귀("이 변경이 깰 수 있는 이전 통과 시나리오" — 변경 ①의 이웃 목록과 연결)** · 오라클 없을 때 **metamorphic 관계**(동등 입력→의미상 동등 출력; 후보 실행 필요, R5).
   - full Impact Matrix(`qa-only.md`)는 QA-ONLY에 유지; 이건 DEBUG/LEGACY의 lean default. 포인터로 재사용(중복 금지, terse).

2. **`reference/role-loop.md` Verify(4)** — "코드 변경 시나리오는 `reference/qa.md` Scenario stencil(회귀 카테고리 포함) 참조" 1줄.

**수락 기준:** 기본 루프 Verify가 degenerate values를 넘어 회귀·부정·(가능 시)metamorphic 카테고리를 참조; 오라클 없는 이웃은 metamorphic 관계 또는 residual risk로 처리.

**계약 테스트:** `role-loop-contract.test.sh`/`workflow-contract.test.sh`에 qa.md `Scenario stencil` + `regression` 카테고리 assert.

---

### 변경 ⑤ [P2] 교차-반복 회귀 원장

**해결 통증점:** ⑤ 재반복이 조용히 재-회귀. **근거:** R2, P5.

**대상 파일 및 편집:**

1. **`templates/run-state.json`** — 필드 추가: `"regression_ledger": []` (이전 iteration에서 green이던, 계속 green이어야 하는 체크 목록), `forced_reflection`에 `"regressed_previously_green": ""`.

2. **`reference/role-loop.md` Completion promise + loop cap** — "각 Build→Verify iteration은 `regression_ledger`를 재실행; 직전 green이 red 되면 stop-and-fix하고 `forced_reflection.regressed_previously_green`에 기록."

**수락 기준:** 재반복 시 누적 green 세트가 매 pass 재실행되고, 재-회귀가 forced reflection에 표면화.

**계약 테스트:** `delivery-gate-contract.test.sh`에 `require_text ... "templates/run-state.json" "regression_ledger"`.

---

### 변경 ⑥ [P1, 각 변경과 동반] 게이트 부패 방지 계약 테스트

**근거:** R3(산출물 기반), P6.

**대상 파일:** `tests/delivery-gate-contract.test.sh`, `tests/role-loop-contract.test.sh`, (선택) 신규 `tests/requirement-trace-gate.test.sh`.

**편집:** 위 각 변경의 "계약 테스트" 라인을 실제 `require_file`/`require_text` assert로 추가. 추가로 fixture 기반 동작 테스트(선택, 기존 gate 테스트 스타일): open RTM 행이 있는 delivery-proof에 `commit-gate.sh`를 돌려 **exit 1**(block) 확인, clean이면 **exit 0**.

**수락 기준:** `bash tests/*.test.sh` 전부 green이며, 각 신규 계약(characterization mandatory / RTM / 독립검증 / scenario stencil / regression_ledger)이 grep-강제됨.

---

## 5. 시퀀싱 (phase, 의존성)

| Phase | 내용 | 게이트(다음으로 넘어가는 조건) |
|---|---|---|
| **0 (이 커밋)** | 이 plan 문서 + changelog 포인터 | — |
| **1 (최고 ROI)** | 변경 ① + ② + 두 계약 테스트(⑥ 부분) | 기존 `tests/*.test.sh` 전부 green + 신규 assert green + reference 편집 terse 확인 |
| **2** | 변경 ③ + ④ | Phase 1 게이트 + 신규 assert green |
| **3** | 변경 ⑤ + ⑥ 잔여 | 전체 `tests/*.test.sh` green |

각 Phase는 독립 브랜치/PR 권장(원자적 커밋). Phase 1만으로 사용자의 두 핵심 통증점(①②)을 직접 완화 — 나머지는 보강.

**의존성:** 변경 ③/④는 ①(이웃 목록·baseline)과 ②(RTM)를 참조하므로 순서 유지. ⑤는 독립. ⑥은 각 변경과 동반(테스트 없이 머지 금지).

---

## 6. 리스크 · 롤백 · 논-골(non-goals)

**리스크 → 완화:**
- **측정된 무용 의식 재도입(baseline-first 위반).** → 모든 변경 tiered/조건부(very-easy·좁은-타겟·명시-스펙 skip); 발동 조건을 문서·게이트에 명문화. 구현 후 harness-eval로 explicit-spec 케이스에서 회귀 없음을 확인(기존 eval 하네스 재사용).
- **reference 토큰 bloat.** → 편집분 terse, 근거는 이 plan/changelog. 구현 후 SKILL.md·role-loop 단어수 회귀 확인.
- **러너 없는 맥락의 metamorphic/characterization.** → 러너 없으면 "named residual risk"로 강등(하드 실패 아님).
- **버그를 담은 스냅샷의 거짓 회귀.** → 가드절(신호≠oracle, 의도적 갱신).
- **역방향 스코프 대조의 자동화 한계.** → 우선 attestation 라인, 후속으로 `git diff --name-only` 대조 자동화 검토(open question).

**롤백:** 각 변경이 파일 단위·계약 테스트 단위로 격리 → Phase 브랜치 revert로 원복. 게이트 스크립트는 step 추가 방식이라 해당 step만 제거 가능.

**논-골 (이 계획이 하지 않는 것):**
- 무거운 CI, mutation testing 인프라, 상시 다중모델 리뷰.
- explicit-spec 작업에 대한 baseline-first 입장 변경(측정으로 유지).
- QA-ONLY Impact Matrix의 재작성(사일로 해제만, 중복 생성 금지).

---

## 7. 오픈 퀘스천 (구현 전 판단 필요)

1. modernization 특이 self-review 실패율(31.7%)이 일상 feature/bug 작업엔 얼마나 전이되나? → 변경 ③의 강도(항상 독립 vs 조건부 독립)를 여기에 맞춤. 보수적으로 회귀 축만 항상 독립.
2. 역방향 스코프 대조를 `git diff --name-only` × RTM `Implementing change` 열 자동 대조로 machine-check할 수 있나? Phase 3에서 시도, 실패 시 attestation 유지.
3. metamorphic의 "후보 실행" 최소 substrate — 기존 REAL 테스트 러너 재사용으로 충분한가, 별도 fuzz 입력 생성이 필요한가? Phase 2에서 lean 버전(수동 관계 1~2개)부터.
4. characterization baseline 발동 임계 "공유 코드/상태를 건드림"의 판정 주체 — Explore blast-radius map에만 의존하면 ①의 원래 갭이 재발. → Build 진입 시 "이 변경이 다른 호출자/기능과 공유하나?" 한 줄 자문을 강제(interview blast-radius와 연결).

---

## 8. 참고문헌

- Self-review 신뢰 불가 / defense-in-depth: arXiv 2606.17076, 2605.21537
- compile+test 불충분 / 증거 기반 done / read-before-write: arXiv 2605.30777
- characterization·approval 테스트: understandlegacycode.com/blog/characterization-tests-or-approval-tests/, /approval-tests/
- metamorphic / 자기일관성 코드 검증: arXiv 2406.06864, 2605.28321; 사전 스펙 하드닝: arXiv 2511.18249
- Requirements Traceability Matrix: trace.space/blog/what-is-requirements-traceability
- 리서치 원본(전체 findings·caveat·반증): 세션 워크플로우 `wf_3498fc98-15a` (deep-research, 105 에이전트)

---

*이 문서는 계획이다. 구현은 Phase 1부터, 각 Phase는 계약 테스트 green 후 머지. reference 편집은 terse 유지 — 근거는 여기와 changelog에.*
