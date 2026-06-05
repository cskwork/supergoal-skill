# /supergoal

[English](README.md) | **한국어**

**목표 하나를 넣으면, 검증된 결과가 나옵니다.**
목표를 주면 전문가 서브에이전트로 전체 게이트 파이프라인을 실행하고, 기계로 검증 가능한 게이트가 통과할 때까지 성공을 선언하지 않습니다.
추가 설치 없음: 레포를 clone하고 스킬 디렉터리에 symlink한 뒤 `/supergoal <목표>`.
가장 좋은 출발점: **[랜딩 페이지](https://cskwork.github.io/supergoal-skill/)** (영어 / 한국어 이중 언어, 3단계 빠른 시작).

단일 목표를 전문가 서브에이전트를 통해 완전한 게이트 개발 프로세스로 끌고 간 뒤, 기계로 검증
가능한 게이트가 통과할 때까지 성공을 선언하지 않는 Claude Code 스킬입니다.

게이트로 나뉜 레인, 하나의 공유 vault, 적대자가 재검증하는 신뢰 불가 `claims.md`, 그리고 통과를 위해
절대 수정하지 않는 literal-bash 전달 게이트. 각 역할의 페르소나는 `agents/`에 번들된 파일이라
디스패치는 **하니스 무관(harness-agnostic)** 입니다 — Claude Code, Codex, agy 등 어떤 코딩 CLI에서도
동일하게 동작합니다(오케스트레이터가 하니스의 서브에이전트 메커니즘으로 페르소나를 생성하거나, 없으면
인라인 실행). **설치할 것은 스킬 자체뿐입니다.** (워크플로는
[oh-my-symphony](https://github.com/cskwork/oh-my-symphony)에서 영감을 받았습니다.)

> **처음이신가요? 랜딩 페이지부터** -> **[cskwork.github.io/supergoal-skill](https://cskwork.github.io/supergoal-skill/)**
> 영어/한국어 이중 언어 가이드: 3단계 빠른 시작, 모드들, builder-vs-verifier 분리가 실제 버그를 잡는
> 방식, 그리고 산출하는 증거. clone 전 가장 좋은 온보딩 경로입니다.

## 모드

`/supergoal`은 목표에서 모드를 자동 감지합니다:

| 목표가 이렇게 보이면 | 모드 | 파이프라인 |
|---|---|---|
| "새 앱/도구를 만들고 / 출시" | **GREENFIELD** | Intake -> **Validate (market/demand)** -> Plan -> **Human Feedback** -> Build -> Verify -> QA -> Deliver |
| "수정 / 고장 / 실패 / 왜 안 되지" | **DEBUG** | Intake -> Reproduce -> Diagnose -> **Human Feedback** -> Fix -> Verify -> Deliver |
| "기존/레거시 코드에 X 추가" | **LEGACY** | Intake -> Explore -> Plan -> **Human Feedback** -> Build -> Verify -> QA -> Deliver |
| "X를 설명/이해/가르쳐줘" (학습, 코드 없음) | **LEARN** | Intake -> Source -> Bridge -> Teach loop -> Check (explain-back) -> Journal |
| "이 코드베이스 학습/파악/온보딩" (에이전트용 도메인 위키 구축) | **LEARN-DOMAIN** | Intake -> Survey -> Scope checkpoint -> Map -> Deepen -> **Ground** -> Persist -> **Onboard (human handbook)** -> Freshness |
| "QA만 / 검증 / 데이터 비교 — 코드 변경 없음" | **QA-ONLY** | Intake -> Target & Access -> Scenario checkpoint -> Exercise -> Cross-check -> **Report** -> Persist |
| "스킬 만들기 / 새 스킬 학습 / 히스토리로 스킬 — 제품 코드 없음" | **SKILL-MINE** | Intake -> Window -> Mine -> Rank -> Suggest -> **Human pick/reject** -> Forge -> Verify -> Install -> Journal |

QA-ONLY는 이미 실행 중인 앱(과 읽기 전용·DB 독립 데이터베이스)을 구동해 동작을 QA하거나 데이터를
비교합니다 — 코드를 쓰지 않고, worktree를 만들지 않으며, 구현 게이트를 실행하지 않습니다. 사람이 읽기
좋은 `report.md`(된 것 / 안 된 것 / 발견한 것)를 만들고, 같은 점검을 빠르게 재실행할 수 있도록
재사용 가능한 인덱스된 QA 스위트를 `.domain-agent/qa/`에 영속화합니다. 브라우저 구동은 기본 `agent-browser`,
인증 세션은 attach-to-browser(Playwright CLI)를 사용하며, 앱 구동과 DB 읽기는 분리된 읽기 전용
서브에이전트에서 돌아 원시 행(raw rows)이 브라우저 컨텍스트에 섞이지 않습니다.

LEARN-DOMAIN은 코드베이스를 *에이전트를 위해* 학습하고, 출처 기반·실행 검증된 `.domain-agent/` 위키를
영속화해 이후 실행이 빠르게 라우팅되게 합니다. 마지막 **Onboard** 단계는 *사람을 위한* 자체 완결형
`onboarding.html` 핸드북(도메인이 무엇인지, 핵심 용어, 아키텍처, 흐름, 깨지면 안 되는 규칙)도 렌더링합니다
— 마크다운 팩은 에이전트의 진실 소스로 남습니다.

SKILL-MINE은 반복 작업을 재사용 가능한 스킬로 바꿉니다. 최근 에이전트 세션 히스토리
(`~/.claude/projects/*.jsonl`, 적응형 7-30일 윈도)를 채굴해, 빈도 × 효용으로 랭킹한 3-5개 후보 스킬을
제시하고, 선택 / 거절 / 새로 명명을 맡깁니다. 선택하면 크로스 에이전트 이식 가능한 `SKILL.md`
(agentskills.io 표준) 하나를 forge해 선택한 각 에이전트(`~/.claude/skills`, `~/.codex/skills`,
`~/.config/opencode/skills`, `~/.hermes/skills`)에 설치합니다. 사람의 선택이 하드 게이트입니다 —
승인하지 않은 스킬은 절대 생성·설치하지 않습니다. 제품 코드도, worktree도 만들지 않습니다.

```text
/supergoal 습관 추적 앱을 만들어서 출시해줘
/supergoal 결제 페이지가 프로덕션에서 간헐적으로 멈춰. 고쳐줘
/supergoal 우리 레거시 Django 모놀리스에 SSO 추가해줘
/supergoal 이 코드베이스를 학습해서 도메인 위키를 만들어줘
/supergoal 스테이징에서 결제 플로우 QA하고 주문 합계가 DB와 일치하는지 확인해줘 (코드 변경 없음)
```

## 왜 존재하는가

큰 목표를 받은 단일 에이전트는 표류합니다: 검증을 건너뛰고, 자기 "완료"를 믿으며, 검증되지 않은 주장을
남깁니다. `/supergoal`은 시니어 팀이 강제할 규율을 강제합니다 (자세히는 [`docs/DESIGN.md`](docs/DESIGN.md)와
[`docs/research-brief.md`](docs/research-brief.md) 참고):

- **선호가 아니라 토폴로지가 아키텍처를 정합니다.** 넓고 얕은 작업(검증, 스캐폴딩)은 펼치고(fan out),
  깊고 좁은 작업(버그 하나, 기능 하나)은 단일 드라이버로.
- **브랜치 범위 worktree 격리.** 코딩/디버그 실행은 base 브랜치와 target 브랜치를 묻고, 전용
  `git worktree`에서 작업한 뒤, 승인된 결과를 target 브랜치로 merge하고, 가장 최근 완료된 실행 worktree
  세 개를 유지해 병렬 에이전트가 같은 체크아웃을 편집하지 않게 합니다. 오래된 repo 관리 완료 worktree는
  유지 개수가 셋을 넘을 때만 정리됩니다.
- **Builder != Verifier.** 코드를 쓴 에이전트는 그것을 승인하지 않습니다. 신선한 적대적 Verify
  에이전트가 모든 `run-to-prove`를 깨끗한 상태에서 다시 실행합니다. (`claims.md`는 신뢰하지 않습니다.)
- **구현 전 Human Feedback.** intake/재현/진단/계획 후, 스킬은 두 개의 브리프와 함께 멈춥니다: 먼저
  평이한 언어, 그다음 용어 정의를 포함한 초급 개발자 친화 기술 브리프.
- **2층 완료 게이트.** 하드 게이트(테스트/lint/build, 결정론적) + 소프트 위원회(architect + security +
  code-review). 루브릭은 실패한 테스트를 절대 뒤집을 수 없습니다.
- **프로젝트 자체 스위트로 게이트.** (워크스페이스에서 실행하고, Verify 에이전트가 깨끗한 상태에서 독립적으로
  재실행). 벤치마크도, 자기 보고도 아닙니다.
- **제한된 재시도 + 서킷 브레이커.** 같은 오류 3회면 서킷 브레이커가 작동: 중단, 근본 원인 규명, 에스컬레이션.
  무한 루프 없음.

## 타협 불가 게이트

1. 구현 전 검증(GREENFIELD).  2. 계획이 범위를 동결.  3. Human Feedback 승인.
4. Builder != Verifier.  5. 전달 전 다중 전문가 리뷰.
6. literal 전달 게이트(`templates/delivery-gate.sh`가 0으로 종료).  7. 제한된 재시도 + 서킷 브레이커.

## 설치

이 레포가 곧 스킬입니다. Claude Code가 스킬을 찾는 곳에 두세요:

```bash
git clone https://github.com/cskwork/supergoal-skill.git
# 그다음 글로벌 스킬 디렉터리에 symlink 또는 copy:
ln -s "$(pwd)/supergoal-skill" ~/.claude/skills/supergoal
# 또는: cp -R supergoal-skill ~/.claude/skills/supergoal
```

그다음 Claude Code에서: `/supergoal <목표>`.

### Windows

스킬은 Windows에서 동작합니다. 게이트와 테스트 스크립트는 POSIX 셸이라 **Git Bash** 또는 **WSL**에서
실행하세요(둘 다 bash 포함, `node`는 `PATH`에 있어야 함). 레포는 `.gitattributes eol=lf`를 고정하므로
Windows 체크아웃에서도 스크립트가 LF로 유지되어 bash가 깔끔하게 파싱합니다. 두 가지 참고:

- symlink에 관리자 권한이 필요하면 **copy**로 설치: `cp -R supergoal-skill "$HOME/.claude/skills/supergoal"`
  (Git Bash/WSL) 또는 권한 상승된 `cmd`에서 `mklink /D`.
- 계약 테스트는 **WSL** bash에서 실행하세요. Git Bash 번들 `grep`은 파이프 입력에서 중단될 수 있어
  스위트가 오보고할 수 있습니다. WSL은 이를 피합니다.

## 구조

```
SKILL.md            얇은 척추: 모드 감지, 게이트, 레퍼런스 맵
agents/             역할당 페르소나 파일 하나씩(시스템 프롬프트), 하니스 무관 디스패치의 진실 소스
reference/          pipeline · experts · vault · market-research · quality-gates · debugging · qa · qa-only · db-access · domain-rules · plan-grounding · interview · learn · learn-domain · skill-mine
reference/ui-ux.md  UI/UX 오버레이 -> Expressive(taste-skill-v2, vendored) 또는 Functional(functional-ui) 티어로 라우팅
learn/              LEARN 모드 세션 저널(세션당 한 파일) + README 템플릿 + USER_PREFERENCE(.template).md
templates/          delivery-gate.sh · validate-gate.sh · qa-gate.sh · qa-only-gate.sh · human-feedback-gate.mjs · skill-mine/ · skill-frontmatter-gate.mjs · qa-report.md · state.json
docs/               DESIGN.md(연구 -> 결정 매핑, 인용) · research-brief.md · e2e-test-plan.md · changelog/ · index.html(랜딩)
examples/url-shortener/   하니스가 만들고/디버그하고/확장한 실제 서비스 (감사 추적은 docs/changelog/)
```

## 실제로 동작한다는 증거 (라이브 검증)

세 모드 모두 실제 프로덕션급 서비스(의존성 없는 URL 단축기, [`examples/url-shortener/`](examples/url-shortener/),
68개 테스트)에서 끝-끝 실행했습니다. 각 실행의 감사 추적은
[`examples/url-shortener/docs/changelog/`](examples/url-shortener/docs/changelog/)에 있습니다(이 초기 실행
기록은 파일셋 통합 이전 것).

- **GREENFIELD.** 적대적 Verify가 빌더의 자체 green 테스트를 모두 통과한 **실제 SSRF 우회 2건**
  (`[::ffff:127.0.0.1]`, `localhost.`)과 unauth-500을 출시 전에 잡았습니다.
- **DEBUG.** 증상("부하 시 hit 과소 집계")만 주어졌는데 재현하고(200 동시 -> 1/200), **lost-update 경쟁
  상태**를 근본 원인으로 규명하고, Human Feedback에서 승인을 위해 멈추고, 수정한 뒤 anti-flake 동시성
  실행으로 재검증했습니다(10회 시도에서 0 손실).
- **LEGACY.** **회귀 0**으로 링크 만료(TTL)를 추가했고(해당 필드 이전 레코드와 하위 호환), 위원회 승인,
  게이트 green.

적대적 검증이 세 번 중 두 번 실제 결함을 잡았습니다.

**QA-ONLY**는 라이브 Cloudflare 보호 사이트를 상대로 별도 dogfooding했습니다. 이 모드는 `agent-browser`를
시도하다 봇 챌린지에 막혀 정직한 **BLOCKED** 판정(가짜 통과 없음)을 as-is/to-be 증거와 함께 기록하고,
remediation으로 **attach-to-browser**를 권고했으며, 터미널 게이트(`qa-only-gate.sh`)가 그 정직한 증거 위에서
통과했습니다 — 같은 no-fake-pass 규율을 코드 없는 실행에 적용한 것입니다.

별도의 증거 전용 비공개 코드베이스 벤치마크에서 plain Codex CLI, `/supergoal`, Codex Goal 모드를 같은
어려운 백엔드 과제·같은 숨은 채점기로 비교했습니다.
[`docs/experiments/2026-05-30-private-codebase-comparison/`](docs/experiments/2026-05-30-private-codebase-comparison/) 참고.

- **`/supergoal`:** 모든 숨은 체크, 집중 회귀, 이웃 체크, `git diff --check`, 전달 게이트를 통과.
- **Codex Goal 모드:** 메인 코드 경로는 고치고 집중 체크는 통과했으나, 숨은 fallback/보존 커버리지 체크
  하나를 놓침.
- **Plain Codex CLI:** 쓸 만한 결과 없음: idle 실행, 솔루션 diff 없음, 최종 출력 없음.

## 크레딧

개념과 워크플로는 cskwork의 **oh-my-symphony**(https://github.com/cskwork/oh-my-symphony)에서 각색했습니다.
Claude Code용으로 제작.

## 라이선스

MIT. [`LICENSE`](LICENSE) 참고.
