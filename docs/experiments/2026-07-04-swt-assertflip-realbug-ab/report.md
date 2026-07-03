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

## provenance
research wf_e0566bbe-c6c · toy A/B wf_f9ebfc43-92a · real-bug produce wf_b530155e-957 · harness `swt/{lib,validate_all,grade_swt,produce_wf}` · data princeton-nlp/SWE-bench_Lite · AssertFlip arXiv:2507.17542.
