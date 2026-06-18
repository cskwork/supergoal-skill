# teach/

State for the supergoal **TEACH mode** (see `reference/teach.md`). TEACH runs as a stateful,
multi-session teaching workspace - decomposition + process-trace pedagogy fused with the workspace
model from mattpocock/skills `teach`.

## Layout

```
teach/
  README.md                  committed - this file
  USER_PREFERENCE.template.md committed - seed for the per-user profile
  USER_PREFERENCE.md          git-ignored - difficulty (1-10) + interests, shared across topics
  *-FORMAT.md                 committed - format guides for the workspace artifacts
  <topic>/                    git-ignored - one workspace per topic (personal learning data)
    MISSION.md                why the user is learning this        (MISSION-FORMAT.md)
    RESOURCES.md              high-trust sources + communities      (RESOURCES-FORMAT.md)
    GLOSSARY.md               canonical terms for this topic        (GLOSSARY-FORMAT.md)
    learning-records/NNNN-*.md ADR-style records of real learning   (LEARNING-RECORD-FORMAT.md)
    lessons/NNNN-*.html       beautiful self-contained HTML lessons (primary teaching unit)
    reference/*.html          compressed cheat-sheets to revisit
    assets/*                  reusable lesson components (stylesheet, quiz widget)
    NOTES.md                  teaching-preference scratchpad
    <topic>-YYYY-MM-DD.md     live chat journal, one per session
```

Only `README.md`, `USER_PREFERENCE.template.md`, and the `*-FORMAT.md` guides are committed. Everything
under `teach/<topic>/` plus `USER_PREFERENCE.md` is personal learning data and is git-ignored - never
commit a user's mission, records, lessons, or journal.

## Session journal template

One journal file per learning session, written *during* the session, not after. Filename:
`<topic>/<topic>-YYYY-MM-DD.md` (kebab-case topic).

```markdown
# <topic> - YYYY-MM-DD

## Question
What the user wanted to understand, in their words.

## Bridge
The analogy that links the unfamiliar domain to the user's own language/world.

## Key terms
- **<term>** - one-line plain definition (no jargon, or jargon defined inline).

## User's explanation
The idea restated by the user, unaided. Proof of understanding.

## Open questions
What is still unclear; where to pick up next time.
```

Rule: a term enters "Key terms" only once it has a plain-language definition the user can repeat back.
Decision-grade insight (not session activity) graduates from the journal into a learning record; see
`LEARNING-RECORD-FORMAT.md`.
