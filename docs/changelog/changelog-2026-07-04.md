# Changelog 2026-07-04

## 하드 도메인·디버깅·복잡-코드베이스 기능구현 개선 리서치 → PRD (제안, 미구현)

**산출물:** `docs/plans/2026-07-04-hard-domain-debug-feature-ab-improvement-prd.md`

**요청:** 이 스킬이 baseline(스킬 없이) 대비 *의미 있게* 나아지는 지점을 세 축(복잡 도메인 로직 / 디버깅 / 매우 복잡한 코드베이스 기능구현)에서 A/B로 찾아 개선안 PRD를 만들라. 파이프라인: research(이번) → call-agent codex 구현 → full A/B·harness 검증 → 반복.

**방법:** 개선-리서치 하네스 워크플로우 `wf_e0566bbe-c6c`(14 에이전트 / 1.31M 토큰 / 712s). 웹 5각도 best-practice 스캔 + 로컬 스킬 정독 + 28개 실험 frontier 마이닝 → 6후보 합성 → 후보별 fresh-context 적대적 검증(redundancy / headroom / falsifiability 3-기준, default REJECT).

**결과 (핵심 발견):** 세 축 6후보 중 **적대적 검증 통과 1개**.
- **채택:** `assertflip-reproduce-inversion` (debug) — `reference/debugging.md` step 1이 fail-to-pass repro를 *의무화*하면서 construction 기법은 전무. AssertFlip(ICSE 2026, arXiv:2507.17542, 실재 확인)의 "현재 버그 동작에 통과 테스트 작성 → green 확인 → assertion 반전 → 옳은 이유로 red → fix"를 default repro 구성법으로 추가. 약한 모델에서 repro authoring(루프의 전제조건) 성공률을 올림. 강한 모델엔 tie, 크래시 버그엔 무해 degrade.
- **기각 5개:** execution-harvested-invariants·domain-decision-matrix(domain) = characterization baseline + must/should/ask-user critic + edge pass와 redundant, 동기 사례는 public-standard ceilinged. callgraph-bounded-localization(debug) = Localize + domain-context codegraph + 전역 MCP 라우팅과 redundant + tool-access confound. regression-scoped-edit-map(feature) = Final Verify + regression_ledger + characterization과 redundant, lift는 약화 baseline 인위 제작. mutation-kill-test-gate(method) = red-green discipline과 중첩, 누락 테스트는 mutate 대상 없음.

**한 줄 결론:** 스킬의 **도메인·기능 축 머신러리는 이미 포화** — 세운 후보를 기존 critic/edge-pass/characterization/regression_ledger가 전부 흡수. 세 축 통틀어 유일한 진짜 갭은 **디버깅의 repro 구성**. baseline-first 논지를 재확증하면서, 처음으로 축을 특정해 단일 falsifiable lever를 분리.

**결정 근거 / 기각한 대안:**
- 순수 웹 deep-research나 28실험 재-합성만으로 PRD를 쓰지 않음 — 사용자 의도는 내부 A/B headroom 발굴. 웹은 외부 best-practice 입력으로만 사용(AssertFlip 발굴에 기여).
- 인용(AssertFlip)은 커밋 전 WebSearch로 실재 교차검증(메모리 [[proxy-fabricates-tool-output]] 대비). 실존·메커니즘 일치 확인.
- inventory가 지목한 7개 capability-gap(property-based 불변식 default, cross-service 기능 playbook, feature-flag/canary, 루프 내 성능검증, user-facing 문서갱신, fault-injection repro)은 **존재하는 갭이나 headroom 미검증** → PRD 미채택, §8 미래 lever로만 기록(redundancy가 실패 모드였던 교훈).

**다음 단계:** PRD §5 A/B 프로토콜(약한 모델·층화 paired·machine-graded, 층(i) BCa CI>0 & p<0.05, 층(ii) negative-control 무회귀)이 verify 단계의 실행 스펙. codex가 변경 ① + 계약 테스트 + fixture ≥8건 구현 → 내가 프로토콜 실행 → 통과해야 keep(구현=승리 아님; role_source=paraphrase 교훈).

**커밋 범위:** PRD + 이 changelog만. 세션 시작 시점부터 dirty였던 `docs/experiments/.../harness-ref-002/` 63파일 및 기타 untracked(`docs/superpowers/`, `learn/`)는 내 변경 아님 → 제외.

**근거 원본:** 워크플로우 `wf_e0566bbe-c6c` (kept/rejected·verdict·web evidence 전문).

---

## verify 단계 실행 — A/B null result (변경 ① unproven)

**산출물:** `docs/experiments/2026-07-04-assertflip-repro-ab/report.md` (codex가 scaffold, Claude가 실행·채점)

