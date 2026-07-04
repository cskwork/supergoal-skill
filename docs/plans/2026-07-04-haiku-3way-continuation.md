# 이어서 할 계획 — 약한 모델(haiku) 3-way (debug-skill lever 마지막 검정)

**작성:** 2026-07-04 · **상태:** 실행 착수, 세션 중단 → 다음 세션에서 재개 · **목표:** supergoal 스킬이 skill-vs-no-skill 하네스 eval에서 *의미 있는* 개선을 보이는가.

## 지금 어디까지 왔나 (이번 세션 요약)

assertflip(리서치가 3축 6후보 중 유일하게 통과시킨 debug 개선안)을 **6개 워크플로우**로 끝까지 검정. 전부 커밋됨(`docs/experiments/2026-07-04-{assertflip-repro-ab, swt-assertflip-realbug-ab}/`, changelog-2026-07-04.md, PRD). 결과:

| # | 실험 | 비교 | 결과 |
|---|---|---|---|
| 1 | toy fixture (Haiku) | assertflip vs shipped | 24/24=24/24 tie |
| 2 | real one-shot (Haiku) | assertflip vs shipped | 72% vs 69%, p=1.000 |
| 3 | real execloop random (Sonnet) | assertflip vs shipped | 75% vs 67%, p=0.397 |
| 4 | real execloop wrong-value n=9 (Sonnet) | assertflip vs shipped | 92% vs 89%, p=1.000 |
| 5 | real execloop 3-way n=15 (Sonnet) | **no-skill / shipped / assertflip** | **82% / 80% / 82%, 전부 p=1.000** |

**결론(지금까지): 강한 모델에선 스킬이 무스킬을 못 이긴다(p=1.000, 스킬 지시가 모델이 이미 하는 것과 중복).** 변경 ①은 revert/미채택 유지.

## 남은 단 하나 — 이 계획의 대상

**약한 모델(haiku) 3-way.** sonnet(82%)은 no-skill baseline이 이미 너무 잘해서 스킬이 들어갈 틈이 없었다. **haiku는 no-skill이 허우적댈 수 있어, 명시적 스킬 지시(run+refine, assert-then-invert)가 lift를 보일 유일하게 남은 곳.** 이게 debug-skill lever의 마지막 확정 검정.

- **설계:** 15개 실제 sympy 버그 × 3 arm(0=no-skill / B=shipped / A=assertflip) × R=3 = **135 haiku 에이전트**, execution-loop 프로토콜(에이전트가 worktree에 pytest 실제 실행). 채점 = fail-to-pass vs gold patch, out-of-band 결정론적.
- **이번 세션 실행분:** 워크플로우 `wf_2a266834-30e`(haiku3way_wf.js). **주의: 출력(swt/abh/)·sympy 클론·worktree는 세션 scratchpad(휘발성)라 다음 세션에 없어짐 → 재구축·재실행 필요(아래).**

## 재개 절차 (cold resume — scratchpad는 사라졌다고 가정)

커밋된 자산(`docs/experiments/2026-07-04-swt-assertflip-realbug-ab/`): `lib.py, setup_worktrees.py, grade_swt.py, analyze_3way.py, haiku3way_wf.js, execloop_wf*.js, noskill_wf.js, instances/, instances2/, validated*.json, graded_*.json, ab*/`(후보 테스트 전부).

1. **env 재구축** (Docker 불필요):
   - `pip install mpmath pytest`
   - `git clone https://github.com/sympy/sympy.git <SCRATCH>/swt/sympy`
   - `lib.py`의 `SCR` 경로를 새 세션 scratchpad로 수정(또는 env var화). 커밋된 `instances/`(8) + `instances2/`(7)를 `<SCRATCH>/swt/`로 복사.
   - `python setup_worktrees.py` (8) + instances2용 worktree 생성(기존 코드 재사용) → `<SCRATCH>/swt/wt/<id>` 15개.
