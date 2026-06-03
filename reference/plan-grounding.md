# Plan grounding - before plan freeze

Between Plan and Human Feedback, the planner grounds `plan.md` in the project's domain and
architecture. The planner answers its own grill from explored docs/code; do not ask the human unless
docs cannot decide a load-bearing choice. Human approval remains the later Human Feedback gate.

Source skills, when installed: `grill-with-docs` for Track A and `improve-codebase-architecture` for
Track B. This file is the fallback contract.

## Required input

Read the run `README.md` `## Domain Brief` first when present. It is the compact payload from
`reference/domain-context.md`: selected knowledge files, terms, invariants, current-code verification,
entry points, test commands, and gaps.

Use saved domain facts only as pointers. Any load-bearing plan choice must cite current docs/code or
name the gap. If saved domain context conflicts with current code, current code wins and the conflict
goes into `plan.md`.

## Track A - feature / novel work

1. Locate the Domain Brief, `CONTEXT.md`, optional root `CONTEXT-MAP.md`, relevant `docs/adr/`,
   `brief.md`, and the Explore map. Do not re-litigate settled ADRs.
2. Walk the design tree. For each open question, choose the best option and justify it from docs/code.
   Escalate only unresolved load-bearing choices.
3. Resolve vague or overloaded terms against the glossary. Cross-check every "how it works" claim
   against code.
4. Update docs only when useful: add glossary terms to `CONTEXT.md`; write an ADR only for hard-to-reverse
   surprising tradeoffs.
5. Put resolved choices and definitions into `plan.md`.

## Track B - refactor / improve codebase

Vocabulary: **Module** = interface + implementation. **Interface** = what callers must know. **Depth**
= leverage behind a small interface. **Seam** = replaceable boundary. **Leverage** = caller gain.
**Locality** = change/bugs/knowledge kept together.

1. Read the Domain Brief, `CONTEXT.md`, and relevant ADRs first.
2. Find friction: shallow modules, cross-module bouncing, test-only extractions with no locality, leaky
   seams, untestable interfaces.
3. Deletion-test suspected shallow code: does removing it concentrate complexity or merely move it?
4. Rank by leverage. Self-grill top candidates: what sits behind the seam, what tests survive. One
   adapter is hypothetical; two adapters make a real seam.
5. Write chosen deepenings into `plan.md` with files, problem, solution, and locality/leverage benefit.
   Surface ADR conflicts only when the friction warrants reopening them.

## Exit

`plan.md` is now grounded, hashed, frozen, and ready for Human Feedback.
