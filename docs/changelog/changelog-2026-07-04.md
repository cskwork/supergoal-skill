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