2. **haiku 3-way 재실행:** `haiku3way_wf.js`의 절대경로(AB, WT, INSTS[].wt)를 새 scratchpad로 재생성(생성 로직은 changelog/이 문서의 arm 텍스트 참조; 프롬프트·arm 정의는 커밋된 haiku3way_wf.js에 그대로 있음) → `Workflow({scriptPath})`. 135 haiku, ~10분.
3. **채점:** `python grade_swt.py swt/abh swt/graded_haiku.json swt/validated_all.json`.
4. **분석:** graded_haiku.json(arm 0/A/B 한 파일)에 stratified permutation — no-skill vs shipped, no-skill vs assertflip, assertflip vs shipped. (analyze_3way.py를 graded_haiku 단일 입력으로 조정하거나 인라인 permutation.)

## 판정 로직

- **shipped 또는 assertflip이 no-skill을 유의하게(permutation p<0.05) 이기면** → "약한 모델 + debug 스킬"에서 lift 발견 → 그 arm의 스킬 텍스트를 keep/ship 검토(단, 사전등록 재현 1회 더 권장).
- **전부 p>0.05(예상)면** → debug-skill lever **완전 종료**. baseline-first가 skill-vs-no-skill 전 스펙트럼(강·약 모델)에서 확정. → **pivot**: 스킬 value는 모델이 *모르는* 지식에서만 나오므로, 다음 조사는 **implicit·non-public 도메인 규칙 레포**(LEGACY/LEARN-DOMAIN)에서 skill-vs-no-skill, 또는 **독립 critic이 prose 스펙을 실패 테스트로 바꾸는 role-loop**(corpus 유일의 directional 승리). repro/debug 지시 계열은 접는다.

## 핵심 교훈 (다음 세션이 반드시 알아야 할 것)

1. **skill-vs-skill이 아니라 skill-vs-NO-skill을 봐라.** 이번에 arm A/B 둘 다 스킬 변형이라 진짜 baseline(arm 0)을 빠뜨렸었다(유저 지적으로 교정).
2. **execution feedback이 lever의 본체다 — 근데 스킬-특유가 아니다.** 테스트를 돌려보게 하면 direct arm도 같은 지점 도달. invert trick은 그 위에 0.
3. **채점은 out-of-band 결정론적으로**(에이전트 자기보고 불신, [[proxy-fabricates-tool-output]]). fail-to-pass = base FAIL(collection 아님) + gold fix 시 PASS.
4. **멀티에이전트 repo 위험:** 이번에 다른 에이전트의 브랜치 전환이 내 uncommitted 스킬 편집을 clobber함([[branch-worktree-merge-workflow]]) — 자주 커밋하거나 worktree 격리.
5. Docker 없이 **sympy from-source(PYTHONPATH+mpmath)** 로 실제 SWE-bench_Lite 버그를 fail-to-pass 채점하는 rig가 이 실험 dir에 있다 — 미래 DEBUG-skill eval의 재사용 substrate.

## 결과 — RESOLVED (2026-07-04 cold resume, 10-instance 상한)

haiku 3-way 재구축·재실행·채점 완료(워크플로우 `wf_f53fc4e0-3d1`, 130/135 에이전트 성공). 사용자 요청으로 15→**10 instance 상한**(id 오름차순 앞 10개 사전고정 — 결과보고 선택 아님, 편향 방지). 89 후보 out-of-band fail-to-pass 채점, grader 신뢰성은 수동 교차확인(22005 B:r1 base실패→gold후통과 valid=True, 0:r1 gold후에도실패 valid=False, 둘 다 일치).

| arm | valid_f2p | rate |
|---|---|---|
| no-skill (0) | 17/30 | 57% |
| shipped-skill (B) | 21/29 | 72% |
| assertflip-skill (A) | 20/30 | 67% |

stratified permutation(50k, instance 층화):
- **shipped vs no-skill: diff=+0.157, p=0.102** (n_inst=10)
- assertflip vs no-skill: diff=+0.100, p=0.549
- assertflip vs shipped: diff=-0.057, p=0.756