**방법:** arm A(assertflip 지침) vs arm B(shipped) 를 Haiku로 A/B(wf_f9ebfc43-92a, 64 runs, 8 fixtures × 2 arms × 4). 에이전트는 산출물만 write, **채점은 Claude가 `grade.mjs` out-of-band 결정론적 재실행**(자기보고 불신).

**결과:** stratum-i(invertible) **완벽한 ceiling tie** — `valid_repro` A 24/24 = B 24/24, `resolved` 20/24 = 20/24, per-fixture 전부 동일. PRD §5 사전등록 KILL 기준(층(i) 델타=0) 발동 → **개선 proven 아님.** stratum-ii(crash)는 grader가 assertion-red를 요구해 crash repro(thrown exception)를 측정 못 함 → uninformative(A<B는 grader artifact, regression 아님).

**판정:**
- 변경 ①(`reference/debugging.md` step 1 + `SKILL.md`) 편집은 **커밋하지 않고 working tree에 uncommitted 유지** — baseline-first + commit-gate 규율(비-green 커밋 금지, PRD §6 Phase-2 게이트 미통과).
- lever는 **반증이 아니라 미검증** — toy fixture가 너무 쉬워(ceiling) assertflip이 해결하는 "직접 실패 테스트 fumble"이 발생하지 않음. 실제 headroom은 repro authoring이 병목인 real SWE-bench-class 버그에서만 나타남 → corpus의 "미검증 niche"와 동성질, 경량 in-repo eval 사정권 밖.
- **부수 발견:** `grade.mjs`의 valid-repro 정의(assertion-red 필수)가 crash 버그와 비호환 — crash stratum 채점 불가. 향후 iteration은 grader가 "HEAD throw + fix 후 non-throw"를 valid로 인정하거나 fixture를 wrong-value로 재설계해야.

**커밋 범위(verify):** 실험 dir(`docs/experiments/2026-07-04-assertflip-repro-ab/` — fixtures·grader·report·README) + 이 changelog 추가분. `reference/debugging.md`·`SKILL.md`는 **제외**(unproven).

**결론:** 이번 A/B는 corpus의 baseline-first를 **재확증**(ceiling-driven tie). 처음으로 축을 특정해 단일 lever를 분리하고 real-bug regime으로 escalation 경로를 명확히 함. provenance: wf_e0566bbe-c6c(research), wf_f9ebfc43-92a(A/B).

---

## escalation — REAL 버그(SWE-bench_Lite sympy) A/B (유저 요청: non-saturated 하드 task)

**산출물:** `docs/experiments/2026-07-04-swt-assertflip-realbug-ab/report.md`

**방법(진짜 SWT-Bench-Lite):** `princeton-nlp/SWE-bench_Lite`에서 py3.9 호환 sympy 8 인스턴스. Docker 없이 sympy 소스 실행(PYTHONPATH+mpmath), 8/8 gold fix로 fail-to-pass 사전검증. arm A(assertflip) vs B(shipped) Haiku 64런(wf_b530155e-957). 채점 = **SWT-bench 표준 fail-to-pass**(base FAIL + gold fix 시 PASS), Claude out-of-band 결정론적.

**결과:** **arm A 23/32(72%) vs arm B 22/32(69%), stratified permutation p=1.000.** 유의미한 lift 전무. per-instance: 4 ceiling + 2 floor + 1 tie + 1 A>B(23262, n=1). 유일한 win은 B가 기대값을 틀리게 assert(fix=assertion)한 걸 assertflip이 회피한 것 — 메커니즘 일치하나 노이즈.

**결정적 발견:** 진짜 AssertFlip은 **execution-feedback 루프**(passing test→실행→refine→invert)인데, 이 eval의 arm A와 PRD 변경 ①은 **one-shot 지시**라 메커니즘 미포함. → 검증된 것은 "assertflip을 지시로만 주면 real 하드 버그에서 lift 없음(p=1.0)"; **미검증은 execution-loop 구현**.

**판정:** 변경 ①은 **두 번째 null**(토이 24/24 tie + real p=1.0) → **커밋 금지 유지**, **revert 권장**. 남은 avenue = 변경 ①을 execution-feedback 루프로 재설계 후 재검증(대형, 유저 결정). corpus baseline-first를 real·hard·non-saturated regime에서까지 재확증(최강 반증). provenance: wf_b530155e-957.

## 약한 모델(haiku) 3-way skill-vs-no-skill — cold resume, 10-instance 상한 (RESOLVED)

**산출물:** `docs/experiments/2026-07-04-swt-assertflip-realbug-ab/{grade_haiku.py, analyze_haiku.py, graded_haiku.json}`, `lib.py`(SWT_SCR env화), 계획서 `docs/plans/2026-07-04-haiku-3way-continuation.md` 결과 섹션.

