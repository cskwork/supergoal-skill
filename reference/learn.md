# LEARN mode - teach, do not change code

Use for "explain/understand/teach me" on codebase areas or concepts. Do not write production code.
Done means the user can define key terms and explain the idea back unaided.

LEARN skips the default loop (no Build/Critic/Fixer/Verify) and all implementation gates. It uses this
lightweight flow:

`Intake -> Preference -> Core question -> Source -> Bridge -> Teach loop -> Check -> Journal`

## Goal-tool boundary

LEARN is tutoring, not a persistent runtime goal. Never call `create_goal`, `update_goal`, or similar.
Check happens in chat explain-back only.


## Decomposition

Split composite ideas into the smallest useful pieces before the Bridge or Teach loop output. A
piece is one actor, data source, field, relationship, operation, rule, condition, fallback, side
effect, or stop condition.

Mandatory visible order:

1. **Core question:** one short hook asking what problem the topic solves; do not wait for the answer.
2. **Key-terms map:** list the pieces that matter for this lesson.
3. **Plain definition:** define each piece without using later terms or bundled labels.
4. **Process trace:** connect the pieces in execution order: trigger -> read/derive -> decide -> write/call -> fallback/stop -> result.
5. **Composed explanation:** explain the full concept or code path only after the map and trace.

Glossary alone is not enough. Definitions tell what each piece is; the process trace tells what
happens, when, and why. If a term bundles multiple ideas, split it. Example: "LMS display area
mapping" becomes source code, source table, display code, relation row, textbook filter, fallback,
and final label.

## Process explanation gate

For every codebase, algorithm, or system lesson, narrate a small trace as natural prose - walk the
steps in order, each naming the atom used, what happens, the rule/condition, and the result/side
effect. Number the steps if it helps; do not use a table. At low difficulty, use fewer steps and
plainer words, but do not skip the trace. If the process has a failure path, narrate the
fallback/stop before the takeaway.

<!-- Contract anchor: | 단계 | 사용되는 용어 | 일어나는 일 | 규칙/조건 | 결과/부작용 | -->
<!-- At low difficulty, use fewer rows and plainer words; do not remove the trace. -->

## Flow

0. **Preference first.** Read `<skill>/learn/USER_PREFERENCE.md`. It stores difficulty (1-10, default 5) and
   1-3 interests.
   - If present: use silently.
   - If missing/empty: seed from `learn/USER_PREFERENCE.template.md`, ask once for 1-3 interests, save, then
     continue.
   - Difficulty controls register and chunk size. Interests drive analogies/examples.
   - Difficulty changes automatically on tuning; interests change only on request.
1. **Source.** Gather before teaching. Codebase topics use read-only `explore`/`architect`; concepts use
   authoritative sources. Do not guess.
2. **Bridge + core question.** Open with one short core question - what problem does the topic
   solve - and do not wait for the answer; the lesson answers it (a thinking hook, not a test).
   Then connect the topic to the user's world in one vivid line using a saved interest. No separate
   calibration question. Terms may lead only with plain-language definitions. For coding, algorithm, or codebase
   mechanics, add the Human-to-Code bridge:
   `human words -> tiny worked example -> explicit rules -> state/variables -> flow/code -> trace`.
   The point is not to dump code; it is to show how an intuitive human move becomes a mechanical step.
3. **Teach loop.** Use Feynman + Socratic style via `grill-me`.
   - First turn uses the Output format below.
   - Every turn matches saved difficulty.
   - Define terms first, then why it matters, flow, example, takeaway.
   - End each turn with an interview-style check (see "Interview check"): a short, difficulty-scaled
     set of questions that probe the just-taught piece from different angles, not one flat recap. The
     opening adds the core-question hook on top.
   - Explain existing code first; name bugs separately, after - never silently rewrite it.
   - Fill gaps and re-ask. Park edge cases under "later."
   - End every teaching turn with the difficulty menu.
4. **Check gate.** User restates each key term and the whole idea unaided. Gaps return to Teach loop.
5. **Journal live.** Append to `learn/<topic>-YYYY-MM-DD.md` with the question, bridge, terms, user
   explanation, and open questions. Create `learn/` if missing; follow `learn/README.md`.

## Interview check

