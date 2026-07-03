# supergoal 개선 계획 — lazycodex/OmO 기능 차용 + 4축 A/B 검증

**작성:** 2026-07-03 · **방법:** deep-research 하네스(108 에이전트, 40 소스, 120 주장 추출 → 75 적대적 검증, 74 생존/71 high-confidence). 합성 단계만 스키마 오류로 실패해 검증된 주장 집합에서 직접 합성.

**1차 목표(사용자 확정):** 기능 파리티/차용 — 인기 도구의 핵심 기능을 supergoal에 이식.
**A/B 성공 메트릭(4축 전부):** 작업 성공률/정확도 · 토큰/비용 · 속도/wall-clock · 라우팅 정확도.
**조사 깊이:** 명시 도구 집중(lazycodex, oh-my-openagent).

신뢰도 표기: **[H]** 다중 독립 소스 일치 · **[M]** 단일소스/프레이밍 단서 · **[REF]** 검증에서 기각(반례로만 유지).

---

## 0. 핵심 사실 — lazycodex는 껍데기, 실체는 OmO

- lazycodex는 **얇은 CLI 프록시**다. `npx lazycodex-ai install` = 내부적으로 `npx omo install --platform=codex`. 실제 지능 계층은 **oh-my-openagent(OmO)**이고 lazycodex는 Codex 맛으로 포장한 배포/명령 변환 레이어. [H] (claims 11,12,16)
- 따라서 "차용 대상"의 본체는 **OmO**. lazycodex 고유 차용거리는 zero-config 프록시·`doctor` 헬스체크·autonomous 플래그·capability-aware graceful degradation 정도. [H] (claims 5,13,14,30)
- 채택 신호: lazycodex 2.3K stars/137 forks, 다중 호스트(Codex/Claude Code/Cursor/CLI) 타깃. [M] (claims 9,10)

**포팅 가능성 현실 점검 (supergoal은 Claude Code "스킬" = 모델이 읽는 마크다운 라우터, 자체 런타임/에디트툴/모델라우터 없음):**
- **직접 포팅(스킬 레벨: 프롬프트/reference/gate 수정)**: IntentGate 분류-후-라우팅, completion-promise 계약, 반복 상한+강제 반성, 재개형 상태파일, 적대적 플랜 공격.
- **측정/게이트로 포팅**: paired McNemar, SNR 필터링, 라우팅-트리거 eval set.
- **비포팅/이미 보유/안티패턴**: hash-anchored 에디트 툴(Claude Code가 Edit 소유), 자동생성 메모리(효과 실측 음성), 멀티프로바이더 모델 라우팅(단일 호스트).

---

## 1. OmO에서 실제로 가져올 만한 것 (검증된 기능 목록)

| OmO 기능 | 무엇인가 | supergoal 현황 | 신뢰도 |
|---|---|---|---|
| **IntentGate** | 행동 전 사용자 "진짜 의도"(research/impl/investigation/fix)를 분류 → 라우팅하는 2단계 classify-then-route | 정적 테이블 라우터(신호→모드). 분류 stage·confidence·오분류 처리 없음 | [H] 21,36,47,49,61 |
| **Category vs Skill 분리** | 두 직교 라우팅 축: Category(작업 종류→model/temp/reasoning 프리셋) vs Skill(필요 툴/지식) | 모드=작업종류. 능력 로딩과 분리 안 됨 | [H] 62,63,46 |
| **Category→model 라우팅** | visual-engineering/deep/quick/ultrabrain → 모델 자동 매핑 + fallback 체인 | 없음(Claude Code 단일 호스트) — 비포팅 | [H] 21,28,54 |
| **Hash-anchored 편집(Hashline)** | 라인마다 content hash, stale edit 거부. 약한 모델 성공률 6.7%→68.3% | Claude Code Edit 소유 — 직접 비포팅, "편집 후 재검증 규율"로만 흡수 | [H] 22,45,48 |
| **$ulw-loop / Ralph loop** | Oracle 검증 완료까지 도는 자기수정 루프 + **--completion-promise**(선계약) + 하드 상한(500/100 또는 MAX_ITERATIONS=8+강제 반성) | Build→Verify 루프 보유. 명시 계약·상한·강제반성 없음 | [H] 26,27,51,56,64 |
| **hyperplan** | 5개 적대 에이전트가 플랜을 직교 각도에서 공격 | opt-in 단일 critic. 다각 플랜공격 없음 | [H] 24,39 |
| **boulder.json** | 재개형 세션 상태(중단된 작업 복구), .omo/tasks blockedBy/blocks 의존성 태스크 | run worktree + delivery-proof 보유. 머신리더블 재개 상태 없음 | [H] 40,65 |
| **Wisdom Accumulation** | 학습을 후속 태스크로 전달(교차 태스크 메모리) | 사람이 큐레이션한 메모리 — **유지 권장(아래 안티권고)** | [M] 40,50 |
| **Trust But Verify** | 모든 서브에이전트 산출을 독립 재검증 | Forced Verify로 이미 보유(파리티) | [H] 38,55 |
| 역할 페르소나 | Sisyphus/Hephaestus/Oracle/Prometheus/Librarian/Explore | executor/critic/qa-auditor/explore 등 이미 보유(파리티) | [H] 17,23,41 |

