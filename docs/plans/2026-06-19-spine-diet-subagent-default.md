# Plan: Spine 다이어트 + 서브에이전트 기본화

작성일 2026-06-19 · 범위 확정: "어떤 작업이든 컨텍스트를 많이 먹는다" 해소.
참고 설계: obra/superpowers (`writing-skills`, `subagent-driven-development`, `using-superpowers`).

## 1. 문제 (측정값)

| 항목 | 현재 | superpowers 기준 |
|---|---|---|
| `SKILL.md` 본문 | 1,703 단어 / 12.3KB / ~3,000 토큰 | 자주 로드 스킬 <200 단어 |
| 항상 비용 | 호출마다 11개 모드 + 5단계 루프 + 2개 오버레이 + reference map + 체크리스트 전부 인라인 | 진입점은 라우터, 모드 상세는 지연 로딩 |
| 실행 기본값 | inline 단일 드라이버 (`README.md:21`, `reference/role-loop.md:25`) | subagent-per-task 가 기본, 오케스트레이터는 lean |

근본 원인 두 가지:
1. **비대한 spine** — `SKILL.md`가 라우터가 아니라 전체 매뉴얼. 모드 무관하게 ~3K 토큰 고정 비용.
2. **inline 기본값** — 서브에이전트 격리 장치(`agents/*.md`가 무거운 reference를 자기 안에서 로드: `designer.md:10`, `qa-auditor.md:13`)는 이미 있으나 기본이 아님. inline로 돌면 conductor 한 컨텍스트에 reference가 누적.

## 2. 목표 / 수용 기준 (falsifiable)

- [ ] `wc -w SKILL.md` < 600 단어 (라우터 + 핵심 원칙 + 모드표 + reference map만). 현재 1,703 → 약 -65%, 호출당 ~1,800 토큰 절감.
- [ ] `bash tests/*.test.sh` 18개 전부 green (앵커 이전 + 테스트 retarget 후).
- [ ] 모든 모드의 동작 의미는 불변 — 상세 prose는 삭제가 아니라 reference 파일로 **이전**(대부분 이미 중복 존재).
- [ ] `reference/role-loop.md` + `SKILL.md`에서 "dispatch is optional / inline by default" → "서브에이전트 dispatch가 기본, trivial 단일 편집만 inline"으로 전환.
- [ ] README의 "single-driver by default" 문구를 기본값 변경에 맞춰 수정.

## 3. 앵커 인벤토리 (spine 축소 가능성의 핵심)

12개 contract 테스트가 `grep -Fqi`로 SKILL.md 문자열 30개를 핀. 두 부류:

### A. 라우팅 앵커 — SKILL.md에 유지 (라우터의 본질)
모드표 행 `| ARCH |` `| SPEC |`, 모드명 `HARNESS-EVAL` `LEARN-DOMAIN` `REVIEW-ONLY` `**QA-ONLY**`, reference map 항목 `reference/{arch,spec,interview,domain-context,qa-only,review-only,learn-domain,harness-eval}.md`, 게이트 포인터 `templates/qa-only-gate.sh` `templates/db-access/` `learn-grounding-gate.mjs`, 파이프라인 스테이지 `Onboard`. → **변경 없음**. 라우터가 마땅히 담아야 할 내용.

