# TEACH mode - teach a human, do not change code

Use for "explain/understand/teach me" on codebase areas or concepts. Do not write production code.
Done means the user can define key terms and explain the idea back unaided - and the lesson, mission,
and records persist in a workspace they return to across sessions.

TEACH runs as a **stateful, multi-session teaching workspace**: it fuses supergoal's decomposition +
process-trace pedagogy with the workspace model from mattpocock/skills `teach` (Knowledge / Skills /
Wisdom, missions, beautiful HTML lessons, learning records). It skips the default loop (no
Build/Verify) and all implementation gates. Flow:

`Preference -> Mission -> Resources -> ZPD -> Core question -> Bridge -> Teach loop (lesson) -> Check -> Records -> Journal`

Sections (jump, don't rescan): Goal-tool boundary | Teaching workspace | Philosophy (K/S/W) |
The mission | Resources | Zone of proximal development | Decomposition | Textbook depth | Process
explanation gate | Flow | Interview check | Lessons | Diagrams | Reference documents & glossary | Wisdom &
communities | Assets | Opening output format | Human-to-Code bridge | Prerequisite scaffolding |
Difficulty ladder | Difficulty tuning | User preference profile | Tutor contract.

## Goal-tool boundary

TEACH is tutoring, not a persistent runtime goal. Never call `create_goal`, `update_goal`, or similar.
"Stateful" here means **files**, not the goal tool: learning state lives in the teaching workspace
below, and the Check still happens in chat explain-back. The workspace persists across sessions; the
runtime goal machinery stays untouched.

## Teaching workspace

Treat `<skill>/teach/<topic>/` as the workspace for one topic (kebab-case `<topic>`). One mission per
workspace - a second unrelated topic is a second workspace. The global profile
`<skill>/teach/USER_PREFERENCE.md` is shared across topics. State lives in these files, created lazily
(only when first written):

| Path | What | Format |
|---|---|---|
| `teach/<topic>/MISSION.md` | The *reason* the user is learning this; grounds every teaching decision | `teach/MISSION-FORMAT.md` |
| `teach/<topic>/RESOURCES.md` | Curated high-trust sources (Knowledge) + communities (Wisdom) | `teach/RESOURCES-FORMAT.md` |
| `teach/<topic>/GLOSSARY.md` | Canonical terminology; every lesson adheres to it | `teach/GLOSSARY-FORMAT.md` |
| `teach/<topic>/learning-records/NNNN-slug.md` | ADR-style records of genuine learning; set the next ZPD | `teach/LEARNING-RECORD-FORMAT.md` |
| `teach/<topic>/lessons/NNNN-slug.html` | Primary teaching unit: one self-contained beautiful HTML lesson | **Lessons** below |
| `teach/<topic>/diagrams/NNNN-slug.{json,html}` | Editable Archify source + validated interactive diagram for a lesson | **Diagrams** below |
| `teach/<topic>/reference/*.html` | Compressed cheat-sheets revisited later | **Reference documents** below |
| `teach/<topic>/assets/*` | Reusable components shared across lessons | **Assets** below |
| `teach/<topic>/NOTES.md` | Scratchpad for teaching preferences and working notes | free-form |
| `teach/<topic>/<topic>-YYYY-MM-DD.md` | Live chat journal per session | `teach/README.md` |

Per-topic files hold personal learning data and are git-ignored; only the `*-FORMAT.md` guides and
`teach/README.md` are committed. Never commit a user's mission, records, lessons, or journal.

## Philosophy: Knowledge / Skills / Wisdom

- **Knowledge** is captured from high-quality, high-trust resources, never from parametric guessing.
  **Skills** are acquired through interactive lessons designed from that knowledge. **Wisdom** is
  earned by testing skills against real practitioners (a community). Weight the workspace by the
  topic's lean (theory vs craft).
- **Fluency vs storage strength.** Design for long-term retention, not in-the-moment fluency, via
  *desirable difficulty*: retrieval practice (the interview check), spacing over sessions (learning
  records say what to space), interleaving (skills only, never first-time knowledge). Difficulty is
  the enemy while acquiring knowledge and the tool while making skills durable - tune the difficulty
  ladder accordingly.

## The mission

Every lesson ties back to the mission - the real-world reason the user is learning this. If
`MISSION.md` is empty or vague, interview the user on *why* before teaching anything. Missions drift
as the user grows - update `MISSION.md` and add a learning record when they do, after confirming with
the user. Format: `teach/MISSION-FORMAT.md`.

## Resources (never trust parametric knowledge)

Before teaching a concept, gather it from trusted sources and record them in `RESOURCES.md`
(`teach/RESOURCES-FORMAT.md`). Prefer primary sources, recognized experts, peer-reviewed work.
Codebase topics are "sourced" by reading the code read-only (`explore`/`architect`), not by guessing.
Lessons cite their sources inline - citations are what make a lesson trustworthy. Each lesson
recommends one primary source (the single highest-trust resource) for the user to read or watch.

## Zone of proximal development

Each lesson should challenge the user *just enough*. If the user names an exact thing to learn, teach
that. Otherwise compute the ZPD from `learning-records/` (what they already know) + `MISSION.md` (what
they need next), and teach the most mission-relevant thing that just fits. A lesson should be short and
completable fast - working memory is small - yet give one tangible win to build on.

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

Glossary alone is not enough: definitions tell what each piece is; the process trace tells what
happens, when, and why. If a term bundles multiple ideas, split it ("LMS display area mapping"
becomes source code, source table, display code, relation row, textbook filter, fallback, final label).

## Textbook depth, not abstraction

Decomposition splits a topic into small pieces; this rule governs how *deeply* each piece is taught.
Teach like a textbook or a guided manual, not like a summary: the user must be able to rebuild the
idea from its parts, not just recite a tidy label.

- **A key-terms map is an index, not the teaching.** After the map, develop each concept that matters:
  plain definition, *why* it exists (what breaks without it), *how* it works step by step, one concrete
  worked example the user can follow by hand, and the common misconception or trap. A page that states
  a concept in one line and moves on has not taught it.
- **Do not compress several concepts into one abstract label.** If a term bundles ideas, split it
  (Decomposition) and develop each part.
- **Narrow the scope, not the depth.** "Short" means few concepts per lesson (working memory is
  small), never thin explanations. When a topic is large, cut the scope into more lessons.
- **Build bottom-up, like a chapter.** Concrete example first, then the rule, then the abstraction's
  name - the abstraction is the reward for understanding the parts, not a substitute.
- **Prefer a real worked scenario to an analogy.** The most dependable "concrete" is one *real* case
  traced end-to-end with values pulled from the code, data, or sources - never placeholders you made
  up ("never trust parametric knowledge" applies to examples too). An analogy may *open* a page; when
  the user pushes back on an analogy ("그 비유는 별로야"), replace it with a real traced scenario, not
  another metaphor.

This does not loosen the process trace or the working-memory limit: keep the trace, keep the lesson
scoped small, but make each scoped concept's explanation as full as a textbook section.

## Process explanation gate

For every codebase, algorithm, or system lesson, narrate a small trace as natural prose - walk the
steps in order, each naming the atom used, what happens, the rule/condition, and the result/side
effect. Number the steps if it helps; do not use a table. At low difficulty, use fewer steps and
plainer words, but do not skip the trace. If the process has a failure path, narrate the
fallback/stop before the takeaway.

Anchor the trace in one concrete, *real* input (sourced values, not invented) and show how that single
input changes at each step - "for this case: ...". A trace that follows one real worked example end to
end beats an abstract step list, and beats an analogy, for the load-bearing explanation. End by showing
the final output for that input (the actual result the user would see), so the case closes where it began.

<!-- Contract anchor: | 단계 | 사용되는 용어 | 일어나는 일 | 규칙/조건 | 결과/부작용 | -->
<!-- At low difficulty, use fewer rows and plainer words; do not remove the trace. -->

## Flow

0. **Preference first.** Read `<skill>/teach/USER_PREFERENCE.md`: difficulty (1-10, default 5) and
   1-3 interests. If present, use silently. If missing/empty, seed from
   `teach/USER_PREFERENCE.template.md`, ask once for 1-3 interests, save, continue. Difficulty
   controls register and chunk size; interests drive analogies/examples. Difficulty changes
   automatically on tuning; interests change only on request.
1. **Mission + Source.** Ground first. If `MISSION.md` is empty, interview the user on *why* they
   want this before teaching anything, then write it (**The mission**). Source per **Resources** -
   never trust parametric knowledge; cite sources and record them. Then pick the lesson in the
   user's zone of proximal development.
2. **Bridge + core question.** Open with one short core question - what problem does the topic
   solve - and do not wait for the answer (a thinking hook, not a test). Then connect the topic to
   the user's world in one vivid line using a saved interest; no separate calibration question. For
   coding, algorithm, or codebase mechanics, add the **Human-to-Code bridge** (below).
3. **Teach loop.** Feynman + Socratic style via `grill-me`. First turn uses the Opening output
   format below; every turn matches saved difficulty. Define terms first, then why it matters, flow,
   example, takeaway. Explain existing code first; name bugs separately, after - never silently
   rewrite it. Fill gaps and re-ask; park edge cases under "later." End every teaching turn with the
   interview check (see **Interview check**) and the difficulty menu.
4. **Check gate.** User restates each key term and the whole idea unaided; an atom is known only when
   the user can define its role and place in the process plainly. Gaps return to Teach loop.
5. **Records + journal.** When the user demonstrates genuine, non-trivial understanding (not mere
   coverage), write a learning record `teach/<topic>/learning-records/NNNN-slug.md`
   (`teach/LEARNING-RECORD-FORMAT.md`) - the records, not a flat journal, set the next ZPD and
   survive sessions. Promote settled terms into `GLOSSARY.md`. Append the live chat journal to
   `teach/<topic>/<topic>-YYYY-MM-DD.md` (question, bridge, terms, user explanation, open questions);
   create the workspace if missing per `teach/README.md`. For relationship-heavy material, render the
   default Archify diagram first (see **Diagrams**), then write the interactive HTML lesson, run
   `node templates/teach-lesson-gate.mjs` on it, and open it once the gate passes; only an explicit
   throwaway explain-back skips it.

## Interview check

End every teaching turn - and the opening - with a short interview that makes the user actively
retrieve and apply, not just nod along: the fewest questions that force real recall at the current
level, drawn from different angles (never one flat recap), then the difficulty menu.

**MUST: ask via the choice tool, not plain prose.** Deliver the interview through `AskUserQuestion`
(one tool call, one `header` per angle, 2-4 options each) - never as a bare numbered list the user
has to type answers to. Options are concrete answers (one correct, the rest plausible distractors)
scaled to the current level. The difficulty menu is the final question in the same call
(`header: 난이도`, options: 더 쉽게 / 적당함 / 더 어렵게). Fall back to prose questions only if the
choice tool is unavailable.

**Exception - bite-sized mode.** During **Prerequisite scaffolding** turns, and at saved difficulty
1-2, ask **one single inline prose question** instead of the choice tool, and skip the difficulty
menu inside that turn ("미니 퀴즈 - 한 개만"). Resume the choice-tool interview when the main lesson
resumes.

**MUST: randomize the correct option's position.** Do not always place the right answer first; vary
which slot holds the correct option across questions and turns so the user reads every choice instead
of pattern-matching on position. Distractors must be real misconceptions, not obvious filler.

Angles - mix types rather than asking the same kind twice:

- **Recall:** define one key term in your own words.
- **Why:** why does this piece/step exist - what breaks without it?
- **Process:** what happens next, or in what order?
- **Apply/transfer:** a fresh one-line scenario (use a saved interest) - what happens?
- **Edge/failure:** what if it fails, or hits the boundary case?
- **Connect:** how do term X and term Y relate?

How many, by difficulty: **1-2** one gentle recall; **3-4** one or two (recall + why); **5
(default)** two or three across different angles; **6-7** three including one apply/transfer;
**8-10** three or four including an edge/failure and a transfer question.

Stay Socratic and conversational: invite answers in any order, respond to whichever the user takes,
fill the gap, and re-ask only what they missed. Never punish a miss - re-teach that piece.

## Lessons (the primary teaching unit)

A lesson is the main thing TEACH produces: one self-contained, **interactive** HTML file at
`teach/<topic>/lessons/NNNN-slug.html` (increment `NNNN`), teaching one tightly-scoped thing tied to
the mission, in the user's ZPD. It is the **default deliverable for every teaching turn**. The
in-chat **Opening output format** below is its spoken intro, delivered alongside the HTML lesson,
not instead of it; only a throwaway one-off explain-back the user explicitly will not revisit may
use the chat opening alone.

- **Interactive by default.** Every lesson ships at least one *working* in-browser interactive element
  with immediate feedback: a hydrated `.sg-quiz` check, a small simulator/visualizer that lets the user
  step through the process, or a light in-browser task. Reading-only HTML is not a lesson - the user
  must *do* something and see the result. Feedback follows `reference/engagement.md` (immediate,
  tied to a real action; calm, not gamified).
- **Scaffold, do not hand-roll.** On the first lesson in a workspace, copy
  `templates/teach/assets/` into `teach/<topic>/assets/` (shared `lesson.css` + `lesson-book.js` +
  `quiz.js` + `lesson-template.html`). Build every lesson from that scaffold so the whole course looks
  like one thing; write topic-specific simulators as `teach/<topic>/assets/<topic>-viz.js` and reuse,
  never inline-duplicate. Read `assets/` before authoring.
- **Book layout, not a long scroll.** A left table of contents jumps to any section; the reader flips
  pages (prev/next, arrow keys, swipe, or TOC click). Author each page as a `<section id data-title>`
  inside `.pages-track`; `lesson-book.js` builds the TOC and pager. One idea per page, developed per
  **Textbook depth, not abstraction** - the terms table is the index, the concept pages are the
  teaching. The simulator and the quiz each earn their own page so the reader *does* on that page.
- **UI/UX bar.** Lessons are user-facing UI: hold the `reference/ui-ux.md` Expressive baseline. The
  shipped `lesson.css`/`quiz.js` already carry the WCAG 2.2 essentials (visible focus, keyboard
  operability, >=44px targets, `prefers-reduced-motion`, light/dark `color-scheme`) - keep them when
  you adapt. Dense step-tables/visualizers also honor `reference/functional-ui.md`.
- **Beautiful, deep, and scoped.** Clean Tufte-style typography; the user returns to these, so they
  must read and print well. Scope vs depth per **Textbook depth, not abstraction**: cut scope into
  more lessons before thinning a concept's explanation.
- **Knowledge then skill.** Teach only the knowledge the skill needs, cited inline, then drill the
  skill through the tight interactive feedback loop above.
- **Quiz hygiene.** Every answer option is the same length in words (and characters where possible);
  formatting leaks no clue to the correct answer; `quiz.js` randomizes the correct option's position
  on load (same rule as the interview check) - do not encode the answer by position.
- **Linked.** Anchor-link to related lessons and to `reference/*.html`. Recommend one primary source.
  End with a reminder that the agent is their teacher - ask follow-up questions on anything unclear.
- **Gate before done.** A lesson is not finished until
  `node templates/teach-lesson-gate.mjs teach/<topic>/lessons/NNNN-slug.html` exits 0. The gate
  deterministically rejects a page that is off-scaffold, a long scroll, or reading-only (no hydrated
  `.sg-quiz` with a `data-correct` option). On failure, fix the lesson - never the gate.
- **Open it.** After the gate passes, open the lesson in the user's browser with a CLI command.

## Diagrams (Archify by default)

Archify is the default diagram system when a lesson teaches relationships or ordered change: system
structure, a workflow, a call sequence, data movement, or a lifecycle. Follow `reference/archify.md`,
pick the matching renderer, and keep both the editable JSON IR and validated HTML under
`teach/<topic>/diagrams/` with the lesson number and slug. Embed the HTML in the lesson's supplied
`.archify-frame` page and include a direct link so the user can open the full diagram and use its
theme/export controls.

The diagram explains the mental model; it does not replace the required quiz. When active manipulation
is the skill being taught, it also does not replace the simulator or task that provides practice and
feedback. Skip Archify only for a purely definitional or syntax lesson where no meaningful relationship
can be drawn, and record that reason in `NOTES.md` so omission is a conscious teaching choice rather
than drift.

## Reference documents & glossary

Lessons are rarely revisited; reference documents are. After a lesson, distill its compressed essence
into `teach/<topic>/reference/*.html` - syntax/snippets, algorithms/flowcharts, poses/sequences,
routines - formatted for fast lookup. The **glossary** (`GLOSSARY.md`, `teach/GLOSSARY-FORMAT.md`) is
the most important reference: add a term only once the user can use it correctly, be opinionated about
the canonical word, and adhere to it in every later lesson.

## Wisdom & communities

When a question needs wisdom (real-world judgment beyond knowledge or skill), answer as far as you
can, then point the user to a high-reputation **community** (moderated forum, subreddit, local class,
interest group), recorded under Wisdom in `RESOURCES.md`. If the user opts out of communities,
respect it and note the preference there.

## Assets (reusable components)

Lessons are built from reusable components in `teach/<topic>/assets/` (shared stylesheet, quiz
widgets, simulators, diagram helpers). Reuse is the default: read `assets/` before authoring and build
from what is there - the shared stylesheet is the first component every workspace earns, so all lessons
look like one course. When a lesson needs something new and reusable, write it as a component in
`assets/` and link it; never inline code a future lesson would duplicate.

## Opening output format

Use the user's language; short sentences.

```markdown
## [주제]를 왜 쓰는지 감 잡기

먼저 스스로 답해볼 질문:
[{주제}가 해결하려는 핵심 문제를 묻는 한 문장 - 답은 기다리지 않는다]

먼저 핵심 용어부터 정리한다:

| 핵심 용어 | 쉬운 뜻 | 흐름에서 하는 일 |
|---|---|---|
| 용어 1 | 전문용어 없이, 한 문장으로 풀어쓴 정의 | 이 단계에서 맡는 역할 |
| 용어 2..5 | ... | ... |

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

그런 다음 인터뷰 체크와 난이도 메뉴를 본문 텍스트가 아니라 `AskUserQuestion` 한 번의 호출로
내보낸다 - 질문 수, 각도, 선택지, 정답 위치 무작위는 `## Interview check` 규칙 그대로.

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
- An opening leads with the core question (top, not waited on) and ends with the interview check,
  then the difficulty menu.

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

Phrase the mapping in plain sentences, not a table, e.g. "'기억해 둔다'는 변수나 상태에 저장하는
것, '하나씩 본다'는 반복문·iterator·query cursor·event stream으로 순회하는 것". At levels 1-4, use
only one or two steps; at level 5, three to five; at levels 6-10, add precise names and edge cases,
but keep the same bridge order.

## Prerequisite scaffolding

Before introducing any term in the key-terms map, check whether its building blocks are realistic
for the saved difficulty. If the next atom would force a leap (a term defined by other unknown
terms, unseen syntax, an unused data structure), **pause the main lesson and offer to teach the
prerequisite first**. Never push through a leap.

### Triggers - when to scaffold

Scaffold when **any** of these fire:

- The user says "모르겠어 / 잘 모르겠어 / I don't know / no idea / 막혀" to any check question.
- A check answer reveals a missing building block, not just a wrong guess (e.g. answers a different
  layer of question than was asked).
- The next step would assume a term, syntax, or concept the user has not heard in this session.
- Saved difficulty is 1-4 and the topic uses any specialized vocabulary.

A miss means a piece **below** the current atom is missing. **Do not just rephrase the same
explanation at the same level** - back up one level, not sideways.

### Offer the prerequisite (do not just dive in)

Say plainly what is missing and ask once whether to cover it now - one short prose offer (not the
choice tool; the question is binary and conversational):

> 이 다음을 이해하려면 `<누락된 개념>` 부터 짚는 게 좋겠다. 잠깐 그것부터 짧게 보고 갈까,
> 아니면 그냥 이어서 갈까?

If yes (or silent on the dive-in path), open a numbered prerequisite mini lesson: `사전지식 ① -
<이름>`, `사전지식 ② - ...`. **One piece per turn.** When all listed prerequisites are covered,
**return to the main lesson at the exact atom that blocked**, not to the top.

### Prerequisite turn shape (level 1-4)

Shorter than the standard opening - target ~150 words; no key-terms table, no human-to-code bridge,
no difficulty menu inside the prerequisite:

```markdown
# 사전지식 ① - [이름]

[한 줄 정의 - 전문용어 없이]

[가장 작은 코드/그림/예시 한 개]

[비유 한 줄 - 사용자 관심사에서]

## 미니 퀴즈 (한 개만)

[정답 한 가지로 답할 수 있는 가장 쉬운 질문]
```

Ask the mini quiz as **one inline prose question**, per the bite-sized exception in
`## Interview check`.

### Recursive back-off

A prerequisite can itself trigger another prerequisite: on a mini-quiz miss, apply the same trigger
rule and back up again. No maximum depth - keep backing up until the user can answer one tiny check
unaided, then climb back the same path, one rung at a time, to the original blocked atom. If a
prerequisite would need three or more layers of back-off, the saved difficulty is wrong - drop one
level via the difficulty menu when the main lesson resumes, and say why briefly.

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
- On change, rewrite `teach/USER_PREFERENCE.md`, confirm briefly, and re-pitch the same content at the new
  level.
- Treat anything beyond bare 1/2/3 as lesson content.

## User preference profile

Persistent file: `<skill>/teach/USER_PREFERENCE.md`. It is git-ignored; never commit personal data. On first
run, seed from `teach/USER_PREFERENCE.template.md`.

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

Exit checklist; each rule is owned by the named section:

1. Smallest useful pieces, key-terms map, plain definitions, process trace, then the composed explanation (**Decomposition**).
2. Teach each concept to textbook depth; narrow scope into more lessons, never thin an explanation (**Textbook depth, not abstraction**).
3. Anchor every process or flow in one real worked scenario traced end-to-end with sourced values (**Process explanation gate**).
4. Every turn ends with the interview check and the difficulty menu; a miss means a missing piece below - back up, never rephrase at the same level (**Interview check**, **Prerequisite scaffolding**).
5. Mission-grounded, sourced, never parametric; difficulty and interests come from the saved profile (**The mission**, **Resources**, **User preference profile**).
6. Default relationship/flow visuals to Archify, then ship the interactive HTML lesson, pass `teach-lesson-gate.mjs`, record learning, and promote glossary terms (**Diagrams**, **Lessons**, **Flow** step 5).
