# supergoal 개선 PRD — 하드 도메인·디버깅·복잡 코드베이스 기능구현 A/B

**작성:** 2026-07-04 · **상태:** 제안(proposed, 미구현) · **방법:** 개선-리서치 하네스(워크플로우 `wf_e0566bbe-c6c`, 14 에이전트 / 1.31M 토큰 / 712s) — 웹 5각도 best-practice 스캔(domain/debug/feature/eval-method/role-loop) + 로컬 스킬 정독(SKILL.md, reference/harness-eval·role-loop·debugging·domain-context·domain-rules·learn-domain·spec·delivery-gate·qa·plan-grounding) + 28개 A/B 실험 frontier 마이닝 → 6개 후보 합성 → 후보별 fresh-context **적대적 검증**(redundancy/headroom/falsifiability 3-기준, default REJECT).

**사용자 통증점(원문 의도):** "복잡한 도메인 로직·하드 문제 해결, 디버깅, 그리고 매우 복잡한 코드베이스에서의 기능 구현 — 이 스킬이 baseline(스킬 없이) 대비 *의미 있게* 나아지는 지점을 A/B로 찾아 개선하라."

**파이프라인:** research(이 문서) → **call-agent codex 구현** → 내가 full A/B·harness 검증 → 의미 있는 lift(run-to-run 노이즈 밖) 나올 때까지 반복.

**이 문서의 범위:** 계획만. 스킬 코드는 아직 수정하지 않음. 구현은 승인 후 §4의 단일 변경부터.

---

## 0. 설계 제약 (먼저 못 박음 — 이걸 어기면 개선이 해롭다)

1. **baseline-first 유지 (측정된 교훈, 반복 확증).** 28개 실험 corpus의 대결론: 명시-스펙(explicit-spec) 작업에서 하네스는 *어떤 형태로도*(단일-프로세스 role-loop, INLINE, fan-out 멀티에이전트, 생성 verifier, HARNESS-MAKE) 강한 baseline을 correctness/quality로 **이기지 못한다** — 기껏 tie, 항상 2~9배 토큰/시간. 따라서 후보는 "명시 스펙을 baseline에 공짜로 넘기지 않는" headroom 영역에서만 유효하다: **implicit·non-public 도메인 규칙 + non-ceilinged(약한) baseline + machine grading.** 항상 켜지는 새 절차 = 실패 모드.
2. **redundancy 자체가 실패 모드.** 과거 다수 edit(seeded-DB 포인터, intent-integrity 업스트림 체크, naive 2nd pass)가 tie한 이유는 **기존 guidance가 이미 그 행동을 유도**했기 때문. 후보는 "스킬이 이미 induce하는 것"이면 기각. 이번 검증에서 6개 중 5개가 이 사유로 탈락.
3. **flag ≠ proof / tool-access ≠ 스킬 lift.** 코드를 생성한 모델의 자기검토는 게이트가 아니다. 그리고 도구 접근(예: MCP 콜그래프)으로 얻는 lift는 스킬 텍스트의 lift가 아니라 compute/도구 confound — baseline-first 논지가 명시적으로 배제한다.
4. **reference 편집은 terse.** reference는 에이전트가 읽는다. 편집분은 최소 지시. 근거·대안·측정값은 이 문서와 changelog에.
5. **주장은 falsifiable + machine-graded.** 개선은 반드시 약한 모델·기계 채점 A/B(n≥6, BCa CI가 0 제외 + sign-flip permutation p<0.05)로 증명/기각 가능해야 채택. 사람/LLM 판정에 의존하는 개선은 채택하지 않는다.

---

## 1. 진단 — headroom은 어디에 있는가

세 축(도메인 로직 / 디버깅 / 복잡 코드베이스 기능구현) 각각에 후보를 세우고 적대적으로 걸렀다. 결과 자체가 진단이다.

