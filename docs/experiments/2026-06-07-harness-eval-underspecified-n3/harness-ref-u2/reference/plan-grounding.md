# Plan grounding - before plan freeze

Between Plan and Human Feedback, the planner grounds `plan.md` in the project's domain and
architecture. The planner answers its own pressure test from explored docs/code; do not ask the human
unless docs cannot decide a load-bearing choice. Human approval remains the later Human Feedback gate.

This file is the standalone contract.

## Required input

Read the run `README.md` `## Domain Brief` first when present. It is the compact payload from
`reference/domain-context.md`: selected knowledge files, terms, invariants, current-code verification,
entry points, test commands, and gaps.

Use saved domain facts only as pointers. Any load-bearing plan choice must cite current docs/code or
name the gap. If saved domain context conflicts with current code, current code wins and the conflict
goes into `plan.md`.

## Decision-tree pressure test

Use this for Track A and whenever Track B depends on domain language or system boundaries.

1. Build the decision tree: root choice, dependent choices, hidden assumptions, and risk branches.
   Resolve parent decisions before child decisions.
2. Ask one precise question per branch. If current docs/code can answer it, answer it yourself and cite
   the source; ask the human only for unresolved load-bearing choices.
3. Challenge terminology against the Domain Brief, selected knowledge files, and current repo docs if
   they exist. If a term conflicts, choose a canonical term or name the conflict.
4. Stress concrete scenarios: normal case, boundary case, failure case, and cross-context ownership
   case when relevant.
5. Cross-check every "how it works" claim against code. Contradictions go into `plan.md` as gaps or
   corrected assumptions.
6. Update docs only after a decision is resolved. Glossary entries define domain terms only;
   `decisions/*.md` entries are for hard-to-reverse, surprising tradeoffs with real alternatives.
7. Record a compact grounding ledger in `plan.md`: question, answer/source, decision, and remaining
   gap. Do not paste the whole interview.

## Track A - feature / novel work

1. Locate the Domain Brief, `brief.md`, the Explore map, and relevant repo docs or decision records
   if present. Do not re-litigate settled decisions.
2. Walk the design tree. For each open question, choose the best option and justify it from docs/code.
   Escalate only unresolved load-bearing choices.
3. Resolve vague or overloaded terms against the glossary. Cross-check every "how it works" claim
   against code.
4. Update docs only when useful: add domain terms to the glossary; write decision notes only for
   hard-to-reverse surprising tradeoffs.
5. Put resolved choices and definitions into `plan.md`.

## Track B - refactor / improve codebase

Vocabulary: **Module** = interface + implementation. **Interface** = what callers must know. **Depth**
= leverage behind a small interface. **Seam** = replaceable boundary. **Leverage** = caller gain.
**Locality** = change/bugs/knowledge kept together.

1. Read the Domain Brief and relevant repo docs or decision records first.
2. Find friction: shallow modules, cross-module bouncing, test-only extractions with no locality, leaky
   seams, untestable interfaces.
3. Deletion-test suspected shallow code: does removing it concentrate complexity or merely move it?
4. Rank by leverage. Pressure-test top candidates: what sits behind the seam, what tests survive. One
   adapter is hypothetical; two adapters make a real seam.
5. Write chosen deepenings into `plan.md` with files, problem, solution, and locality/leverage benefit.
   Surface decision conflicts only when the friction warrants reopening them.

## Exit

`plan.md` is now grounded, hashed, frozen, and ready for Human Feedback.
