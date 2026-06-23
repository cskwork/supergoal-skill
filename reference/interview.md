# Clarifying interview - before plan freeze

After context-gathering and before the plan freezes, run a conditional interview so the plan targets
the user's real intent. It fires on two triggers, one mechanism:

- **Ambiguity** (resolve *what* to build/fix): the request is underspecified, so clarify intent;
  *how* is then settled by grounding the plan in docs/code (`reference/plan-grounding.md`).
- **Blast radius beyond target** (confirm the approach): the grounded fix reaches past its explicit
  target - changes another function/module or alters existing observed behavior - so surface that
  impact and confirm the approach, even when the request itself is unambiguous. Explore already
  mapped these side effects (`agents/explore.md`); this is confirmation, not discovery.

Applies to GREENFIELD, DEBUG, and LEGACY only. LEARN and LEARN-DOMAIN skip it (LEARN already asks one
scope question; see `reference/teach.md`).

This file is the standalone contract.

## Where it runs

Two insertion points, by trigger. Ambiguity runs before grounding (it shapes *what* to build);
blast-radius confirm runs after grounding sets the approach but before freeze/Build (the impact is
only concrete once the approach is chosen).

| Mode | Ambiguity - before grounding | Blast-radius confirm - after grounding, before freeze/Build |
|---|---|---|
| GREENFIELD | End of Frame | once plan-grounding fixes the approach |
| LEGACY | End of Frame (Explore map in hand) | once plan-grounding fixes the approach |
| DEBUG | End of Diagnose, after ranked hypotheses, before Confirm | folded into Confirm, with the hypothesis re-ranking |

Context in hand: GREENFIELD `brief.md` / `## Validation` / Domain Brief; LEGACY Explore affected-code
map + Domain Brief; DEBUG hypothesis ledger + current code.

## Gate - when to interview vs skip

Fire when **any** holds:

- **Ambiguity:** the request has multiple plausible interpretations, or a key detail is unclear across
  the coverage dimensions below (objective, definition of done, scope, constraints, environment,
  safety/reversibility), or
- **Blast radius beyond target:** the grounded fix changes a function/module past its explicit target,
  or alters existing observed behavior. This fires even when the request is unambiguous - the
  "already clear" skip below does NOT cover it.

Skip when **any** holds (and log the skip in `README.md`):

- The request is clear AND the change stays within its explicit target (no cross-function or behavior
  spillover), or
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
scope + constraints + environment. When the blast-radius trigger fired, dimension 6 (safety /
reversibility) is REQUIRED, not optional: name the functions/modules touched and the behavior that
could change.

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

When the chosen fix's blast radius reaches past the cause site - other functions/modules, or observed
behavior - present that impact alongside the re-ranking and apply the tiered strength below before the
first source edit.

## Hard gate - block plan freeze

Do not freeze the plan (GREENFIELD/LEGACY) or confirm the root cause and write the fix plan (DEBUG -
blocking only for must-have answers, the re-ranking itself stays non-blocking) until must-have
questions are answered, or the user explicitly approves proceeding on stated assumptions. Unanswered
must-haves either get an explicit user-approved assumption or block.

**Blast-radius confirm - strength by risk (tiered).** Default is non-blocking: present the impact
summary and proceed on your own best judgment if the user is AFK. Escalate to a hard gate - no Build
until the user explicitly approves, AFK or not - when **any** holds:

- **Wide:** spans multiple modules or crosses a service boundary, or
- **Destructive / irreversible:** a SKILL.md hard stop applies (drop data, force-push, external
  publish, migration), or
- **Behavior change:** alters an existing public contract or observed behavior callers depend on.

A user approval here confirms *intent* only; it never substitutes for the Critic's independent *spec*
check. Both the user and the agent can be wrong - the Critic is the separate signal.

## Recording

Write a compact `## Interview` section in `plan.md` (DEBUG: in `README.md` next to the hypothesis
ledger): each question, the chosen answer or user-approved assumption, and the decision it drove. Do
not paste the whole exchange. A skipped interview records one line in `README.md` stating why it was
safe to skip.

For a blast-radius confirm, record the impact presented (functions/modules touched, behavior that
could change), the strength applied (non-blocking / hard gate), and the user's approval or your
AFK-proceed decision.

## Exit

Requirements are crystallized. GREENFIELD/LEGACY proceed to plan-grounding and freeze; DEBUG proceeds
to Confirm and the fix plan. Build starts only after the plan is grounded and frozen, and any fired
blast-radius confirm has cleared - approved, AFK-proceeded, or safely skipped and logged.