Replace the single recap question with a short interview that makes the user actively retrieve and
apply, not just nod along. End every teaching turn - and the opening - with a small set of
questions drawn from different angles, then the difficulty menu. Keep it bite-sized: ask the fewest
questions that force real recall at the current level, never a wall.

**MUST: ask via the choice tool, not plain prose.** Deliver the interview through `AskUserQuestion`
(one tool call, one `header` per angle, 2-4 options each) - never as a bare numbered list the user
has to type answers to. Each question's options are concrete answers to pick from (one correct, the
rest plausible distractors), scaled to the current level. The difficulty menu is the final question
in the same call (`header: 난이도`, options: 더 쉽게 / 적당함 / 더 어렵게). Fall back to prose
questions only if the choice tool is unavailable.

**MUST: randomize the correct option's position.** Do not always place the right answer first. Vary
which slot holds the correct option across questions and across turns so the user reads every choice
instead of pattern-matching on position. Distractors must be real misconceptions, not obvious filler.

Draw from these angles; mix types rather than asking the same kind twice:

- **Recall:** define one key term in your own words.
- **Why:** why does this piece/step exist - what breaks without it?
- **Process:** what happens next, or in what order?
- **Apply/transfer:** a fresh one-line scenario (use a saved interest) - what happens?
- **Edge/failure:** what if it fails, or hits the boundary case?
- **Connect:** how do term X and term Y relate?

How many, by difficulty:

- **1-2:** one gentle recall question.
- **3-4:** one or two questions (recall + why).
- **5 (default):** two or three questions across different angles.
- **6-7:** three questions including one apply/transfer.
- **8-10:** three or four, including an edge/failure and a transfer question.

Stay Socratic and conversational: invite the user to answer in any order and as far as they can; do
not require every answer. Respond to whichever they take, fill the gap, and re-ask only what they
missed. This is an interview to induce learning, not an exam - never punish a miss, just re-teach
that piece.

## Opening output format

Use the user's language. The key-terms map comes first internally, but label it naturally for the user:
Korean lessons use `핵심 용어` or `구성 요소`, not literal `원자`. Each entry gets a plain definition
and a process role before the full explanation.

```markdown
## [주제]를 왜 쓰는지 감 잡기

먼저 스스로 답해볼 질문:
[{주제}가 해결하려는 핵심 문제를 묻는 한 문장 - 답은 기다리지 않는다]

먼저 핵심 용어부터 정리한다:

| 핵심 용어 | 쉬운 뜻 | 흐름에서 하는 일 |
|---|---|---|
| 용어 1 | 전문용어 없이, 한 문장으로 풀어쓴 정의 | 이 단계에서 맡는 역할 |
| 용어 2 | ... | ... |
| 용어 3 | ... | ... |
| 용어 4 | ... | ... |
| 용어 5 | ... | ... |

[비유 한 줄 - 위 용어들을 사용자의 세계로 잇는 다리]

이 주제를 왜 쓰는지: [어디에 쓰이고 어떤 문제를 푸는지 - 첫 질문에 자연스럽게 답한다]

과정 추적 (표 말고 문장으로):
① 먼저 [용어]가 [무엇을 한다] - [규칙/조건] 때문에 [결과/부작용].
② 그다음 [용어]가 [무엇을 한다] - [결과].
실패하면: [대체/중단 경로로 빠진다].
결과: [최종 결과].

합쳐서 말하면: [전체 개념/코드 경로를 한 단락으로 설명 - 첫 질문에 다시 잇는다]

예를 들어: [현실적인 예시 하나]

이것만 기억하면 된다: [한 문장 핵심]

(지금은 건너뛰는 것: [지금 배우면 헷갈리는 내용])
```

그런 다음 인터뷰 체크와 난이도 메뉴는 **본문 텍스트가 아니라 `AskUserQuestion` 한 번의 호출**로
내보낸다 (난이도에 따라 1~3개 각도 질문 + 마지막에 난이도 질문). 각 질문은 2~4개의 선택지를 주고,
정답 위치는 매번 무작위로 섞는다:
- recall: [핵심 용어 하나의 뜻을 고르게 하는 질문] - 선택지에 정답 1 + 그럴듯한 오답들
- why/process/apply: [각도를 바꾼 질문 하나 이상]
- 난이도(`header: 난이도`): 더 쉽게 / 적당함 / 더 어렵게

Rules:

