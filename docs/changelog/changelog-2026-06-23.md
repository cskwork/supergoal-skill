# Changelog 2026-06-23

## TEACH: make the interactive HTML lesson the default deliverable, in a book layout

User feedback while running TEACH on a coding problem: lessons should produce
"interactive, intuitive learning material with great UI/UX, not just teach from the
terminal," and read "left-to-right like turning book pages, with a left table of
contents to jump around" - not one long top-down scroll.

`reference/teach.md` already mandated beautiful, interactive HTML lessons (Tufte
typography, `assets/` components, quiz widgets, simulators), so the capability was
specified. Two real gaps remained: (1) the flow framed the in-chat opening as primary
and the HTML lesson as optional "for anything the user will revisit," so a terminal-only
lesson read as compliant; and (2) nothing was *shipped* to make lessons interactive by
default - every workspace would hand-roll its stylesheet/quiz, so quality drifted.

### Decision

Strengthen the framing (HTML lesson = default every turn) and ship a reusable scaffold
so interactivity and a consistent look are the path of least resistance, not extra work.
Add a book/paged layout (left TOC + horizontal page-turn) as the lesson shape.

Rejected alternatives:
- *Leave teach.md as-is, just build a nicer one-off lesson.* Fixes one lesson, not the
  skill; the next topic regresses. The user explicitly suspected "the skill needs
  updating," and they were right about the framing.
- *Bake the assets into each workspace's `teach/<topic>/assets/` only.* Those dirs are
  git-ignored (personal data), so nothing ships to other users. Put the reusable starter
  in committed `templates/teach/` instead; copy into a workspace on first lesson.
- *A heavyweight slide framework (reveal.js et al.).* Too much dependency weight for a
  self-contained, printable lesson file. A ~150-line zero-dependency engine covers TOC +
  page-turn + keyboard + swipe + deep-link.

### What

- `reference/teach.md` Lessons section: the interactive HTML lesson is now the **default
  deliverable for every teaching turn** (chat opening is its spoken intro, not a
  substitute). Added rules: *Interactive by default* (every lesson ships a working
  in-browser element with immediate feedback), *Scaffold don't hand-roll* (copy
  `templates/teach/assets/` on first lesson), *Book layout not a long scroll* (left TOC +
  page-turn), and a *UI/UX bar* wiring lessons to the existing `reference/ui-ux.md`
  Expressive baseline + `reference/engagement.md` feedback + WCAG 2.2. Flow step 5 now
  writes + opens the HTML lesson by default.
- New `templates/teach/assets/` scaffold (committed, inherited by every workspace):
  - `lesson.css` - shared stylesheet: design tokens, light/dark `color-scheme`, a11y focus,
    Tufte-influenced typography, quiz styles, and the book layout (grid TOC + paged track +
    pager). `minmax(0,1fr)` + `min-width:0` so the paged track sizes correctly.
  - `lesson-book.js` - zero-dependency book engine: builds the left TOC + pager from
    `<section data-title>` pages; flips via prev/next, arrow keys (ignored while typing in a
    simulator input), swipe, and TOC click; pixel-pinned page widths so the slide offset
    never depends on `%` resolution; hash deep-link with no entry-slide; `prefers-reduced-motion`.
  - `quiz.js` - zero-dependency quiz widget: hydrates `.sg-quiz` blocks, instant
    correct/incorrect feedback, randomizes option order on load (quiz hygiene), score tally.
  - `lesson-template.html` - book skeleton wiring the above.
  - `README.md` - what gets copied where, the book/section authoring contract, the standards
    each lesson must meet, and the quiz markup contract.

### Demo + verification

Built a full lesson for the Two Sum problem (`teach/two-sum/`, git-ignored) on the
scaffold: 9 book pages, a step-through hash-map simulator (`two-sum-viz.js`), and three
randomized quizzes, tied to the user's mission (apply the hash-map lookup pattern in real
code) and interests (everyday/cooking analogies). Verified: simulator frame-logic correct
on 4 cases incl. all three LeetCode examples and a negatives case (4/4); JS syntax-checked;
headless Edge screenshots of the TOC/terms/simulator/quiz pages confirm alignment after
fixing an initial paged-offset bug (entry transition was captured mid-slide; deep-link now
positions instantly, and page widths are pixel-pinned).

