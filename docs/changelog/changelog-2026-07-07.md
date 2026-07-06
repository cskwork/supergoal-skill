# 2026-07-07

## Conditional explore-subagent dispatch at plan grounding (all default-loop modes)

**Change**: `reference/plan-grounding.md` "Required input" gains one rule: when no Explore map exists
and grounding needs more than a handful of files or unfamiliar code, dispatch a fresh-context explore
subagent (`agents/explore.md`) to write the map into `PLAN.md` grounding notes before freeze; small or
well-known scope grounds inline. `agents/explore.md` header/description generalized from LEGACY-only
to any-mode plan grounding (behavior unchanged).

**Why**: subagent exploration was guaranteed only on the LEGACY route (`SKILL.md` map-first). In
GREENFIELD/DEBUG the conductor could burn its own context on Frame-phase grounding reads. This closes
that gap without forcing a subagent round-trip on small runs.

**Rejected alternatives**:
- Per-prompt user instruction ("use a subagent to explore") — volatile, violates change-ground-truth.
- Unconditional explore dispatch for all modes — pure overhead on small GREENFIELD/single-file DEBUG;
  baseline-first evals showed added ceremony hurts, never helps (see memory: supergoal baseline-first).
- Adding Explore as a numbered role in `role-loop.md` — heavier contract change than needed; the
  conditional line in plan-grounding (loaded exactly at Frame end) is the minimal placement.
