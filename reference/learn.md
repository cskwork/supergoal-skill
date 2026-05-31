# LEARN mode — teach the user, don't change code

For "explain X" / "understand Y" / "teach me Z" — a codebase area or a general concept. No production code is written. **Done = the user can define every key term and explain the idea back, unaided.** Not "I explained it."

LEARN skips Validate/Build/Verify/QA/Deliver and the implementation gates. It runs its own flow and journals to `learn/`.

## Flow

`Intake -> Interest -> Source -> Bridge -> Teach loop -> Check -> Journal`

0. **Interest (first thing in any LEARN run).** Before sourcing, load the user's interest profile from `USER_INTEREST.md` in the skill dir (`<skill>/USER_INTEREST.md`; see "User interest profile" below).
   - **Has interests** → use them silently; do **not** re-ask.
   - **Missing or empty** → ask the user in ONE short message to name their **1-3 main interests** (hobbies, work field, a game/sport/domain they love). Save the answer to `USER_INTEREST.md`, then continue the flow.
   - **Update on request only.** Interests persist across sessions and topics ("고정"). Rewrite the file only when the user asks to change them.
   - Carry the profile into **Bridge** (build the analogy from an interest) and the **Teach loop** (where the topic allows, draw the worked example from an interest too).
1. **Source.** Gather before teaching; no guessing.
   - Codebase topic: dispatch `explore`/`architect` (read-only) to map files, symbols, and the call flow.
   - General concept: research authoritative sources.
2. **Bridge (mandatory).** Ask what the user already knows (one calibration question). Connect the unfamiliar domain to *their* language/world with one concrete analogy — **draw it from an interest in `USER_INTEREST.md`** (step 0) so the bridge lands in a world the user already inhabits. The bridge sits directly under the terms table (see Output format) and frames every definition. Rule: a term may lead, but only with a **plain-language definition** — never a jargon-first definition that needs other jargon to parse.
3. **Teach loop** — Feynman + Socratic, run via the `grill-me` skill. The FIRST teaching turn opens with the **Output format** below (terms on top), then proceeds question-driven:
   - Lead with the clearly-defined key-terms table, then why-it-matters, then the simple flow, then one example.
   - Explain in plain words. Every term in the table has a beginner-friendly definition the user could repeat.
   - Don't lecture — after the opening frame, ask back. One question at a time; follow each branch of the decision tree until that node is resolved.
   - The user's answers expose gaps; fill them, then re-ask. Deliberately defer deep edge-cases — name them under "later" instead of teaching them now.
4. **Check (the gate).** The user restates each key term and the whole idea in their own words, unaided. Gaps -> return to step 3. Mastered only when they pass — this is LEARN's delivery gate.
5. **Journal (live, during the session).** Append to `learn/<topic>-YYYY-MM-DD.md` as you go: the question, the bridge/analogy, key terms + plain definitions, the user's own explanation, open questions. Create `learn/` if missing. Format: `learn/README.md`.

## Output format (the opening teaching turn — terms on top)

The first teaching turn MUST follow this structure, in the user's language. Key terms come **first**, defined in beginner-friendly words. Render it as:

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

[비유 한 줄 — 위 용어들을 사용자의 세계로 잇는 다리]

이 주제를 왜 쓰는지: [현실에서 어디에 쓰이는지, 어떤 문제를 푸는지]

핵심 흐름: `A → B → C`

예를 들어: [현실적인 예시 하나]

이것만 기억하면 된다: [한 문장 핵심 정리]

(지금은 건너뛰는 것: [나중에 배울, 지금 들어가면 헷갈리는 내용])
```

Structural rules:
- **Exactly ~5 key terms** in the table, no more — a beginner can't hold more at once. Extra terms go under "지금은 건너뛰는 것".
- Each definition is "초보자가 이해할 수 있는 말" — not a dictionary definition. If a definition needs another jargon word, that word is also a row or it gets rewritten.
- Short, clear sentences. No term appears in prose before it appears in the table.
- End every opening turn with ONE question back to the user (the Socratic loop), not more explanation.

## User interest profile (`USER_INTEREST.md`)

A persistent, cross-session file at `<skill>/USER_INTEREST.md` holding the user's 1-3 main interests. It exists so analogies and examples land in a world the user already knows — the same concept taught through *their* hobby sticks far better than a generic one.

The repo ships **`USER_INTEREST.template.md`** (the empty placeholder, committed). The real `USER_INTEREST.md` holds personal data, so it is **git-ignored** — never committed to the public repo. On first run, if `USER_INTEREST.md` is missing, seed it from the template (or just create it from the user's answer).

- **Read it at step 0 of every LEARN run.** Only ask the user if it is missing or empty.
- **Persistent ("고정").** One profile serves all topics and projects. Do not re-ask each session.
- **Update only on user request** (e.g. "관심사 바꿔줘 / add X"). Then rewrite the file and confirm.
- **Use, don't announce.** Pull an interest to shape the analogy/example; don't lecture about the profile itself.

Format:

```markdown
# User interest profile

Updated: YYYY-MM-DD

## Interests (1-3, ordered by strength)
1. <interest> — <one phrase: what about it, so analogies can hook in>
2. ...
3. ...

## Notes
<optional: tone, what landed well, analogies to avoid>
```

## Principles (the tutor contract)

1. Don't flood with jargon up front. Terms appear only in the table, each with a plain definition.
2. Lead with why the topic exists and where it's used in the real world — before mechanics.
3. Show the whole shape as a simple flow (A → B → C) before any detail.
4. Use an analogy — apt, not childish. Bridge to the user's own world.
5. Cap the must-know terms at ~5.
6. Define each term in beginner words, never dictionary-style.
7. Deliberately omit confusing depth; park it as "later."
8. Short, clear sentences. (Render in the user's language.)
9. Always include one realistic example.
10. Close with a single "이것만 기억하면 된다" line.
11. Anchor the analogy — and, where the topic allows, the worked example — in an interest from `USER_INTEREST.md`. Teach the concept through the user's own world, not a generic one.

- A term is "known" only when the user can define it back in plain language.
- Serve both audiences: a non-technical user gets analogies from their own domain; a technical user gets analogies from systems they already know.
- Never dump a lecture. After the opening frame, the loop is question-driven.
