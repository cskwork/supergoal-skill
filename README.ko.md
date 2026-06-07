# /supergoal

[English](README.md) | **한국어**

**목표 하나를 넣으면, 검증된 결과가 나옵니다 - 가장 작은 올바른 변경을, 실제 테스트로 확인.**
별도 설치 없음: 저장소를 클론해 스킬 디렉터리에 심링크한 뒤 `/supergoal <목표>`.
랜딩 페이지: **[cskwork.github.io/supergoal-skill](https://cskwork.github.io/supergoal-skill/)**.

하나의 목표를 받아, 프롬프트에 없는 요구사항을 표면화하고, 가장 작은 올바른 변경을 만들고,
프로젝트 자체의 테스트와 스펙으로 검증한 뒤 - 멈추는 Claude Code 스킬입니다.

## Baseline-first (무거운 기계장치를 들어낸 이유)

`/supergoal`은 예전엔 무거운 gated 멀티에이전트 파이프라인(validate gate, Human Feedback gate, 적대적
verifier, 다수 전문가 committee, circuit breaker, 명시적 delivery gate)을 돌렸습니다. 7번의 head-to-head
eval(`log/changelog-2026-06-07.md`, `docs/experiments/2026-06-07-harness-eval-*`)이 보여준 결과: **명시
스펙이 있는 과제에서 그 기계장치는 토큰 2~3배를 쓰고도 강한 baseline을 결코 못 이김** - 그리고 **생성된
proxy verifier는 오히려 더 나쁠 수 있음**(Goodhart: 솔버가 생성된 체크리스트에 overfit해서, 실제 스펙을
읽은 baseline보다 아래로 멈춤).

그래서 이제 스킬은 **baseline-first**입니다. plain baseline이 공짜로 못 하는 것만 더합니다: 프롬프트에
없는 요구사항 표면화, 그리고 변경을 최소로 유지하며 실제 테스트/스펙으로 검증. 각 역할 페르소나는 여전히
`agents/`의 번들 파일이라 Claude Code·Codex·agy 등에서 dispatch가 harness-비의존적입니다 - 단 dispatch는
선택이고 기본은 단일 드라이버.

## 원칙

- **Ground truth로 검증.** 프로젝트의 실제 테스트를 재실행하고, 테스트가 안 덮는 규칙은 prose 스펙을 다시
  읽음. 생성된 proxy 체크리스트/verifier에 맞춰 최적화하지 않음.
- **가장 작은 올바른 변경.** 주변 코드에 맞춤; 몇 줄 바꾸려 파일 전체를 재작성하지 않음.
- **숨은 요구사항 먼저 표면화.** 프로세스가 plain baseline을 이길 수 있는 유일한 지점.
- **진짜 모호할 때만 질문.** 코드로 답할 수 있는 건 코드를 읽어 해결.
- **하드 스톱.** 파괴적/되돌릴 수 없는 단계는 동의 필요; 실제 테스트가 통과 못 하면 보고 - 통과를 위장하지 않음.

## 모드

`/supergoal`은 목표에서 모드를 감지합니다:

| 목표 형태 | 모드 | 접근 |
|---|---|---|
| "새 앱/도구를 만든다/출시한다" | **GREENFIELD** | 기본 루프 |
| "고장/실패/크래시/왜 이러지" | **DEBUG** | 기본 루프; 실패 테스트부터 재현 |
| "기존/레거시 코드에 X 추가" | **LEGACY** | 기본 루프; 코드부터 매핑 |
| "X를 설명/가르쳐줘" (코드 없음) | **LEARN** | Intake -> Source -> Bridge -> Teach -> Check |
| "이 코드베이스를 학습/온보딩" | **LEARN-DOMAIN** | Survey -> Map -> Ground -> `.domain-agent/` 위키 |
| "QA만/검증/데이터 비교 - 코드 변경 없음" | **QA-ONLY** | 앱+읽기전용 DB 실행 -> 증거 -> `report.md` |
| "harness/에이전트 팀 설계·감사" | **HARNESS-MAKE** | 도메인 감사 -> 패턴 선택 -> 에이전트/스킬 맵 -> 확인 -> 생성 |
| "harness 효과 테스트 / 유무 비교" | **HARNESS-EVAL** | 케이스 -> baseline -> harness -> 머신 체크 -> 품질 점수 -> 비교 |
| "히스토리에서 스킬 생성 - 제품 코드 없음" | **SKILL-MINE** | 히스토리 마이닝 -> 랭크 -> 선택 -> 포터블 `SKILL.md` 생성 -> 설치 |

**기본 루프(GREENFIELD / DEBUG / LEGACY):** 1) 목표+수용 기준 한 줄; 2) 숨은 요구사항 표면화(프롬프트가
아니라 레포/데이터에 있는 규칙); 3) 가장 작은 올바른 변경, test-first(버그는 실패 테스트부터); 4) 실제
테스트로 검증 + 안 덮인 규칙은 스펙 재독; 선택적으로 code/security 리뷰; 5) green에서 멈추고 검증한 것을
커맨드 출력과 함께 보고.