### B. 상세 앵커 — reference로 이전 + 테스트 retarget (= 실제 작업)
| 앵커 | 현 SKILL.md 위치 | 이전 대상 | 대상에 이미 존재? |
|---|---|---|---|
| `source/base branch and target/integration branch` | :64 Run isolation gate | role-loop.md | 예 (:12-13) |
| `verify both refs before mutating files` | :66 | role-loop.md | 근사(:15) → 정확 문구로 보강 |
| `create a run worktree from the source/base branch` | :66 | role-loop.md | 근사(:14) → 보강 |
| `Do not mutate the original checkout` | :67 | role-loop.md | 근사(:22 "never edit") → 보강 |
| `Commit or merge only into the verified target/integration branch` | :68 | role-loop.md | 근사(:23) → 보강 |
| `browser app verification with` qa-gate.sh `<vault> browser` | :90 Verify | role-loop.md | 근사(:52-54) → 보강 |
| `run vault's surfaced-requirements.md` | :83-84 Critic | role-loop.md | 예 (:37, 정확) |
| `capture its exact behavior first as a preserve-baseline` | :31 LEGACY 행 | role-loop.md | 근사(:28-29) → 보강 |
| `optional DB evidence` | :31 LEGACY 행 | role-loop.md | 추가 필요 |
| `observes only` | :50 Board 오버레이 | reference/observability.md | 확인 후 보강 |

작업 원칙: B 앵커는 SKILL.md에서 제거하되, **정확한 문자열을 대상 reference 파일에 존재시킨 뒤** 해당 `require_text`의 인자를 `"SKILL.md"` → 대상 파일로 교체. 대부분 SKILL.md가 role-loop.md를 중복 서술 중 → 사실상 중복 제거.

## 4. 작업 단계 (subagent에 위임 가능한 독립 단위로 분해)

1. **role-loop.md 앵커 보강** — 표 B의 근사 항목을 정확 문구로 맞추고 `optional DB evidence` 한 줄 추가. role-loop.md는 이미 worktree 게이트/critic 상세를 보유 → 문구 정합만.
2. **observability.md 앵커 확인/보강** — `observes only` 존재 확인, 없으면 추가.
3. **SKILL.md 라우터화** — 유지: 제목, Core principles(압축), 모드표(A 앵커 포함), reference map(A 앵커 포함), Board 1줄. 제거(이전됨): Run isolation gate 문단, Default loop 5단계 상세, UI/UX 오버레이 상세(→ui-ux.md가 authority), Final checklist(→role-loop.md). 5단계 루프는 "기본 루프 상세는 `reference/role-loop.md`" 한 줄로 대체.
4. **서브에이전트 기본화** — `reference/role-loop.md:25` "separate agent orchestrated, OR ... inline" → "각 역할은 신선한 컨텍스트 서브에이전트가 기본; trivial 단일 편집만 inline". `SKILL.md` 루프 도입부도 동일 취지. 독립 단계(QA 시나리오 샤드, 리뷰 차원) 병렬 명시.
5. **README 정합** — "dispatch is optional and single-driver by default" 수정.
6. **테스트 retarget** — 표 B의 10개 `require_text` 대상 파일 교체. A는 불변.
7. **검증** — `for f in tests/*.test.sh; do bash "$f"; done` 전부 green + `wc -w SKILL.md` < 600 확인.

## 5. 위험 / 롤백

- 위험: 앵커 문자열 미세 불일치로 `grep -Fqi` 실패 → 단계 7에서 즉시 적발, 단계 1-2에서 정확 문구 선반영으로 예방.
- 위험: 기본값 전환이 단일 드라이버 사용자에게 과한 오케스트레이션 → "trivial은 inline" 이스케이프 명시로 완화. 동작 의미 불변.
- 롤백: 단일 커밋 단위, `git revert` 1회로 원복. run worktree에서 작업.

## 6. 범위 외 (이번 작업 아님)

- `teach.md`(4,066단어)·`taste-skill-v2.md`(2,675단어) 분할 — 별도 후속.
- 모드별 독립 sub-skill 폴더화(superpowers 전면 구조) — 사용자가 선택 안 함.
- 신규 모드/동작 추가 없음.

## 7. 대안 (기각)

- **Spine 다이어트만**: "항상 비용"은 줄지만 무거운 작업의 inline 누적은 그대로 → 사용자 직감(subagent/parallel) 미반영. 기각.
- **전면 sub-skill 폴더화**: 참조 레포와 최정합이나 12파일+12테스트+게이트 대수술, 공개 스킬 위험 과다. 기각.
