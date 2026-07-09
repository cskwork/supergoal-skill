# ARCHITECTURE mode - architecture survey (deepening opportunities, then grill the pick)

Use when the user wants to find what to improve, not to change it yet: "improve the architecture",
"find refactoring opportunities", "어디를 리팩터링하면 좋을까", "구조 개선 후보 찾아줘". Survey the
codebase for architectural friction and propose deepening refactors - turning shallow modules into
deep ones - for testability and AI-navigability. It writes NO source or test edits - read-only except
the run vault (plus user-approved `CONTEXT.md`/ADR writes during the grill). The chosen refactor is a
new objective for another mode; ARCHITECTURE itself never starts fixing.

## Vocabulary (use these terms exactly; do not drift into "component", "service", "API", "boundary")

- **Module** - anything with an interface and an implementation (function, class, package, slice).
- **Interface** - everything a caller must know: types, invariants, error modes, ordering, config.
- **Depth** - a lot of behavior behind a small interface. **Shallow** - interface nearly as complex
  as the implementation.
- **Seam** - where an interface lives; behavior can be altered there without editing in place.
- **Adapter** - a concrete implementation behind a seam.
- **Leverage** - what callers get from depth. **Locality** - what maintainers get: change, bugs, and
  knowledge concentrated in one place.
- **Deletion test** - imagine deleting the module: complexity vanishes = it was a pass-through;
  complexity reappears across N callers = it was earning its keep.

## Survey

1. Read the repo's existing language FIRST: `CONTEXT.md` / `.domain-agent/` glossary and `docs/adr/`.
   ADRs record decisions not to re-litigate - surface a candidate that contradicts one only when the
   friction is real enough to reopen it, and mark the conflict on the candidate.
2. Explore organically (`agents/explore.md`) for friction - note where reading hurts, no rigid
   heuristic sweep:
   - understanding one concept requires bouncing between many small modules;
   - shallow modules; pure functions extracted for testability while the bugs hide in how they are
     called (no locality);
   - tightly-coupled modules leaking across their seams;
   - code untested, or untestable through its current interface.
3. Apply the deletion test to every suspected pass-through before it becomes a candidate.

## Report (the survey deliverable)

Write a self-contained `report.html` in the run vault (`docs/changelog/<YYYY-MM>/<DD-arch-topic>/`) - not
$TMPDIR, not the repo root; use the docs language (SKILL.md). Clone `templates/arch-report.html`: inline
CSS only, no CDN or network (offline, like the LEARN-DOMAIN handbook); before/after as inline SVG or CSS
boxes (shallow -> deep). Per candidate: Files / Problem (the friction) / Solution in plain language /
Benefits stated in locality, leverage, and test terms / a before/after visual / recommendation strength
`Strong | Worth exploring | Speculative` as a badge. Every Strong candidate is re-checked against the
cited code before it enters the report - plausible-but-unverified is the failure mode. End with a `Top
recommendation` block (which to tackle first and why) and a `Not covered` block (so silence is not read
as approval). For Korean docs, translate the report chrome, set `<html lang="ko">`, keep body text at
least `17px/1.7`, helper text at least `14px`, and card/module text at least `15px`. Do NOT propose
interfaces yet - present candidates, then tell the user the `report.html` path (open it with the OS
opener when available) and ask which one to explore.

## Grill the pick

The user picks a candidate; walk its design tree with the ticket-depth protocol from
`reference/wayfinder.md`: one question at a time with a recommended answer; explore the codebase instead
of asking when code can answer; stress-test the deepened module with concrete scenarios - what sits behind
the seam, which tests survive the change. Decisions land inline where they belong:

- A deepened module named after a concept missing from `CONTEXT.md` -> add the term there (create
  the file lazily; glossary only, no implementation details).
- A fuzzy or overloaded term sharpened mid-grill -> update its `CONTEXT.md` entry right then.
- The user rejects a candidate for a load-bearing reason -> offer a short ADR under `docs/adr/`
  (context, decision, rationale) so future surveys don't re-suggest it; skip ephemeral ("not now")
  and self-evident reasons.

## Exit

Report delivered; repo untouched except the run vault and any user-approved `CONTEXT.md`/ADR writes
(`git status` shows nothing else). The grilled candidate's refactor plan hands off to LEGACY or WAYFINDER
(multi-component reshape) as a new objective - do not start fixing in this mode.