**판정: 6번째 null (α=0.05 미달) — 단 질적으로 다름.** 앞 5개는 p 0.40~1.00 방향성 무(無). 이번은 **캠페인 최초의 방향성 pulse가 예측대로 약한 모델 niche에서 발생**: no-skill이 57%로 떨어져(sonnet 82%) 헤드룸이 생기자 shipped가 +15.7pp. 기전은 per-instance 확인 — shipped(실행루프+실패까지 반복)가 어려운 버그에서 weak 모델을 끌어올림(22005 1→3, 23191 0→1, 23262 0→1); assert-then-invert(A)는 그 위에 0이거나 오히려 해침(21055 3→1, 21627 3→1) → lesson #2 재확인(execution feedback이 lever, invert trick은 0~음).

n=10(사용자 상한)이라 검정력 낮음 → +15.7pp가 15에서 교차했을지 회귀했을지 미상. **사전등록 α=0.05로는 debug-skill이 no-skill을 이긴다 주장 불가 → lever는 닫힌 것으로 기록.** 단 약한 모델 niche는 유일하게 pulse가 보인 지점(향후 재방문 시 여기서 R↑/instance↑). [[supergoal-baseline-first]]는 α=0.05에서 유지되나 "약한 모델에선 flat-zero가 아니라 sub-threshold pulse"로 정련.

재현: sympy from-source + 15 worktree 재구축 후 `SWT_SCR=<scratch> python grade_haiku.py && python analyze_haiku.py`. graded_haiku.json·grade_haiku.py·analyze_haiku.py 커밋됨. lib.py는 SWT_SCR env화(다음 cold-resume 재편집 불필요).

## 확증 — FINAL (pre-registered n=15): 6번째 null, 릴리스 없음

10-instance 상한의 shipped +15.7pp(p=0.102)를 확증하려 **원래 계획 n=15로 복귀**. 남은 5개(24066·24102·24152·24213·24909)는 워크플로우에서 이미 실행된 에이전트 산출물 → **채점만 추가(새 에이전트 0)**. 결정 규칙은 채점 전 잠금: shipped vs no-skill p<0.05 → release, 아니면 종결. 확증 1회로 종료(optional-stopping 차단).

| arm | n=10 (상한) | n=15 (확증) |
|---|---|---|
| no-skill | 17/30 = 57% | 24/45 = **53%** |
| shipped | 21/29 = 72% | 28/43 = **65%** |
| assertflip | 20/30 = 67% | 31/44 = **70%** |

permutation(50k, n=15):
- **shipped vs no-skill: diff=+0.118, p=0.124** ← 1차 검정, α=0.05 미달
- assertflip vs no-skill: diff=+0.171, p=0.074
- assertflip vs shipped: diff=+0.053, p=0.588

**판정: 6번째 null 확정 (n=15에서도 전부 p>0.05) → 릴리스·main 병합·태그 없음.** n=10의 "shipped 최고점·p=0.10 pulse"는 **데이터가 늘자 소멸**: shipped 72%→65% 하락, 서열마저 뒤집혀 assertflip이 명목 최고(그것도 p=0.074로 유의 아님). **유의성 게이트가 존재하는 이유의 교과서적 사례** — n=10 관측 우위는 노이즈. [[supergoal-baseline-first]] 재확증: 약한 모델·헤드룸 있는 regime에서도 debug-skill의 유의한 lift 없음 → **lever 완전 종결.** provenance(확증): grade15 = wf_f53fc4e0-3d1 산출물 재채점.

## provenance
research wf_e0566bbe-c6c · wf_f9ebfc43-92a · wf_b530155e-957 · wf_4c500627-145 · wf_b8e3ab86-bcc · wf_fab9f449-866 · **haiku 3-way: 최초 wf_2a266834-30e (미채점, scratchpad 휘발) → 재실행·채점 wf_f53fc4e0-3d1 (RESOLVED)**. 커밋: PRD b4981ea, toy caf9c68, real one-shot 35fc50b, execloop 83994c4, wrong-value 3544ee5, 3-way dc4f439.
