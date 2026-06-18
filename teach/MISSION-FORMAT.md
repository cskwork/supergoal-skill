# MISSION.md Format

`MISSION.md` lives at the topic workspace root (`teach/<topic>/MISSION.md`). It captures the _reason_
the user is learning this topic. Every teaching decision - what to teach next, which resources to
surface, which exercises to design - should trace back to this document.

> Adapted from mattpocock/skills `teach` (productivity/teach). Prose may be written in the user's
> language; keep the section headings.

## Template

```md
# Mission: {Topic}

## Why
{1-3 sentences. The concrete real-world goal the user is chasing. What changes in their life or work
when they have this skill? Avoid abstract framings like "to understand X" - push for the underlying
outcome.}

## Success looks like
- {A specific, observable thing the user will be able to do}
- {Another specific thing}

## Constraints
- {Time, budget, prior commitments, learning preferences - anything that bounds the approach}

## Out of scope
- {Adjacent topics the user explicitly does not want to chase right now - protects the zone of
  proximal development}
```

## Rules

- **One mission per workspace.** Two unrelated things to learn = two `teach/<topic>/` workspaces.
- **Concrete over abstract.** "Run a half marathon by October" beats "get fitter." "Ship a Rust CLI to
  my team" beats "learn Rust."
- **Push back on vagueness.** If the user cannot articulate why, interview them (per `reference/teach.md`
  step 1) before writing anything. A bad mission is worse than no mission.
- **Revise when reality shifts.** Missions change. When the user's goal moves, update this file and add
  a learning record - do not leave a stale mission steering future sessions. Confirm before changing.
- **Keep it short.** If `MISSION.md` runs past a screen, it has stopped being a compass and started
  being a plan.
