# AssertFlip on REAL bugs (SWE-bench_Lite sympy) — A/B report

**날짜:** 2026-07-04 · **상태:** RUN 완료, **null result (p=1.000)** · escalation of `docs/experiments/2026-07-04-assertflip-repro-ab/` (toy ceiling tie) per user request ("24/24 ceiling 말고 baseline이 saturate 안 되는 더 어려운 task").

## TL;DR

실제 SWE-bench_Lite 버그(sympy 8개, gold fix로 fail-to-pass 사전검증)에서 arm A(assertflip 지시) vs arm B(shipped)를 weak model(Haiku)로 A/B. **arm A 23/32(72%) vs arm B 22/32(69%), stratified permutation p=1.000 (n=32/arm).** 유의미한 lift 없음. 토이(24/24 tie)에 이어 **실제 하드·non-saturated regime에서도 tie** — 훨씬 강한 null. 유일한 방향성 신호(1 인스턴스, 1 test)는 assertflip 메커니즘과 일치하나 노이즈. **결정적 뉘앙스: 이 eval은 assertflip을 one-shot 지시로 시험했을 뿐, 진짜 AssertFlip의 execution-feedback 루프(run→refine→invert)는 시험하지 않았다** — PRD 변경 ①도 마찬가지.

## 방법 (진짜 SWT-Bench-Lite 방식)

- **데이터:** `princeton-nlp/SWE-bench_Lite`에서 py3.9 호환(ver 1.9-1.12) sympy 8 인스턴스. 각 = 실제 GitHub 이슈 + base_commit + gold code patch + FAIL_TO_PASS.
- **환경:** Docker 없이 sympy를 소스에서 실행(PYTHONPATH + mpmath). 8/8 전부 **fail-to-pass 사전검증 통과**(gold F2P 테스트가 base에서 FAIL, gold fix 적용 시 PASS). `swt/validate_all.py`.
- **Arms:** A = `debugging.md` step1 + assertflip(assert-current-then-invert); B = shipped step1. weak model Haiku, effort low. 8 × 2 × 4 = 64 producers(wf_b530155e-957, 0 error). 모델은 problem_statement만 받고 gold patch/test 미열람, `test_repro.py` 1개 작성.
- **채점(SWT-bench 표준 fail-to-pass, Claude out-of-band 결정론적):** valid_f2p = 후보 테스트가 **base에서 FAIL(collection/import 에러 아님, 즉 실제 실행) AND gold code fix 적용 시 PASS**. 예외로 재현되는 crash 버그도 포함(assertion-red 강제 안 함 — 토이 grader의 결함 교정). `swt/grade_swt.py`.

## 결과

| arm | valid_f2p | rate |
|---|---|---|
| A (assertflip) | 23/32 | 72% |
| B (shipped) | 22/32 | 69% |

**stratified permutation (instance별 arm 라벨 셔플, 20k): two-sided p = 1.000.**

per-instance A vs B: 21627 4/4=4/4, 22005 4/4=4/4, 22714 4/4=4/4, 24066 4/4=4/4 (**4개 ceiling**); 21612 0/4=0/4, 24102 0/4=0/4 (**2개 floor**); 24213 3/4=3/4 (tie); **23262 A 4/4 > B 3/4 (유일한 차이)**.

base_cls: error 34 / collection 16 / assertion 14. → 대부분 버그가 **예외(crash)로 재현**.

## 왜 tie인가 (mechanism)

1. **인스턴스가 per-instance로 ceiling/floor에 몰린다.** 4개는 이슈 본문에 거의 완성된 repro 스니펫이 있어 두 arm 모두 감싸면 끝(ceiling). 2개는 너무 어려워 두 arm 모두 valid repro 실패(floor). 중간 판별대가 얇다 — 집계 72/69%는 ceiling과 floor의 평균일 뿐.
2. **대부분 crash형 버그(error 34/64)** → assertflip의 guard("crash면 invert skip")가 스스로 발동 → arm A ≡ arm B by construction.
3. **약한 준수(18/32 vs 15/32).** Haiku가 두 arm 모두 대체로 직접 테스트를 씀. assertflip 지시가 행동을 크게 바꾸지 못함.
4. **유일한 win(23262)이 메커니즘을 보여주나 노이즈다.** B r2는 `base=assertion → fix=assertion`: 기대값을 살짝 틀리게 assert해 fix 후에도 실패(=invalid) — 정확히 assertflip이 막는 실패. arm A 4/4가 이를 회피. lever가 *작동*은 하나 n=1, p=1.0.

## 결정적 발견: 지시 ≠ 루프