| 축 | 세운 후보 | 검증 결과 | 왜 |
|---|---|---|---|
| **도메인 로직** | ① execution-harvested invariants(Daikon식 값범위 마이닝) · ② condition×condition 결정 매트릭스 | **둘 다 기각** | ①은 QA characterization baseline + scenario stencil의 boundary/ordering이 이미 실무형을 커버; Daikon 슬라이스는 자기-모순(테스트가 불변식을 짚으면 Final Verify가 공짜로 잡고, 안 짚으면 우연값). ②는 must/should/ask-user critic + edge pass(precedence/ordering) + domain-rules Verify 체크리스트가 이미 미확정 상호작용을 게이트로 전환; 동기 사례(뱅커스라운딩×할인순서)는 **public-standard = ceilinged billing class**(하네스가 6/8로 진 바로 그 부류) |
| **디버깅** | ③ call-graph 구조적 localization 기본화 · ④ **AssertFlip 반전식 repro 구성** | ③ 기각 / **④ 채택** | ③은 debugging.md Localize(step 2 "structure/skeleton first") + domain-context codegraph + 전역 CLAUDE.md의 MCP 그래프 라우팅이 이미 존재 → redundant + **tool-access confound**. ④는 `debugging.md` step 1이 fail-to-pass repro를 **의무화하면서 construction 기법은 전무** — 유일하게 살아남은 진짜 갭 |
| **복잡 코드베이스 기능구현** | ⑤ 편집 전 at-risk 테스트맵 주입(regression-scoped edit map) | **기각** | Final Verify(REAL 테스트 재실행) + per-iteration `regression_ledger` + qa.md characterization baseline이 이미 P2P 회귀를 막음. 유일한 novelty(신호를 pre-edit로 이동)는 "에이전트가 전체 검증을 건너뛸 만큼 fixture를 키워야" lift가 나옴 → **약화된 baseline을 인위 제작**, purged된 anti-pattern |
| **방법론** | ⑥ mutation kill-check 테스트 게이트 | **기각** | red-green discipline(critic "leave failing tests red" + Fixer green) + guardrails("generated tests are a SIGNAL not the oracle")와 중첩; false-GREEN의 실제 원인인 *누락된 테스트*는 mutate할 대상이 없어 못 고침; 인용 fixture에서 tie 예측 |

**한 줄 진단:** 스킬의 **도메인 로직·기능구현 머신러리는 이미 포화**다 — critic/edge-pass/characterization/regression_ledger가 세운 후보들을 전부 흡수한다. 세 축을 통틀어 살아남은 유일한 진짜 갭은 **디버깅의 repro 구성(reproduce step)** 이다: 스킬이 "실패 테스트를 만들라"고 명령하지만 *어떻게 만드는지*를 주지 않아, 약한 모델이 이 단계를 fumble하면 downstream 전체가 corrupt된다. 이것이 이번 리서치의 핵심 발견이다.

---

## 2. 리서치 근거

### 2.1 frontier (28 실험, proven / refuted / untested)

**PROVEN (채택 근거로 사용 가능):**
- 명시-스펙 작업에서 하네스는 어떤 형태로도 baseline을 이기지 못한다(7실험/3케이스/2모델/4형태). [`log/changelog-2026-06-07.md`, `docs/experiments/2026-06-07-harness-eval-*`]
- **role-separated critic-writes-failing-tests → fixer → verifier**가 under-specified/latent-correctness에서 one-shot을 이긴다(case-015 "completion prefix+signatures"가 독립 critic이 실패 테스트를 쓴 뒤 처음 클리어; "signal ceiling"이지 capability ceiling 아님). [`docs/experiments/2026-06-07-codex-roleloop-vs-baseline-gpt55-low/`]
- forced-verification 하네스가 latent-correctness(deepMerge u1)에서 **통계적으로** 이김: false-GREEN 6/6→0/6, p=0.031, n=6 BCa CI>0. corpus 유일의 게이트-통과 "스킬이 이긴다" 결과이나, role_source=paraphrase(shipped `agents/*.md` byte-for-byte 아님). [`docs/experiments/2026-07-01-roleloop-coverage-fix-claude-ab/FINDINGS.md`]
- 약한 visible 테스트 스위트는 false-GREEN으로 실제 버그를 숨긴다(UTBoost: SWE-bench "resolved" 패치의 15.7~28.4%가 false-pass). 이 headroom은 **약한 스위트/약한 모델**에서만 신호가 뜬다.

