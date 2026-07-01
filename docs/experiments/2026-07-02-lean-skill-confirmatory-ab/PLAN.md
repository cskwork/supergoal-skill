# 다음 A/B 진행 계획 — lean 스킬 확인 + 비평가 존폐 결정

상태: **계획서 (미실행)**. 근거 실험: `docs/experiments/2026-07-01-roleloop-coverage-fix-claude-ab/`
(용어·해석은 `docs/harness-eval-explained.md`). 방법론: `reference/harness-eval.md`.

---

## 1. 왜 이 A/B가 필요한가 (2026-07-01에서 미결로 남은 것)

1. **byte 충실도 미확정** — lean-out(commit `2c743d3`)은 실제 스킬 파일이 아니라 그 내용을 **베낀
   프롬프트**로 측정했다. 새 게이트 규칙(`role_source=shipped_files`, n>=6)을 통과하는 **정식 proven**은
   아직 없다.
2. **비평가 존폐 미결** — "독립 비평가(역할 분담)를 완전 제거할지, opt-in으로 유지할지"는 **진짜
   under-specified 케이스**에서만 판가름난다. 2026-07-01은 그 영역(genuinely 애매한 스펙)을 재보지 않았다.

## 2. 목표 (검증할 두 질문)

- **Q1 (무회귀 + 저비용)**: 실제 lean 스킬 파일로 돌린 **forced-verify 기본 루프**가 이전 role-loop 대비
  hidden 통과율·false-GREEN에서 **무회귀**이고 **비용이 ≤** 인가? → 맞으면 lean-out을 정식 proven으로 확정.
- **Q2 (비평가 가치)**: **진짜 under-specified 케이스**에서 `forced-verify + 독립 비평가`가
  `forced-verify only`를 **유의하게** 이기는가? → 못 이기면 비평가 완전 제거 검토, 이기면 opt-in 유지 확정.

## 3. 설계

- **런타임**: `claude -p`, 재사용 러너 `templates/harness-eval-runner.mjs` 사용
  (preflight + fallback + **serial 기본** + retry). codex는 이 호스트에서 크래시하므로 preflight가 걸러냄.
- **role_source = `shipped_files`** — 패러프레이즈 금지. arm이 실제 `SKILL.md` / `reference/role-loop.md` /
  `agents/*.md`를 읽고 그 절차를 따르게 한다(게이트 role-fidelity 요건 충족).
- **n >= 6 seed/arm** — sign-flip permutation 최소 p=2/2ⁿ 이므로 n<6은 proven 불가.
- **모델**: sonnet 고정(전 arm 동일).
- **케이스 (최소 2개, 단일-케이스 함정 회피)**:
  - **Case A — 무회귀 확인용**: 기존 검증 코퍼스의 hard 케이스(예: `revfactory-case-002-async-race`) 또는
    u1 재사용. explicit-spec 성격.
  - **Case B — 비평가 판별용**: **새 authored under-specified fixture**(스펙이 정말 얇고, 혼자 재독으론
    떠올리기 어려운 latent 요구가 숨은 것). 실행 전 **3-way 판별 검증** 필수(아래 5단계).
- **arms**:
  | arm | 내용 | 답할 질문 |
  |---|---|---|
  | `baseline` | one-shot, 무스킬 | 하한 기준 |
  | `lean` | 실제 lean 스킬 구동(강제검증 필수, 비평가 off) | Q1, Q2 |
  | `roleloop_optin` | 실제 스킬 구동 + 독립 비평가 escalation on | Q2 |
  | `current_head`(선택) | lean 이전 role-loop(`git show <2c743d3^>`) | Q1 무회귀 대조 |
- **채점**: hidden 통과율(정답 테스트) + **false-GREEN** + 비용 + **per-seed 벡터**. 크래시=기록된 손실.
- **통계**: `stats.mjs` — BCa 95% CI + sign-flip permutation, 결합 규칙(**CI 전부 >0 AND p<0.05**).
- **게이트**: `templates/harness-eval-gate.mjs`로 result.json 검증. proven 주장 시 preflight/n>=6/
  role_source/크래시 회계 자동 강제.

## 4. 판정 규칙 (결정 트리)

- **Q1**: `lean` ≥ `current_head`(hidden·false-GREEN 무회귀) **AND** `lean` 비용 ≤ `current_head`
  → lean-out **정식 채택(proven)**. 회귀면 → lean-out **되돌림** + 원인 분석.
- **Q2 (Case B)**: `roleloop_optin` − `lean` 이 유의 승리(CI>0 AND p<0.05)
  → 비평가 **opt-in 유지가 옳음**(현 상태 확정).
  유의하지 않으면 → 비평가 **완전 제거** 검토(2개 이상 under-specified 케이스에서 재확인 후).

## 5. 절차 (단계)

1. **Case B fixture 작성** + no-codex **3-way 판별 검증**: starter(stub)는 전부 실패, 정답 impl은
   visible+hidden 전부 통과, 게으른 impl은 판별 hidden에서 실패 — 셋 다 성립해야 유효(안 되면 재작성).
2. 러너로 `arms × n=6`를 **case A, B 각각** 직렬 실행(크래시 시 retry, 손실 기록).
3. `merge.mjs` → `stats.mjs`로 per-seed 델타 + BCa CI + permutation p.
4. `role_source=shipped_files`·n>=6·preflight 기록을 담은 **게이트 통과 result.json** 생성 →
   `node templates/harness-eval-gate.mjs <result>` 로 accept 확인.
5. FINDINGS 갱신 + 판정 커밋: (lean 확정 or 되돌림) / (비평가 유지 or 제거 후보).

## 6. 비용·시간 (개략)

- 대략 arms(3~4) × cases(2) × n=6 × 4-pass ≈ **144~192 passes**. 직렬 ~$0.5–0.9/pass →
  **약 $100–170**, 벽시계 **수 시간**(직렬). 병렬화하면 단축되나 **동시성 상한**(rate-limit 크래시) 주의 —
  러너 기본 serial 유지 권장, 필요 시 concurrency 2까지만.

## 7. 리스크·통제

- **Case B가 판별 실패**(arm들이 다 통과 = ceiling) → 무효. 5단계 3-way 검증으로 **먼저** 차단.
- **동시성 크래시** → 러너 serial 기본 + retry + 크래시=기록된 손실.
- **단일 케이스 과잉일반화** → 최소 2 케이스, 가능하면 hard/expert 코퍼스에서 더 추가.
- **패러프레이즈 재발** → arm이 실제 스킬 파일을 구동하는지(role_source) 게이트로 강제.

## 8. 산출물

- `result-*.json`(arm별) + 병합 `result.json`(게이트 통과) + `stats` 출력.
- `FINDINGS.md`(이 폴더) — 판정과 근거.
- 결정 반영 커밋(lean 확정/되돌림, 비평가 유지/제거).