Note (environment, not repo): the active skill at `~/.claude/skills/supergoal` and
`~/.agents/skills/supergoal` were converted to junctions onto this repo so `git pull`
reflects immediately. Done non-destructively (move-aside backups `*.prejunction`, since
`rmdir /s` is blocked by the box's deny rules).

## DEBUG/LEGACY/GREENFIELD: confirm blast-radius with the user before Build

User request: after Explore + plan, before applying a fix, a user interview must surface any
side effects - changes to other functions/modules the fix would cause - and confirm the chosen
approach meets the requirement. The premise: those side effects are already found in Explore,
so this is *confirmation*, not discovery. The rationale the user gave: a prompt may not carry
full context, so the user can be wrong and the agent can be wrong - which is exactly why a
separate Critic exists.

`agents/explore.md` already maps the blast radius with `file:line` citations (it has a GATE for
it), so the "already discovered in Explore" premise holds. The real gap was the confirm step:
`reference/interview.md` only fired on *ambiguity* (request underspecified) and resolved *what*
to build/fix; `reference/plan-grounding.md` had the planner decide blast-radius tradeoffs itself
("do not ask the human unless docs cannot decide"). Nothing presented the mapped impact to the
user before the first edit.

### Decision

Extend the existing interview rather than add a new step or file - one mechanism, two triggers:
keep ambiguity (what to build, before grounding), add a blast-radius confirm (the approach,
after grounding sets it, before freeze/Build). Strength is tiered: non-blocking by default
(present impact, proceed on best judgment if the user is AFK), escalating to a hard gate -
explicit approval before Build, AFK or not - when the change is wide (multi-module / service
boundary), destructive/irreversible (a SKILL.md hard stop), or alters observed behavior callers
depend on. The trigger fires only when the fix reaches *past its explicit target*; a
self-contained local edit skips and logs the skip.

Both decisions (tiered strength; fire-on-beyond-target) were the user's explicit choice.

Rejected alternatives:
- *Always block on any non-trivial blast radius.* The strongest reading of "must", but it
  fights the skill's established non-blocking/AFK checkpoints and burdens the user on safe
  changes.
- *Always non-blocking (present, never wait).* Matches the DEBUG hypothesis re-ranking pattern
  but lets a wide/destructive/behavior-changing edit proceed unconfirmed - the case that most
  needs a stop.
- *A new `reference/blast-radius-confirm.md` + checkpoint.* Redundant with the interview
  mechanism and against the "succinct, for agent understanding only" constraint.

### What

- `reference/interview.md` (primary): reframed intro to two triggers; Gate adds "blast radius
  beyond target" (fires even when the request is unambiguous - the "already clear" skip does
  not cover it); "Where it runs" splits ambiguity (before grounding) from blast-radius confirm
  (after grounding, before freeze/Build); new tiered-strength rule under Hard gate; coverage
  dimension 6 (safety/reversibility) made REQUIRED when the trigger fires; DEBUG variant folds
  the fix-plan blast radius into the existing hypothesis re-ranking; Recording + Exit updated.
  Invariant added: a user approval confirms *intent* only, never substitutes for the Critic's
  independent *spec* check.
- `SKILL.md`: Frame step and the reference table now name the blast-radius confirm (tiered,
  hard-gated when wide/destructive/behavior-changing).
- `reference/plan-grounding.md`: the "don't ask the human" rule gets an explicit exception -
  blast radius beyond target is the user's choice, hand it to the interview confirm before
  freezing; Exit updated.
- `reference/debugging.md`: Step 4 Confirm presents the fix-plan blast radius with the
  re-ranking and applies the tiered confirm before the first edit.
- `reference/role-loop.md`: Build now opens with a precondition - the blast-radius confirm has
  cleared (approved, AFK-proceeded, or safely skipped and logged) before the first edit.

No new files; no new gate scripts (reuses `plan.md ## Interview`, the run-vault `README.md`,
and the hard-stop / non-blocking idioms).

### Verification

- `node templates/skill-frontmatter-gate.mjs .` -> exit 0 (SKILL.md body 7939 chars, within
  limits; the pre-existing name/dir WARN is unrelated).
- `grep -rn "blast.radius"` across `reference/ SKILL.md agents/`: the confirm flow links
  consistently across the five edited files; `interview.md` references resolve with no dangling
  links.
- Document dry-run, two scenarios: (A) LEGACY fix touching a non-target function + changing
  observed behavior -> trigger fires, escalates to hard gate, recorded; (B) self-contained
  local edit -> skips with a one-line README reason. Both trace consistently end to end.
