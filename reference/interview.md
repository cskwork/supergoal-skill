# Clarifying interview - before plan freeze

After context-gathering and before the plan freezes, run a conditional clarifying interview so the
plan targets the user's real intent. The interview resolves *what to build/fix*; *how* is settled by
grounding the plan in docs/code afterwards (`reference/plan-grounding.md`).

Applies to GREENFIELD, DEBUG, and LEGACY only. LEARN and LEARN-DOMAIN skip it (LEARN already asks one
scope question; see `reference/teach.md`).

This file is the standalone contract.

## Where it runs

| Mode | Insertion point | Context already gathered |
|---|---|---|
| GREENFIELD | End of Frame, before plan-grounding/freeze | `brief.md`, `## Validation`, Domain Brief |
| LEGACY | End of Frame, before plan-grounding/freeze | Explore affected-code map, Domain Brief |
| DEBUG | End of Diagnose, after ranked hypotheses, before Confirm + fix plan | hypothesis ledger, current code |

## Gate - when to interview vs skip

Interview only when the request is genuinely underspecified. Fire when **either** holds:

- The request has multiple plausible interpretations, or
- A key detail is unclear across the coverage dimensions below (objective, definition of done, scope,
  constraints, environment, safety/reversibility).

Skip when **any** holds (and log the skip in `README.md`):

- The request is already clear and single-interpretation, or
- A quick, low-risk codebase/docs read can answer the missing detail (resolve it by reading, not
  asking), or
- The mode is LEARN / LEARN-DOMAIN.

Do not rely on model default: LLMs default to not asking and misjudge underspecification, so this gate
is mandatory, not optional. But asking when sufficient information already exists is a failure too -
unnecessary questions burden the user. Detect ambiguity against three triggers: missing goal, missing
premises, ambiguous terminology.

## Code-first rule

Before asking the user anything, resolve every code-answerable question by reading current docs/code -
reuse `reference/plan-grounding.md`'s decision-tree pressure test. Only unresolved, load-bearing,
user-only choices reach the interview. Saved domain facts are pointers; current code wins on conflict.

## Coverage dimensions (selection menu, not a checklist to exhaust)

Draw the questions from these six axes. Pick the few that matter for this task; do not ask all six.

1. **Objective** - what changes vs what must stay the same.
2. **Definition of done** - acceptance criteria, concrete examples, edge cases.
3. **Scope** - which files / components / users are in vs out.
4. **Constraints** - compatibility, performance, style, dependencies, time budget.
5. **Environment** - language/runtime versions, OS, build/test runner.
6. **Safety / reversibility** - data migration, rollout/rollback, blast radius, risk.

DEBUG leans on objective + definition-of-done + reproducibility/safety. GREENFIELD and LEGACY lean on
scope + constraints + environment.

## Question selection

- **Cap at <=5 questions, one clarification round.** Ask only as many as the ambiguity requires; one
  or two questions are enough when they settle the load-bearing choice.
- **Maximize information gain.** Prefer the question that most narrows the space of viable plans -
  one that eliminates a whole branch of work. Reason about which plans survive each answer, not about
  the questions in isolation.
- **Drop redundant questions.** If `brief.md`, the Domain Brief, or the Explore map already answers an
  aspect, do not ask it.
- **One at a time, recommend an answer.** Ask serially, wait for each reply before the next, and give
  your recommended answer for every question so the user can confirm or correct cheaply. Do not batch
  all questions into a single parallel turn.

## DEBUG variant - ranked hypothesis re-ranking

DEBUG does not ask abstract requirement questions. After Diagnose produces its competing-hypothesis
ledger (`reference/debugging.md` step 3), present 3-5 ranked root-cause hypotheses to the user for
re-ranking before confirming and writing the fix plan. This is a cheap checkpoint, **non-blocking**:
if the user is AFK, proceed with your own ranking. If the user re-ranks, advance the hypothesis they
favor only when direct evidence still supports it; never abandon evidence for preference. Record the
presented ranking and any user re-rank in `README.md`.

## Hard gate - block plan freeze

Do not freeze the plan (GREENFIELD/LEGACY) or confirm the root cause and write the fix plan (DEBUG -
blocking only for must-have answers, the re-ranking itself stays non-blocking) until must-have
questions are answered, or the user explicitly approves proceeding on stated assumptions. Unanswered
must-haves either get an explicit user-approved assumption or block.

## Recording

Write a compact `## Interview` section in `plan.md` (DEBUG: in `README.md` next to the hypothesis
ledger): each question, the chosen answer or user-approved assumption, and the decision it drove. Do
not paste the whole exchange. A skipped interview records one line in `README.md` stating why it was
safe to skip.

## Exit

Requirements are crystallized. GREENFIELD/LEGACY proceed to plan-grounding and freeze; DEBUG proceeds
to Confirm and the fix plan. Build starts only after the plan is grounded and frozen.