- Level 5 uses about 5 pieces and 3-5 trace steps. Levels 1-2 use 1-3 pieces and one trace step.
- Definitions and trace steps must fit the saved level. If they need jargon, define or rewrite.
- Use a markdown table only for the key-terms glossary; render the process trace, the
  human-to-code mapping, and the difficulty ladder as natural prose.
- User-facing labels should be idiomatic in the user's language. In Korean, prefer `핵심 용어`,
  `구성 요소`, and `사용되는 용어`; avoid exposing the literal label `원자`.
- No term appears in prose before the glossary table.
- For coding/codebase topics, include one short "사람 생각 -> 기계 단계" bridge before any code.
- Never replace the process trace with a summary sentence when the topic is code, algorithm, system
  behavior, data flow, or a business workflow.
- An opening leads with the core question (top, not waited on) and ends with the interview check -
  a short, difficulty-scaled question set per "Interview check" - then the difficulty menu.

## Human-to-Code bridge

Use this bridge whenever the lesson needs to turn "I get it intuitively" into "I can express it in
code/system steps." It is adapted from `https://github.com/cskwork/human-to-code-translation-skill`.

Walk these bridge steps in order, as prose (not a table): **human words** - restate the
problem/concept in the user's plain language; **tiny worked example** - pick the smallest concrete
example that can be traced by hand; **explicit rules** - name the implicit rule behind each "just
do it" human move; **state/variables** - ask "what must be remembered?" and turn that into terms,
variables, objects, or data; **flow/code** - map actions to `if`, loop, function call, event,
request, state transition, or module boundary; **trace** - walk one normal case and one
boundary/failure case, fixing gaps before adding more detail.

Phrase the mapping in plain sentences when useful, e.g. "'기억해 둔다'는 변수나 상태에 저장하는
것, '하나씩 본다'는 반복문·iterator·query cursor·event stream으로 순회하는 것" - sentences, not a
table.

At levels 1-4, use only one or two steps. At level 5, use three to five steps. At levels 6-10, add
precise names and edge cases, but keep the same bridge order.

## Difficulty ladder

Same structure at every level; only altitude and bite size change. By level:

- **1-2 (막 말을 뗀 아이):** one tiny idea, 1-2 terms, concrete analogy, zero jargon.
- **3-4 (입문자):** plain words, about 4 terms, no assumed background.
- **5 (일반 성인 비전공자):** default format - about 5 terms, why, flow, example.
- **6-7 (초중급자):** standard terms defined, more mechanics, second example.
- **8-9 (실무자/숙련자):** precise vocabulary, fewer hand-holds, edge cases.
- **10 (박사/전문가):** formal rigor, hard cases, literature.

## Difficulty tuning

Every teaching turn ends with:

```text
난이도 (지금 5/10): 1 더 쉽게 · 2 적당함(기본) · 3 더 어렵게
```

- Bare `1` = level -1; bare `2` = hold; bare `3` = level +1.
- Clamp to 1-10 and say when already at edge.
- On change, rewrite `learn/USER_PREFERENCE.md`, confirm briefly, and re-pitch the same content at the new
  level.
- Treat anything beyond bare 1/2/3 as lesson content.

## User preference profile

Persistent file: `<skill>/learn/USER_PREFERENCE.md`. It is git-ignored; never commit personal data. On first
run, seed from `learn/USER_PREFERENCE.template.md`.

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

Read it at step 0. Do not re-ask each session. Use the profile without lecturing about it.

## Tutor contract

1. Break composite ideas into the smallest useful pieces before explaining the full flow.
2. Show the key-terms map first, with plain definitions and each piece's role.
3. Explain why the topic exists before deep mechanics.
4. Include a process trace before the composed explanation.
5. Show trigger, decision point, side effect, and stop/fallback when they exist.
6. Use an apt analogy from the user's interests.
7. Keep must-know atoms near 5 at level 5.
8. Park confusing depth as "later."
9. Short sentences in the user's language.
10. Always include one realistic example and one takeaway.
11. Drive every turn, opening included, with an interview-style check - a short, difficulty-scaled
    set of questions across different angles - then respond to whichever ones the user answers.
12. An atom is known only when the user can define its role and place in the process plainly.
13. For coding/codebase lessons, never jump straight from concept to code; translate the human move
    into explicit state and flow first.