---

## 2. 우선순위화된 개선안 (임팩트 vs 구현비용)

### Tier 1 — 높은 임팩트, 낮음~중간 비용 (먼저)

**T1-A. 명시적 IntentGate stage 추가 (라우터 최상단)**
- 무엇: 모드 테이블 분류 **전에** "진짜 의도 + confidence"를 한 줄로 산출하는 stage. high-confidence면 자동 라우팅, 애매하면 최소 질문 또는 escalate.
- 왜: 라우팅이 최다 인용 차용 패턴. 근거 — 스킬은 접근 권한이 있어도 **56% 케이스에서 미발화**하고 어떤 description 재작성도 baseline을 못 이김(구조적 한계) [H](109); 오분류는 캐스케이드(1회 오라우팅=5~6 API 왕복) [H](69). ~9모드는 semantic 라우팅 최적 구간(3~10 카테고리) [H](84), 그리고 툴<15는 LLM function calling으로 충분한 구간이라 무거운 분류기 불필요 [H](67).
- 어디: `SKILL.md` 라우터 상단 + 짧은 라우팅 규칙(신뢰도 임계).
- 비용: 낮음(SKILL.md 편집 + 규칙 문단).

**T1-B. 라우팅 정확도 축을 harness-eval에 추가**
- 무엇: 20-쿼리 should/should-not-trigger set(근접 오답 near-miss 강조), 각 쿼리 3회 실행해 trigger rate 산출, 60/40 train/test 분할로 과적합 방지.
- 왜: 사용자가 원하는 **4번째 축(라우팅 정확도)이 현재 하네스에 부재**. 이 방법론은 Anthropic skill-creator eval의 실제 라우팅 측정 방식 [H](118), 미발화 문제의 유일한 정량화 수단 [H](109).
- 어디: `templates/harness-eval-case.yaml`에 `routing` 케이스 타입 신설 + `reference/harness-eval.md` 파이프라인에 라우팅 축.
- 비용: 중간(새 케이스 타입 + 러너 캡처).

**T1-C. Paired McNemar 검정으로 A/B 판정 (+ SNR 필터링)**
- 무엇: 같은 eval set에 baseline vs harness를 쌍(paired)으로 돌리고, 이진 pass/fail 불일치 셀(B,C)만으로 McNemar 검정. 양쪽 다 통과한 no-signal 케이스는 데이터셋에서 제거(SNR).
- 왜: 동일 태스크셋 이진 A/B의 **통계적으로 올바른 방법** [H](96~100). 페어링이 태스크간 분산을 제거해 0.3%까지 검출 [H](86,89,98); unpaired는 불확실성 ~2.2배 과대 [H](87); 양쪽-일치 케이스는 비용만 들고 신호 0이라 제거하면 인스턴스 적어도 판정 정확도↑ [H](88,101~105).
- **[REF] 하지 마라:** "신뢰구간이 겹치면 승자 선언 금지" 규칙은 **통계적 오류**(비겹침→유의는 참이나 겹침→무유의는 거짓; Schenker & Gentleman 2001). A/B 게이트로 쓰지 말 것. 현재 `harness-eval.md`의 sign-flip permutation(p<0.05)은 유효하니 유지하되, 이진 결과엔 McNemar가 더 강력하므로 **병기**.
- 어디: `docs/experiments/.../stats.mjs` 계열에 McNemar + SNR 필터 추가.
- 비용: 낮음(통계 스크립트).