```text
/supergoal 습관 추적 앱을 만들어 출시해줘
/supergoal 결제 페이지가 프로덕션에서 간헐적으로 멈춰. 고쳐줘
/supergoal 레거시 Django 모놀리스에 SSO를 추가해줘
/supergoal 이 코드베이스를 학습하고 도메인 위키를 만들어줘
/supergoal 스테이징 결제 플로우를 QA하고 주문 합계가 DB와 맞는지 확인해줘 (코드 변경 없음)
/supergoal 우리 마이그레이션 워크플로용 Codex/Claude harness를 설계해줘
/supergoal 이 마이그레이션 harness를 3개 케이스에서 유무 비교해줘
```

QA-ONLY, LEARN/LEARN-DOMAIN, HARNESS-MAKE, HARNESS-EVAL, SKILL-MINE은 별개 용도의 유틸리티로 유지됩니다
(코드 없는 QA, 교육/온보딩, harness 설계, harness 측정, 스킬 생성). 기본적으로 제품 코드를 쓰지 않고,
무언가 설치하기 전에 사용자에게 확인합니다.

## 설치

이 저장소 자체가 스킬입니다. Claude Code가 스킬을 찾는 위치에 두세요:

```bash
git clone https://github.com/cskwork/supergoal-skill.git
# 전역 스킬 디렉터리에 심링크 또는 복사:
ln -s "$(pwd)/supergoal-skill" ~/.claude/skills/supergoal
# 또는: cp -R supergoal-skill ~/.claude/skills/supergoal
```

이후 Claude Code에서: `/supergoal <목표>`.

### Windows

스킬은 Windows에서 동작합니다. 남은 gate/test 스크립트는 POSIX 셸이라 **Git Bash** 또는 **WSL**에서
실행하세요(`node`가 `PATH`에 있어야 함). 저장소는 `.gitattributes eol=lf`로 고정합니다. 심링크에 관리자
권한이 필요하면 **복사**로 설치하세요(Git Bash/WSL의 `cp -R`, 또는 관리자 `cmd`의 `mklink /D`). 컨트랙트
테스트는 **WSL** bash에서 실행하세요.

## 레이아웃

```
SKILL.md            얇은 척추: baseline-first 루프, 모드, 레퍼런스 맵
agents/             역할당 페르소나 파일 (analyst, architect, executor, debugger, explore, designer, qa-*, db-reader, code-reviewer, security-reviewer)
reference/          domain-rules · domain-context · debugging · interview · plan-grounding · market-research · qa · qa-only · db-access · learn · learn-domain · ui-ux · taste-skill-v2 · functional-ui · harness-make · harness-patterns · harness-eval · skill-mine
learn/              LEARN 모드 세션 저널 + README 템플릿 + USER_PREFERENCE(.template).md
templates/          qa-gate.sh · qa-only-gate.sh · contrast-gate.mjs · learn-grounding-gate.mjs · qa-report.md · domain-agent/ · domain-onboarding.html · harness-spec.md · harness-eval-gate.mjs · harness-eval-cases/ · skill-mine/ · skill-frontmatter-gate.mjs · skill.md.template
docs/               DESIGN.md · research-brief.md · experiments/ (harness eval들) · changelog/ · index.html (랜딩)
examples/url-shortener/   예전 gated 버전이 만들고/디버깅하고/확장한 실제 서비스 (히스토리 감사 기록)
```

## 근거 & 히스토리

- **baseline-first인 이유.** `docs/experiments/2026-06-07-harness-eval-*`와 `log/changelog-2026-06-07.md`에
  7번의 eval(3 케이스, 2 모델, 4 harness 형태)이 기록됨 - harness는 강한 baseline을 잘해야 동급, 결코 초과
  못 함, 비용 2~3배, 생성된 verifier에선 Goodhart로 패배 가능.
- **예전 gated 실행 (히스토리).** strip 이전 파이프라인은 무의존성 URL 단축기(`examples/url-shortener/`,
  감사 기록은 그 `docs/changelog/`)와 비공개 코드베이스 벤치마크
  (`docs/experiments/2026-05-30-private-codebase-comparison/`)에서 도그푸딩됨. 이들은 baseline-first
  재작성 이전이며 제거된 기계장치를 설명합니다.

## Harness Eval 레퍼런스

HARNESS-EVAL 재사용 샘플 케이스는 RevFactory의 `claude-code-harness`에서 가져옴:
https://github.com/revfactory/claude-code-harness/

## 크레딧

컨셉과 워크플로는 cskwork의 **oh-my-symphony**에서 차용
(https://github.com/cskwork/oh-my-symphony). Claude Code용으로 제작.

## 라이선스

MIT. [`LICENSE`](LICENSE) 참고.
