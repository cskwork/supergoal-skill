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