**REFUTED (채택 금지):**
- naive 루프·게이트·중복 포인터는 explicit-spec에서 tie/loss.
- public-standard 상호작용(billing 등)은 ceilinged — 하네스가 6/8로 짐.
- 도구 접근으로 얻는 lift는 스킬 lift로 오인 금지.

**UNTESTED (미래 lever, 이번 PRD 미포함 — §8):**
- 실제 multi-file **proprietary/undocumented-domain-rule 레포**(LEGACY) — 모든 self-contained 1-shot eval이 스펙을 baseline에 공짜로 넘겨 스킬의 implicit-domain 가치를 under-test.
- shipped **byte-for-byte** role 파일이 n=6 forced-verification 승리를 재현하는가(현재 proven은 paraphrase).
- **약한 baseline @ scale** 에서의 headroom(전 내부 eval이 강한 모델 사용).
- DeepSWE happy-dom 실제-레포 clean paired 결과(양쪽 arm 완주, 사전 stop-policy).

### 2.2 채택 후보의 외부 근거 (검증 완료)

**AssertFlip — 실재 확인.** `AssertFlip: Reproducing Bugs via Inversion of LLM-Generated Passing Tests`, Khatib·Mathews·Nagappan, **ICSE 2026 Research Track**, arXiv:2507.17542, 오픈소스 `github.com/uw-swag/AssertFlip`. 핵심 발견(직접 대조 확인):
- **LLM은 일부러 실패/크래시하는 테스트보다 통과 테스트를 더 잘 쓴다.** 직접 failing-test 생성은 hallucinated API, placeholder(`assert False`, `# TODO`), 프레임워크 오용, env/의존성 불일치로 자주 *엉뚱한 이유로* 실패한다.
- 절차: 버그 동작에 대한 **passing 테스트 생성 → 실행 green으로 유효성 확인 → assertion을 spec-기대값으로 반전 → 버그 존재 시 fail하는 BRT**. 실패 시 error 메시지 기반 refinement 루프.
- SWT-Bench 리더보드에서 **알려진 모든 기법을 능가**(경쟁 3종이 못 푸는 30건 해결); 5-regeneration이 10 대비 비용 ~40%↓로도 SOTA 유지.

이 발견이 스킬에 주는 함의: `debugging.md`가 요구하는 "F→P repro"의 **구성 방법**으로 정확히 들어맞고, 우리 도메인(supergoal은 이미 REAL 테스트·playwright-cli로 실제 레포를 구동)에서 실행 가능하다.

---

## 3. 설계 원칙

- **P1 repro 구성은 authoring 난도를 낮추는 방향으로.** 약한 모델이 잘하는 일(통과 테스트 작성) + 결정적 변환(assertion 반전)으로, 잘 못하는 일(실패 테스트 직접 작성)을 대체한다. repro는 루프의 *전제조건*이므로 이 한 단계의 성공확률을 올리는 것이 downstream 전체를 살린다. (AssertFlip)
- **P2 red는 "옳은 이유로" red여야 한다.** collection/import/setup 에러로 인한 red는 유효 repro가 아니다(가짜 red-for-wrong-reason). 유효성 게이트: 반전 전 통과가 green이어야 하고, 반전 후 red는 *assertion* 실패여야 한다.
- **P3 tiered — 크래시/예외 버그는 예외.** 현재 동작이 assertable 값이 아니라 크래시면 반전할 깨끗한 값이 없다 → 기존 절차로 degrade(무해·무-lift). fixture는 repro authoring이 병목인 케이스여야 신호가 뜬다.
- **P4 채택은 machine-graded A/B로만.** 약한 모델·기계 채점, 층화(stratified) + paired + BCa CI + permutation. tie면 tie로 보고(round up 금지).

