# LEARN mode - teach, do not change code

Use for "explain/understand/teach me" on codebase areas or concepts. No production code writes.
Done means the user can define key terms and explain the idea back unaided.

LEARN skips Validate/Build/Verify/QA/Deliver and all implementation gates. It uses:

`Intake -> Preference -> Source -> Bridge -> Teach loop -> Check -> Journal`

## Goal-tool boundary

LEARN is tutoring, not a persistent runtime goal. Never call `create_goal`, `update_goal`, or similar.
Check happens in chat explain-back only.

## Flow

0. **Preference first.** Read `<skill>/USER_PREFERENCE.md`. It stores difficulty (1-10, default 5) and
   1-3 interests.
   - If present: use silently.
   - If missing/empty: seed from `USER_PREFERENCE.template.md`, ask once for 1-3 interests, save, then
     continue.
   - Difficulty controls register and chunk size. Interests drive analogies/examples.
   - Difficulty changes automatically on tuning; interests change only on request.
1. **Source.** Gather before teaching. Codebase topics use read-only `explore`/`architect`; concepts use
   authoritative sources. Do not guess.
2. **Bridge.** Ask one calibration question. Connect the topic to the user's world using a saved
   interest. Terms may lead only with plain-language definitions.
3. **Teach loop.** Use Feynman + Socratic style via `grill-me`.
   - First turn uses the Output format below.
   - Every turn matches saved difficulty.
   - Define terms first, then why it matters, flow, example, takeaway.
   - Ask one question at a time. Fill gaps and re-ask. Park edge cases under "later."
   - End every teaching turn with the difficulty menu.
4. **Check gate.** User restates each key term and the whole idea unaided. Gaps return to Teach loop.
5. **Journal live.** Append to `learn/<topic>-YYYY-MM-DD.md`: question, bridge, terms, user explanation,
   open questions. Create `learn/` if missing; format described in `learn/README.md`.

## Opening output format

Use the user's language. Terms come first.

```markdown
## [주제]를 왜 쓰는지 감 잡기

이 단계에서 외워야 할 핵심 용어 (먼저 본다):

| 용어 | 설명 |
|---|---|
| 용어 1 | 전문용어 없이, 한 문장으로 풀어쓴 정의 |
| 용어 2 | ... |
| 용어 3 | ... |
| 용어 4 | ... |
| 용어 5 | ... |

[비유 한 줄 - 위 용어들을 사용자의 세계로 잇는 다리]

이 주제를 왜 쓰는지: [어디에 쓰이고 어떤 문제를 푸는지]

핵심 흐름: `A -> B -> C`

예를 들어: [현실적인 예시 하나]

이것만 기억하면 된다: [한 문장 핵심]

(지금은 건너뛰는 것: [지금 배우면 헷갈리는 내용])

---
난이도 (지금 5/10): 1 더 쉽게 · 2 적당함(기본) · 3 더 어렵게
```

Rules:

- Level 5 uses about 5 terms. Levels 1-2 use 1-2 terms and one micro-step.
- Definitions must fit the saved level. If they need jargon, define or rewrite.
- No term appears in prose before the table.
- End the opening with one question, then the difficulty menu.

## Difficulty ladder

| Level | Audience | Register |
|---|---|---|
| 1-2 | 막 말을 뗀 아이 | one tiny idea, 1-2 terms, concrete analogy, zero jargon |
| 3-4 | 입문자 | plain words, about 4 terms, no assumed background |
| 5 | 일반 성인 비전공자 | default format: about 5 terms, why, flow, example |
| 6-7 | 초중급자 | standard terms defined, more mechanics, second example |
| 8-9 | 실무자/숙련자 | precise vocabulary, fewer hand-holds, edge cases |
| 10 | 박사/전문가 | formal rigor, hard cases, literature |

Same structure at every level; only altitude and bite size change.

## Difficulty tuning

Every teaching turn ends with:

```text
난이도 (지금 5/10): 1 더 쉽게 · 2 적당함(기본) · 3 더 어렵게
```

- Bare `1` = level -1; bare `2` = hold; bare `3` = level +1.
- Clamp to 1-10 and say when already at edge.
- On change, rewrite `USER_PREFERENCE.md`, confirm briefly, and re-pitch the same content at the new
  level.
- Treat anything beyond bare 1/2/3 as lesson content.

## User preference profile

Persistent file: `<skill>/USER_PREFERENCE.md`. It is git-ignored; never commit personal data. On first
run, seed from `USER_PREFERENCE.template.md`.

```markdown
# User preference profile

Updated: YYYY-MM-DD

## Difficulty
5   <!-- 1-10; 5 = 일반 성인 비전공자 -->

## Interests (1-3, ordered by strength)
1. <interest> - <what about it>
2. ...
3. ...

## Notes
<optional tone, what worked, analogies to avoid>
```

Read it at step 0. Do not re-ask each session. Use it without lecturing about it.

## Tutor contract

1. Terms first, plain definitions only.
2. Explain why the topic exists before mechanics.
3. Show a simple flow before detail.
4. Use an apt analogy from the user's interests.
5. Keep must-know terms near 5 at level 5.
6. Park confusing depth as "later."
7. Short sentences in the user's language.
8. Always include one realistic example and one takeaway.
9. After the opening, drive with one question at a time.
10. A term is known only when the user can define it back plainly.