**요청:** 커밋 d697dce의 continuation plan 실행 — debug-skill이 *약한 모델(haiku)*에서 no-skill을 이기는지. sonnet 3-way는 baseline이 이미 82%라 스킬 여지 없었음(p=1.0). 약한 모델은 baseline이 허우적대 lift가 남은 유일한 셀.

**방법:** scratchpad 휘발로 cold resume — sympy from-source 재클론 + 15 worktree(base_commit별) 재구축, 워크플로우 경로 치환, 재실행 `wf_f53fc4e0-3d1`(15 inst × 3 arm × R3 = 135 haiku 에이전트, execution-loop; 130/135 성공). 채점은 out-of-band 결정론적 fail-to-pass(base 실패 + gold fix 통과), grader 신뢰성은 수동 교차확인. **사용자 요청으로 15→10 instance 상한**(id 오름차순 앞 10개 사전고정 — 결과보고 선택 아님, p-hacking 방지).

**결과 (10 inst / 89 후보):**
- no-skill 17/30 = **57%**, shipped-skill 21/29 = **72%**, assertflip 20/30 = 67%.
- stratified permutation: **shipped vs no-skill diff=+0.157 p=0.102** · assertflip vs no-skill +0.100 p=0.549 · assertflip vs shipped −0.057 p=0.756.

**판정: 6번째 null (α=0.05 미달) — 단 질적으로 다름.** 앞 5개는 p 0.40~1.00 방향성 무. 이번은 **캠페인 최초의 방향성 pulse가 예측대로 약한 모델 niche에서 발생**(no-skill 57%로 헤드룸 생김 → shipped +15.7pp). 기전 per-instance 확인: shipped(실행루프+실패까지 반복)가 어려운 버그에서 weak 모델을 끌어올림(22005 1→3, 23191 0→1, 23262 0→1); assert-then-invert(A)는 위에 0~음(21055 3→1, 21627 3→1) → lesson "execution feedback이 lever, invert trick은 0" 재확인.

**릴리스 결정 — 보류(NO release).** shipped가 raw 최고점이나 **통계적 확정 아님(p=0.102 > 0.05)**. 사용자 게이트 "명확하게 확정된 경우만" 미충족 → main 병합·minor release·태그 **하지 않음**. 또한 arm B(shipped)는 *이미 배포된* 디버그 스킬 = status quo라 릴리스할 신규 아티팩트도 없음. n=10(사용자 상한)이라 검정력 낮음 → +15.7pp가 15에서 교차/회귀 미상.

**결정 근거 / 대안:** (1) p=0.10을 "win"으로 릴리스하면 캠페인 전체가 방지해온 confabulation([[proxy-fabricates-tool-output]], [[supergoal-baseline-first]])을 범함 → 거부. (2) 커밋/푸시는 데이터 캡처라 무조건 수행(dev). (3) 확정을 원하면 held-out 5 instance(worktree 이미 존재) 추가 또는 R↑ 재검증 — 사용자 결정(현재 "15는 많다"로 상한했으므로 미제안 기본). **baseline-first는 α=0.05에서 유지되나 "약한 모델=flat-zero"가 아니라 "sub-threshold pulse"로 정련.** provenance: wf_f53fc4e0-3d1.

## 확증 — pre-registered n=15 재검정 (FINAL): 6번째 null, 릴리스 없음

**요청:** n=10의 shipped +15.7pp(p=0.102)를 확정할지. 사용자 선택 = 확증 실험. 마침 워크플로우가 15개 전부의 에이전트를 이미 실행(130/135) → 남은 5개(24066·24102·24152·24213·24909)는 **채점만 추가(신규 에이전트 0)**. **결정 규칙을 채점 전 잠금**: shipped vs no-skill p<0.05 → minor release, 아니면 종결. 확증 1회로 끝(optional-stopping 차단).

**결과 (n=15, 132 후보):** no-skill 24/45=53% · shipped 28/43=65% · assertflip 31/44=70%.
- **shipped vs no-skill: diff=+0.118, p=0.124** (1차 검정)
- assertflip vs no-skill: diff=+0.171, p=0.074
- assertflip vs shipped: diff=+0.053, p=0.588

**판정: 6번째 null 확정 — 릴리스/main 병합/태그 없음.** n=10의 "shipped 최고점·p=0.10"은 데이터가 늘자 **소멸**: shipped 72%→65% 하락, 서열마저 뒤집혀 assertflip 명목 최고(p=0.074, 유의 아님). **n=10 관측 우위는 노이즈였음 — 유의성 게이트의 존재 이유를 실증.** 셋 다 α=0.05 미달. [[supergoal-baseline-first]] 재확증: 약한 모델·헤드룸 regime에서도 debug-skill 유의 lift 없음 → **debug-skill lever 완전 종결.** graded_haiku.json은 n=15로 갱신 커밋. provenance: 확증 채점 = wf_f53fc4e0-3d1 산출물.
