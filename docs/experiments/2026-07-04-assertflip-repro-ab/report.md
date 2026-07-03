# AssertFlip repro-construction A/B — report

**날짜:** 2026-07-04 · **상태:** RUN 완료, **null result (unproven)** · **PRD:** `docs/plans/2026-07-04-hard-domain-debug-feature-ab-improvement-prd.md` §4 변경 ① / §5 프로토콜

## TL;DR

arm A(assertflip passing-then-invert repro 지침) vs arm B(shipped "create a failing test") 를 weak model(Haiku)로 A/B. **stratum-i(invertible)에서 완벽한 ceiling tie** — 주 지표 `valid_repro` **A 24/24 = B 24/24**, `resolved` 20/24 = 20/24. PRD §5의 사전등록 KILL 기준(층(i) 델타=0)에 걸림 → **개선은 proven이 아님.** stratum-ii(crash)는 grader 설계상 lever를 측정하지 못함(아래). 결론: **또 하나의 ceiling-driven tie** — corpus의 반복 결과와 일치. lever의 실제 regime(repro authoring이 진짜 병목인 real bug)은 toy fixture로 재현 불가.

## 방법

- **Arms:** A = `reference/debugging.md` step 1 + assertflip; B = shipped step 1(pre-edit, `git HEAD`). paired by (fixture, run).
- **Model:** Haiku (weak/non-ceilinged), effort low. 64 runs = 8 fixtures × 2 arms × 4 runs.
- **입력 통제:** 각 arm에 동일한 버그 소스 + 증상(방향)만 제공, exact oracle 값은 미제공 → repro 구성력을 bug-finding과 분리. hidden-spec 열람 금지.
- **채점:** 에이전트는 산출물(repro.test.mjs + fix.mjs)만 write. **채점자(Claude)가 `grade.mjs`를 out-of-band로 결정론적 재실행** — 에이전트 자기보고 불신([[proxy-fabricates-tool-output]]). `valid_repro` = HEAD에서 assertion-red(버그 경로) + fix 후 green. `resolved` = valid + hidden oracle 통과.
- **provenance:** research wf_e0566bbe-c6c, A/B produce wf_f9ebfc43-92a(64 agents, 0 error, 3.85M tok), grading `scratchpad/grade_ab.py`.

## 결과

| stratum | arm | valid_repro | resolved |
|---|---|---|---|
| i (invertible, 6 fixtures) | A | **24/24** | 20/24 |
| i | B | **24/24** | 20/24 |
| ii (crash, 2 fixtures) | A | 4/8 | 4/8 |
| ii | B | 5/8 | 2/8 |

per-fixture `valid_repro` (A vs B): normalize-score 4/4=4/4, business-hours 4/4=4/4, coupon-total 4/4=4/4, retry-delay 4/4=4/4, average-rating 4/4=4/4, priority-rank 4/4=4/4, config-port 4/4 vs 3/4, user-label 0/4 vs 2/4.

stratum-i는 모든 fixture에서 arm별 4/4 동일 → paired delta가 매 쌍 정확히 0 → 평균 델타 0, CI [0,0], permutation p=1. bootstrap 불필요(완전 동률). `resolved`의 유일한 miss(priority-rank 0/4 both)는 oracle의 임의 상수(unknown→99) 미추측 — 양 arm 동일 페널티, lever와 무관.

## 왜 tie인가 (mechanism)

1. **stratum-i fixture가 너무 쉽다(ceiling).** 버그가 소스+증상에서 명확해 Haiku가 두 arm 모두 유효 실패 테스트를 직접 작성한다. assertflip이 해결하려는 "직접 실패 테스트 authoring fumble"이 애초에 발생하지 않으므로 lever가 드러날 표면이 없다. PRD §7의 사전 리스크("fixture가 신호를 못 낼 위험(ceiling); fixture는 repro authoring이 병목인 것만")가 그대로 실현.
2. **stratum-ii는 lever를 측정하지 못한다(grader/fixture 설계 결함).** crash 버그는 자연히 thrown exception(TypeError)으로 재현되는데, grader의 `isAssertionFailure`는 **AssertionError를 요구**한다. 그래서 valid/invalid는 "에이전트가 우연히 non-crash wrong-value 케이스(예: `readPort({server:{}})`→`Number(undefined)`=NaN≠3000, 또는 blank-name→''≠label)를 테스트에 넣었나"로 갈렸다 — lever가 아니라 테스트 케이스 선택의 부산물. 따라서 "arm A가 user-label에서 나쁨"은 **grader artifact이지 regression이 아니다**(config-port·user-label 모두 동일 크래시 패턴인데 결과가 갈린 게 그 증거). PRD §5의 "층(ii) A worse → revert" 기준은 이 잡음에 오발동하므로 **적용하지 않는다**.

## 판정

- **개선(변경 ①)은 proven이 아니다.** stratum-i 완전 동률 → 사전등록 KILL. baseline-first 규율상 이 상태로 스킬에 **커밋하지 않는다**(PRD §6 Phase 2 게이트 미통과). `reference/debugging.md`·`SKILL.md` 편집은 working tree에 **uncommitted**로 남긴다.
- **lever는 반증된 게 아니라 미검증이다.** 이 A/B는 ceiling으로 under-powered — assertflip이 무용함을 증명한 게 아니라, 이 fixture들이 lever를 시험할 regime을 못 만든 것. AssertFlip의 실제 headroom은 real SWE-bench 버그(복잡한 setup·불명확한 기대값에서 직접 실패 테스트가 자주 틀림)에서 나온다.

## 부수 발견 (codex 산출물의 설계 결함)

`grade.mjs`의 valid-repro 정의(assertion-red 필수)는 **crash 버그와 호환되지 않는다.** crash 버그의 자연스러운 repro는 `assert.throws()`/try-catch 기반이며 fix 후엔 throw가 사라진다. crash stratum을 제대로 채점하려면 grader가 "HEAD에서 throw + fix 후 non-throw"를 별도 valid 경로로 인정하거나, crash fixture를 wrong-value로 재설계해야 한다. 현 상태의 stratum-ii는 lever 측정 불가.

## 다음 테스트 (iterate)

toy fixture로는 lever를 드러낼 수 없다(쉬우면 ceiling, 어려우면 bug-finding에서 갈려 repro-construction이 격리 안 됨). 의미 있는 검증은 **repro authoring이 진짜 병목인 real 버그**를 요구한다:
- SWT-Bench(-Lite) 실제 태스크에서 arm A/B를 돌리고 동일 grader 원리(fails-on-HEAD-for-right-reason + passes-post-fix)로 채점, 또는
- 기대값이 비자명해 직접 실패 테스트가 자주 wrong-assert로 HEAD에서 통과(=invalid)되는 fixture를 authoring(단, 이때 crash 경로는 grader가 assert.throws를 valid로 인정하도록 수정).

이 regime은 corpus가 반복 지목한 "미검증 niche"(real·implicit-domain repo)와 성질이 같다 — 경량 in-repo eval의 사정권 밖. 그전까지 변경 ①은 **정직하게 unproven**으로 유지한다.