### Tier 2 — 높은 임팩트, 중간 비용

**T2-A. completion-promise 계약 + 상한형 자기수정 루프**
- 무엇: Frame에서 **선(先)성공 계약**을 명시 → Build→Verify가 계약 충족 OR 하드 상한까지 돌고, 상한 도달 시 **강제 반성 프롬프트**로 탈루프.
- 왜: "AI 코딩 에이전트를 정의하는 특징 = 자기수정 반복 루프" [H](56); 하드 상한(MAX_ITERATIONS=8)+강제 반성이 루프 고착을 크게 줄임 [H](51); 완료를 self-report 아닌 **증거로 게이팅**(Oracle+계약+상한) [H](27). supergoal은 루프는 있으나 명시 계약/상한/강제반성이 빠짐.
- 어디: `reference/role-loop.md`(루프 계약) + `reference/delivery-gate.md`(계약 필드).
- 비용: 중간.

**T2-B. 재개형 run 상태 파일 (boulder.json 아날로그)**
- 무엇: run worktree에 머신리더블 세션 상태(현재 단계/미해결 게이트/다음 액션) 파일 → 중단 시 재시작 아닌 재개.
- 왜: 세션 연속성 store가 중단 작업을 재개 [H](40); 재시작을 견디는 의존성-aware 태스크 시스템이 ephemeral todo보다 강함 [H](65). delivery-proof는 있으나 재개용 상태는 아님.
- 어디: `templates/delivery-proof.md` 확장 or 신규 `run-state.json` + role-loop 스텝.
- 비용: 중간.

### Tier 3 — 중간 임팩트 / 조건부

**T3-A. 적대적 플랜 공격(hyperplan) — under-specified 한정**
- 무엇: 비자명 작업 Build 전, N개 critic이 플랜을 직교 각도(보안/스코프/성능/정확성/엣지)로 공격.
- **주의(자체 실측):** supergoal 자체 eval에서 역할분리는 explicit-spec 태스크에서 equal-compute forced-verify를 못 이김(메모리: [[supergoal-baseline-first]]). 따라서 **under-specified/latent-correctness 프런티어에만 게이팅**, 상시 켜지 말 것.
- 근거: 플랜 선(先)검증 + 적대 게이트 [H](24,39). 비용: 중간(토큰 배수 명시 필수).

**T3-B. 토큰/시간 캡처 배선**
- 무엇: `duration_ms`, `total_tokens`는 **task notification에서만** 나오고 다른 곳에 영속되지 않음 → 하네스 result JSON에 캡처 스텝 명시.
- 왜: 4축 중 속도·비용 축의 구현 제약 [M](119). 어디: 러너 캡처. 비용: 낮음.

---

## 3. 안티권고 (리서치가 "하지 마라"고 말한 것)

- **자동생성 메모리 도입 금지.** LLM-생성 AGENTS.md는 효과 없음~성공률 -3%, 비용 +20%; 사람 작성만 ~+4% [H](52). supergoal의 사람-큐레이션 메모리 유지.
- **overlapping-CI 승자 게이트 금지** [REF](위 T1-C).
- **멀티프로바이더 모델 라우팅 추격 금지** — 단일 호스트 스킬엔 비포팅, supergoal 문제 아님.
- **생성 과투자 금지.** 병목은 생성이 아니라 **검증** [H](53) → 최고가치 투자처는 verification/QA 게이트. baseline-first 자세 검증됨 [H](71,72,74,75).

---

## 4. 4축 A/B 검증 플랜 (각 개선안을 이 틀로 증명)