---

## 4. 변경 상세 (단일 변경, P0)

> 세 축 6후보 중 적대적 검증을 통과한 **유일한** 변경이다. 나머지 5개는 §4.2 "채택 금지"에 근거와 함께 박아, codex가 재-제안하지 않도록 한다.

### 변경 ① [P0] AssertFlip 반전식 repro 구성을 DEBUG 기본 repro 방법으로

**해결 통증점:** 디버깅 — 약한 모델이 실패 테스트를 직접 못 써서 repro가 엉뚱한 이유로 실패, 루프 전체 corrupt. **근거:** §2.2 AssertFlip, P1·P2·P3.

**대상 파일 및 편집 (terse — 실제 구현은 이보다 짧게):**

1. **`reference/debugging.md` Loop step 1 "Reproduce red (fail-to-pass)"** (현행 L74-78: "Create a deterministic failing test... The repro must FAIL on current code and PASS after the fix... Reproduction is its own skill... scaffold it explicitly.") — repro **구성 방법**을 default로 추가:
   - "직접 실패 테스트를 못 짜겠거나 약한 모델이면: (1) **현재(버그) 동작을 assert하는 통과 테스트**를 쓰고 green 확인(테스트가 그 경로를 실제로 탄다는 증명) → (2) assertion을 **spec-기대값으로 기계적 반전** → 이제 *옳은 이유로* red → (3) 그 red에 대해 fix. 반전 전 통과가 green이 아니면(collection/import/setup 에러) 그 error로 테스트를 refine, 재작성 아님."
   - 가드(P2): "유효 red = **assertion** 실패. import/setup 실패는 유효 repro 아님."
   - 가드(P3): "현재 동작이 크래시/예외라 assert할 값이 없으면 이 방법 skip, 표준 repro로 진행(무해)."

2. **`SKILL.md`** — DEBUG repro 라인에 포인터 1개: "repro가 안 잡히면 assert-current-then-invert(`reference/debugging.md` step 1)."

**수락 기준:** DEBUG 실행에서 (a) repro가 안 잡히거나 약한 모델일 때 passing-then-invert 절차가 default로 시도되고, (b) 반전 전 green·반전 후 assertion-red 유효성 게이트가 문서화되며, (c) 크래시 버그는 skip 사유 1줄 로그.

**계약 테스트(부패 방지):** `tests/debugging-contract.test.sh`(없으면 신설)에 `require_text ... "reference/debugging.md" "invert"`(또는 "assert-current") + `"assertion"` 유효성 문구 assert. 기존 `tests/*.test.sh` 전부 green 유지.

**terse 확인:** 편집 후 `debugging.md` 단어 수 회귀 확인 — 추가는 step 1 내 3~4문장 이내.

### 4.2 채택 금지 (적대적 검증 0-통과 — codex는 재-제안 말 것)

| 후보 | 축 | 기각 사유(요약) | redundant with |
|---|---|---|---|
| execution-harvested-invariants (Daikon식 값범위 마이닝) | domain | 실무형은 이미 존재; Daikon 슬라이스 자기-모순 | qa.md characterization baseline + scenario stencil |
| domain-decision-matrix (condition×condition) | domain | presentation refinement일 뿐; 동기 사례가 public-standard ceilinged | must/should/ask-user critic + edge pass + domain-rules Verify |
| callgraph-bounded-localization | debug | redundant + **tool-access confound**(스킬 lift 아님) | debugging.md Localize + domain-context codegraph + 전역 MCP 라우팅 |
| regression-scoped-edit-map | feature | 결과는 이미 보장됨; lift는 **약화된 baseline 인위 제작** | Final Verify + regression_ledger + characterization baseline |
| mutation-kill-test-gate | method | 누락 테스트(진짜 원인)는 mutate 대상 없음; red-green과 중첩 | role-loop red-green discipline + guardrails |