진짜 **AssertFlip은 execution-feedback 에이전트 루프**다(passing test 작성 → **실행** → 에러면 그 에러로 refine → green 되면 assertion invert). SWT-Bench 리더보드 우위는 이 반복 실행에서 나온다. 이 eval의 arm A와 PRD 변경 ①은 **one-shot 지시**(파일만 작성, 실행·refine 없음)라 그 메커니즘을 담지 못한다. 따라서:
- **검증됨:** assertflip을 *지시*로만 주면 real 하드 버그에서 lift 없음(p=1.0).
- **미검증:** assertflip을 *execution-feedback 루프*로 구현하면(에이전트가 test를 실제 실행·refine·invert) 다를 수 있음 — 훨씬 무거운 구현(에이전트별 sandbox 실행) 필요.

## 판정

- **변경 ①(one-shot 지시)은 두 번째 null.** 토이 24/24 tie + real p=1.000. baseline-first + 사전등록 기준상 **proven 아님 → 커밋 금지 유지**(`reference/debugging.md`·`SKILL.md` 편집 uncommitted).
- **권장: 변경 ① revert.** 두 독립 null + 레포 선례(tie 시 revert). 남은 유일 avenue는 변경 ①을 execution-feedback 루프로 재설계 후 재검증(대형 투자, 유저 결정 사안).
- **corpus 재확증**: 강한 baseline이 있으면 skill 지시 하나로는 못 이긴다. 이번엔 real·hard·non-saturated regime에서까지 확인 — 가장 강한 반증.

---

## 재실행 — FAITHFUL AssertFlip (execution-feedback 루프)

유저 지시("revert 후 test 재실행") + 위 "지시 ≠ 루프" 발견에 따라, one-shot 지시가 아닌 **진짜 AssertFlip execution 루프**로 재검증.

**설계 (equal-compute로 invert lever 격리):** 같은 8개 sympy 버그, 인스턴스별 sympy base worktree, **sonnet** 프로듀서가 Bash로 pytest를 실제 실행하며 반복(budget 5). arm A = assert-current → 실행 → green까지 refine → **invert** → red 확인; arm B = expected 직접 assert → 실행 → refine(동일 실행 예산, invert 없음). 48런(wf_4c500627-145, 47/48; 1 rate-limit). 준수 확인: 에이전트들이 pytest를 실제 1~4회 실행(one-shot haiku와 달리 루프가 진짜 돎).

**결과:** **arm A 18/24(75%) vs arm B 16/24(67%), stratified permutation p=0.397 (무의미).** per-instance: **5개 ceiling(3/3=3/3)** + **2개 floor(0/3=0/3, 24102·24213)** + **1개 A>B(21612: A 3/3 vs B 1/3)**. 차이 전부가 21612 하나에서 나옴.

**21612에서 메커니즘이 실제로 작동(정당성 확인):** LaTeX 파싱 wrong-value 버그. B의 두 실패(B r1·r3)는 `base=assertion, fix=assertion` — 기대값을 미묘하게 틀리게 assert(symbolic `result==expected` vs 정확한 str 포맷)해 **fix 후에도 실패**(=not F2P). arm A는 파싱을 먼저 실행해 sympy의 실제 `str()` 표현을 본 뒤 invert → 정확한 포맷을 lock → 3/3. **AssertFlip이 설계대로 "wrong-expected-value 함정"을 회피한 첫 실증.** (antlr4 존재 확인, 결과 legit.)

**판정:** execution-loop 버전은 **처음으로 메커니즘의 실제 작동을 보였으나 통계적으로 무의미(p=0.40)** — 8-instance 샘플이 ceiling 5 + floor 2에 몰려 판별 인스턴스가 ~1개뿐. lever는 wrong-value·headroom 버그에서 도움이 될 수 있음이 directional로 시사되나, **확증되지 않음.** 세 번째 null. 스킬 변경 ①은 여전히 **미채택(revert 유지)**.

**확증에 필요한 것:** headroom-선별(wrong-value, mid-난이도 = ceiling도 floor도 아닌) 인스턴스로 n 확대. 현재 mix는 대부분 issue 본문에 완성 repro가 있어(ceiling) 또는 너무 어려워(floor) lever 표면이 없음. wrong-value 버그 10~15개에서 A>B가 유지되면 유의성 도달 가능.

---

## 확증 시도 — wrong-value 버그 n 확대 (headroom-selected)

test 3의 유일한 win(21612)이 wrong-value 버그였으므로, 메커니즘 예측대로 **wrong-value 버그만 선별해 n을 키우면** 유의성에 도달하는지 검정(pre-registered 가설: A>B). SWE-bench_Lite에서 base가 assertion으로 재현되는(=진짜 wrong-value) sympy 버그 7개를 추가 검증·선별, 기존 21612·23262와 합쳐 **9개 wrong-value 인스턴스**에 execution-loop A/B(sonnet) 실행(wf_b8e3ab86-bcc).