**공통 원칙**
- **페어링 필수:** 동일 프롬프트·동일 repo 스냅샷에 with/without 스킬을 쌍으로. 델타가 스킬 기여분 [H](106,116).
- **헤드룸 필수:** 100% 포화 스킬은 개선 신호 0(회귀추적만) → eval은 천장효과 없는 케이스만 [H](108). 양쪽-일치 케이스 제거(SNR) [H](88).
- **표본크기:** n<6는 방향성만(sign-flip 최소 양측 p=2/2^n). 근접 효과(0.608 vs 0.621) 95% 분리엔 ~199~285 trial [H](92). 분산추정 체크포인트 n=9 [H](104). Pass@k는 불안정 → Bayes@N이 더 빨리 수렴(~27~44 vs ~48~70 trial) [H](93~95).

| 축 | 메트릭 | 방법 | 판정 |
|---|---|---|---|
| **1 작업 성공률/정확도** | 케이스별 hidden-check pass fraction | paired McNemar(불일치 셀), SNR 필터 | McNemar p<0.05 AND 델타>0 [H](86,89,96) |
| **2 토큰/비용** | total_tokens / invocation | task notification 캡처, mean±stddev, Δ vs baseline | 정확도 동률 시 비용 낮은 arm. 실측 예: 스킬이 pass 84→100% 였지만 +14s·+12k 토큰 [H](107) |
| **3 속도/wall-clock** | duration_ms | 동상. **주의: 스킬 비용의 지배항은 토큰$가 아니라 latency** [H](110) | 회귀 감지(느려지면 flag) |
| **4 라우팅 정확도** | 20-쿼리 trigger rate | should/should-not-trigger×3회, 60/40 분할 | held-out trigger rate로 best 선택 [H](118). 목표: baseline 미발화율 대비 개선 [H](109) |

**참고 표준(Anthropic skill-creator eval):** pass_rate·time·tokens를 config별 mean±stddev + Δvs baseline로 보고, 멀티에이전트 병렬을 **격리 환경**에서(교차오염 방지), description 최적화는 5회 반복·60/40 분할·held-out 최고점 선택 [H](111~118). supergoal의 baseline-first 유닛(각 케이스마다 with-skill AND baseline 서브에이전트 동시 스폰)은 이 canonical 루프와 일치 — 설계 정당성 확인 [H](116).

---

## 5. 실행 순서 (제안)

1. **T1-C**(McNemar+SNR, 스크립트, 저비용) → 이후 모든 개선을 신뢰성 있게 측정할 토대 먼저.
2. **T1-B**(라우팅 축) → 4번째 축 확보.
3. **T1-A**(IntentGate) → T1-B로 즉시 측정.
4. **T2-A**(completion-promise+상한) → T1-C로 측정.
5. **T2-B**(재개 상태), **T3**(조건부) → 후순위.

각 변경은 supergoal 자체 harness-eval 계약을 따른다: 의도된 behavior delta·safety envelope·rollback·proof command·기각 대안을 mutation contract에 기록, surface-sync 증명 첨부.

---

## 소스 (40개 중 핵심)

- lazycodex/OmO: github.com/code-yeongyu/lazycodex · github.com/code-yeongyu/oh-my-openagent · deepwiki.com/code-yeongyu/{lazycodex,oh-my-openagent} · omo.dev · a2a-mcp.org/blog/what-is-oh-my-openagent · glukhov.org/ai-devtools/opencode/oh-my-opencode-agents
- 라우팅: tianpan.co/blog/2026-04-16-intent-classification-agent-routers · moshe-haim-makias.medium.com(real-time intent router) · getmaxim.ai/articles/top-5-llm-routing-techniques
- A/B 통계: arxiv 2602.10144v2(amazon-science, McNemar degradation) · arxiv 2510.04265v1(SNR, 단 overlapping-CI는 [REF]) · arxiv 2508.13144v1(benchmark SNR) · jameshoward.us(McNemar paired) · PMC4877414(CI overlap fallacy)
- 스킬 eval: github.com/anthropics/skills skill-creator · dev.to/danielsogl(skills without evals) · smartscope.blog·toolmesh.ai(skill-creator eval 업그레이드)
- 에이전트 트렌드: addyosmani.com/blog/code-agent-orchestra · mikemason.ca/writing/ai-coding-agents-jan-2026 · codepick.dev(2026 roadmap)