---

## 5. A/B 검증 프로토콜 (verify 단계의 실행 스펙)

codex가 변경 ①을 구현한 뒤 **내가 이 프로토콜을 그대로 돌린다.** 통과 못 하면 변경을 되돌린다.

- **Arms:** A = `debugging.md` step 1 + AssertFlip passing-then-invert / B = shipped "create a deterministic failing test". paired(동일 seed).
- **Model:** 약한·non-ceilinged — codex gpt-5.5 @ low effort(또는 Haiku-class). 강한 모델은 실패 테스트를 잘 써서 **tie가 정상**(신호 없음) → 약한 모델 필수.
- **Fixture:** SWT-bench식 버그 **≥8건**, 사전 실패 테스트 **없음**(repro를 authoring해야 함), 층화:
  - (i) **6건** — 현재 동작이 assertable *wrong value*(반전 가능).
  - (ii) **2건** — 크래시/예외 = **negative-control**(P3 degrade 확인용).
  - 레포 기존 fixture 스타일(예: seeded-DB, deepMerge)로 신규 작성. 각 fixture = 버그 함수 + hidden spec + 채점 러너.
- **Grader (machine, LLM 판정 금지):** repro가 **VALID**인 조건 = (a) HEAD에서 fail + fix 후 pass **그리고** (b) red가 **버그 경로의 assertion 실패**(collection/import/setup 에러는 INVALID — 가짜 red 차단). + 최종 resolved rate.
- **Metric:**
  - 층 (i): valid-repro rate + resolved rate, paired, **BCa CI가 0 제외 AND sign-flip permutation p<0.05**.
  - 층 (ii): A가 B의 노이즈 범위 내(회귀 아님 = P3 무해 확인).
- **Kill 기준:** 층(i) CI가 0 포함 → 변경 되돌림. 층(ii)에서 A가 B보다 나쁨 → 변경 되돌림.
- **n:** 층당 paired n≥6(가능하면 8). tie면 tie로 보고.

---

## 6. 시퀀싱 (research → codex → verify → iterate)

| Phase | 담당 | 내용 | 게이트 |
|---|---|---|---|
| **0 (이 커밋)** | 나 | 이 PRD + changelog 포인터 | — |
| **1 구현** | **call-agent codex** | 변경 ① 편집(`debugging.md` step 1 + `SKILL.md` 포인터) + `debugging-contract.test.sh` + §5 fixture ≥8건 + 채점 러너 | reference terse 확인 + 기존 `tests/*.test.sh` green + 신규 계약 assert green |
| **2 검증** | 나 | §5 프로토콜 실행(약한 모델, 층화 paired, machine-graded) | 층(i) CI>0 & p<0.05 **AND** 층(ii) 무회귀 |
| **3 판정** | 나 | 통과 → keep + changelog/memory 기록. 실패/tie → 되돌림 + null 결과 기록 | — |
| **4 반복** | 나 | 통과 시 다음 lever(§8 untested) 로 새 research pass; 실패 시 이 lever 종결 | 의미 있는 lift 또는 "baseline-first 유지" 확정까지 |

각 Phase는 원자적 커밋. **Phase 2가 게이트다** — 구현이 곧 승리가 아니다(role_source=paraphrase 교훈: shipped 텍스트로 재현돼야 proven).

---

## 7. 리스크 · 롤백 · 논-골

**리스크 → 완화:**
- **또 하나의 무용 절차(baseline-first 위반).** → 변경 ①은 tiered(repro 성공 시/크래시 버그는 skip), 강한 모델엔 tie. §5가 tie/회귀를 machine-graded로 잡아 되돌림.
- **fixture가 신호를 못 낼 위험(ceiling).** → fixture는 "repro authoring이 병목"인 것만; 약한 모델; 층(ii) negative-control로 무해성 분리.
- **AssertFlip refinement 루프가 토큰 폭증.** → 5-regeneration cap(논문이 비용-성능 균형점으로 제시), 무한 refine 금지.
- **가짜 red(wrong-reason) 통과.** → grader가 assertion-red만 VALID로 인정, import/setup red는 INVALID.
- **구현=승리 오인.** → Phase 2 게이트 없이 keep 금지.