**결과 (결정적):** **arm A 24/26(92%) vs arm B 24/27(89%), stratified permutation p = 1.000.** 9개 중 **7개 ceiling**(양 arm 3/3=3/3), 판별된 2개가 **정반대로 상쇄**: 21612(A 3/3 > B 1/3) vs **23191(A 0/2 < B 2/3)**. test 3의 21612 win은 **재현되지 않음** — wrong-value를 더 모으자 효과가 완전히 소멸.

**결정적 메커니즘 결론:** execution feedback이 있으면 **arm B(direct)도 테스트를 실행·refine해 arm A와 같은 지점에 도달**한다. invert trick은 execution feedback 위에 **아무것도 더하지 않는다.** 진짜 lever는 "테스트를 실행한다"는 것 자체이고, 그건 assertflip-특유가 아니라 두 arm 모두에 동등하게 있다. 그래서 wrong-value regime에서도 tie. (21612가 이긴 건 arm B가 우연히 symbolic `==`를 써서 틀린 것; 23191에선 arm A의 characterize-current 단계가 복잡한 CoordSys3D 식에서 어긋나 B가 이김 — 양쪽 다 arm-내 분산, 체계적 invert 우위 아님.)

## 최종 종합 판정 (4개 A/B)

| # | 테스트 | A vs B | p |
|---|---|---|---|
| 1 | toy (Haiku) | 24/24 = 24/24 | tie(ceiling) |
| 2 | real, one-shot 지시 (Haiku) | 72% vs 69% | 1.000 |
| 3 | real, execution-loop, random mix (Sonnet) | 75% vs 67% | 0.397 |
| 4 | real, execution-loop, **wrong-value n=9** (Sonnet) | 92% vs 89% | **1.000** |

**assertflip lever는 의미 있는 개선을 주지 못한다 — 4개 A/B 전부 null.** real 버그로 escalate하고, faithful execution-loop을 구현하고, 메커니즘의 이상적 regime을 선별해 n을 키워도 유의성 없음. **변경 ①은 revert 유지(미채택).** 스킬-vs-무스킬에서 이 후보로는 lift 없음 확정. (skill의 실제 headroom이 있다면 repro trick이 아니라 implicit·non-public 도메인 지식 surfacing 또는 독립 critic 쪽 — corpus의 미검증 niche.)

---

## 진짜 skill-vs-NO-skill (3-way) — 결정적

이전 A/B는 arm A(assertflip 스킬) vs arm B(shipped 스킬)로 **둘 다 "스킬" 변형**이었다(유저 지적). 목표는 skill vs NO-skill이므로 **arm 0 = 스킬 없음**(방법·루프 지시 전무, plain agent 자연 행동, sonnet)을 15개 버그에 추가(wf_fab9f449-866, R=3).

**결과 (전부 p=1.000):**

| arm | valid_f2p | rate |
|---|---|---|
| **no-skill (0)** | 37/45 | **82%** |
| shipped-skill (B) | 36/45 | 80% |
| assertflip-skill (A) | 36/44 | 82% |

| 비교 | diff | permutation p |
|---|---|---|
| shipped vs **no-skill** | **-0.022** | 1.000 |
| assertflip vs no-skill | -0.004 | 1.000 |
| assertflip vs shipped | +0.018 | 1.000 |

**스킬이 무스킬을 이기지 못한다 — 세 arm 통계적 동일(~82%, p=1.000), shipped는 오히려 미세하게 나쁨.** per-instance는 양방향 노이즈: 21612는 assertflip이 이기고(3/3 vs 0/1), 23191·24213은 no-skill이 이김(스킬이 오히려 해가 됨). 순효과 0.

**최종 결론:** 강한 모델(sonnet)은 스킬 지시 없이도 실제 버그를 82%로 재현한다 — supergoal의 debug 가이드는 **모델이 자연히 하는 것과 중복**이라 lift가 없다(±노이즈). corpus의 baseline-first를 **skill-vs-no-skill 수준에서 직접 확증**. 스킬이 value를 더할 수 있는 유일한 곳은 모델이 *모르는* 지식(implicit·non-public 도메인 규칙)뿐 — public SWE-bench 버그엔 그게 없다. (미검증 잔여 cell: WEAK 모델에서의 skill-vs-no-skill.)

## provenance
research wf_e0566bbe-c6c · toy wf_f9ebfc43-92a · real one-shot wf_b530155e-957 · real execloop wf_4c500627-145 · wrong-value confirmatory wf_b8e3ab86-bcc · **no-skill 3-way wf_fab9f449-866** · harness `swt/*` · data princeton-nlp/SWE-bench_Lite · AssertFlip arXiv:2507.17542.
