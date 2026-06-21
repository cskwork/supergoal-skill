# Changelog 2026-06-21

## Integrate superdesign 2026-06-20 design updates (lean, into the Designer subagent only)

Sibling skill `superdesign-skill` shipped two design updates on 2026-06-20: a conversion/engagement
craft layer (`reference/engagement.md`) and a data-dense business-app capability
(`reference/dashboard.md`). supergoal carries its own UI/UX overlay, so the question was what (if
anything) to fold back. Decision after a side-by-side read: pull the two genuinely-new knowledge files,
nothing else. (Option B of the merge review.)

### What

- Added `reference/engagement.md` - a terse, supergoal-voiced port of superdesign's engagement craft:
  conversion hierarchy, single-stat/named-claim hero, first-person outcome CTA + friction-reducer line,
  optimistic UI, real-data social proof at the friction peak, micro-interaction feedback, motion that
  guides attention, progressive disclosure, WCAG 2.2 target sizes. Written as deltas on top of
  `taste-skill-v2.md` (cross-references it instead of repeating its bans) and loaded inside the Designer
  subagent only when the Design Read names a primary action (sign up/buy/book/subscribe/install);
  editorial/portfolio/docs leave it off.
- Enriched `reference/functional-ui.md` with a "Data-app techniques" section compressed from superdesign's
  `dashboard.md`: app shell (icon-rail sidebar + topbar + `cmdk` command palette), data tables at scale
  (TanStack/AG Grid/MUI X, virtualize past ~50 rows, tabular-nums, left-text/right-number alignment,
  URL-as-state), chart selection by data scale (Recharts/Tremor -> Nivo/visx -> ECharts/uPlot) with a
  data-table + ARIA fallback, KPI card anatomy (label + tabular value + delta + sparkline, 5-7 max),
  colorblind-safe status (Okabe-Ito, redundant non-color cue), per-widget states, dark-first elevation by
  lightness, enterprise systems (Carbon/Ant/Fluent/Cloudscape, never mix), and a dashboard anti-pattern
  ban list. functional-ui was principles-level before; this makes it actionable.
- Reconciled the Designer tier model. `agents/designer.md` previously framed Expressive and Functional as
  an either/or and said "do not impose ... anti-slop on a Functional surface" - both wrong and
  contradicting `reference/ui-ux.md`, which already states Expressive is the baseline for ALL UI and
  Functional only adds density on top. designer.md now matches: taste-skill-v2 is the polish baseline for
  all UI; functional-ui is a density + states overlay that suppresses marketing-only rules (hero, heavy
  motion, landing heuristics) but keeps every universal (*) ban and the polish baseline.
- Strengthened the Designer's FUNCTIONAL-TIER BANS with three concrete data-app fails: non-tabular /
  center-aligned number columns, color-only status, and tables past ~50 rows with no
  virtualization/pagination (plus "no marketing hero on a data app").
- Wired engagement at every discovery point with the existing on-demand machinery: `ui-ux.md` Frame flags
  the overlay when a primary action is named, Build dispatches the Designer with `engagement.md`, and the
  progressive-disclosure note loads it inside the subagent. `SKILL.md`'s user-facing-UI reference row
  gained `engagement.md` (the only spine touch - one filename added to an existing row).

### Why

The render-gate / playwright-cli half of superdesign's update was explicitly ported FROM supergoal's
`qa-gate.sh` + `reference/playwright-cli.md`, so there was nothing to back-port there - supergoal is the
origin. The two new knowledge files were real gaps: supergoal had CTA basics but no conversion-craft
layer, and `functional-ui.md` named dashboards/admin as a tier but stopped at principles (no library
choices, virtualization thresholds, KPI anatomy, or colorblind-safe status). Both load only inside the
Designer subagent, so capturing them does not grow the conductor's context - consistent with the
2026-06-19 spine-diet + subagent-default direction.

### Rejected alternatives

- **Do nothing / keep the boundary (Option A).** Rejected: supergoal builds UI standalone and would keep
  missing conversion craft and dashboard depth; the two files are pure knowledge that loads on demand, so
  the cost of carrying them is near zero.
- **Full sync / shared source / symlink (Option C).** Rejected: couples two skills with different ethos
  (supergoal compresses its design references for context cost; superdesign keeps them verbose) and would
  fight supergoal's compressed-derivative approach. Periodic manual re-pull is the right cadence.
- **Add engagement/dashboard to the always-on spine.** Rejected: they are contextual overlays, not
  universal rules. Loading them only inside the Designer subagent (mirroring `taste-aesthetics.md`) keeps
  the conductor lean.
- **Make dashboard a new tier or import superdesign's exact dials (6-8/2-3/3-5).** Rejected: functional-ui
  already sets density-first dials; a second number set would contradict the file. The new section keeps
  the file's existing dial convention.

### Verified

- `for f in tests/*.test.sh; do bash "$f"; done` -> 16 suites, 0 failing. `ui-ux-contract` stays green:
  every pinned substring (Expressive, Functional, taste-skill-v2.md, functional-ui.md, taste-aesthetics.md,
  `UI-tier:`, `contrast-gate.mjs`, the Korean localized-copy rule) was preserved; all edits are additive.
- No contract test references `engagement` or `dashboard`, and none pins SKILL.md word count or the exact
  reference-row file list, so the additions and the one-filename spine touch are safe.
- Provenance recorded in both new bodies (`Adapted from superdesign-skill ... 2026-06-20`).