**롤백:** 변경 ①은 `debugging.md` step 1 + `SKILL.md` 1줄 + 계약 테스트 1개 — 파일 단위 revert로 원복.

**논-골:**
- 도메인/기능 축의 새 절차(6후보 중 5개 기각 — 기존 머신러리 포화).
- 강한 모델·explicit-spec에 대한 baseline-first 입장 변경(측정으로 유지).
- MCP 콜그래프 등 tool-access lift를 스킬 lift로 주장(confound).
- SWT-Bench 전체 실행(무거움) — 레포식 경량 fixture로 대체.

---

## 8. 오픈 퀘스천 / 미래 lever (이번 PRD 미포함)

이번 검증은 세 축에서 단 1개만 통과시켰다. 나머지는 **headroom 미검증**이라 미포함 — 각각 자체 A/B로 headroom을 먼저 입증해야 한다.

1. **실제 proprietary-domain 레포(LEGACY)** — corpus가 반복해 "유일한 미검증 niche"로 지목. 여기서만 implicit-domain 가치가 측정 가능. (다음 우선순위 lever 후보)
2. **byte-for-byte role 파일** 이 n=6 forced-verification 승리를 재현하는가(현재 proven은 paraphrase). [`2026-07-01-roleloop-coverage-fix-claude-ab`]
3. **약한 baseline @ scale** headroom(전 내부 eval이 강한 모델). [`2026-07-01-skill-lift-measurement-research`]
4. **DeepSWE happy-dom** 실제-레포 clean paired(양쪽 완주, 사전 stop-policy). [`2026-07-03-deepswe-happy-dom-*`]
5. inventory가 지목한 미검증 capability-gap(자체 headroom 검증 필요, 지금은 미채택): 복잡 도메인용 property-based/round-trip 불변식 테스트를 default로, cross-service 기능구현 playbook(contract-first/consumer-driven), feature-flag/canary 단계 롤아웃, role-loop 내 성능-검증 단계, LEGACY Final Verify에 user-facing 문서/API 갱신, 비결정 분산버그용 fault-injection repro. — 이들은 "존재하는 갭"이나 **redundancy/headroom 검증 전엔 채택 금지**(§0.2).

---

## 9. 참고문헌

- **AssertFlip**(반전식 repro, 채택 근거): arXiv:2507.17542 · ICSE 2026 Research Track · `github.com/uw-swag/AssertFlip`
- SWT-Bench(실행-피드백 repro/패치 선택): NeurIPS 2024, proceedings.neurips.cc/paper_files/paper/2024/file/94f093b41fc2666376fb1f667fe282f3-Paper-Conference.pdf
- false-GREEN / UTBoost(SWE-bench resolved 패치의 15.7~28.4% false-pass): `docs/experiments/2026-07-01-roleloop-coverage-fix-claude-ab/FINDINGS.md`
- 내부 frontier(proven/refuted/untested): `log/changelog-2026-06-07.md`, `log/changelog-2026-06-30.md`, `docs/experiments/2026-06-07-harness-eval-*`, `2026-06-28-*`, `2026-07-01-*`, `2026-07-02-lean-skill-confirmatory-ab/PLAN.md`, `2026-07-03-deepswe-*`, `SUGGESTIONS.md`
- 리서치 원본(전체 kept/rejected·검증 verdict·web evidence): 세션 워크플로우 `wf_e0566bbe-c6c` (14 에이전트)

---

*이 문서는 계획이다. 구현은 call-agent codex(Phase 1), 검증은 §5 프로토콜(Phase 2, 게이트). 구현이 곧 승리가 아니다 — shipped 텍스트가 약한 모델·machine-graded A/B에서 재현돼야 proven. reference 편집은 terse 유지 — 근거는 여기와 changelog에.*
