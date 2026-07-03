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

## provenance
research wf_e0566bbe-c6c · wf_f9ebfc43-92a · wf_b530155e-957 · wf_4c500627-145 · wf_b8e3ab86-bcc · wf_fab9f449-866 · **haiku 3-way wf_2a266834-30e (이번 세션, 미채점)**. 커밋: PRD b4981ea, toy caf9c68, real one-shot 35fc50b, execloop 83994c4, wrong-value 3544ee5, 3-way dc4f439.
