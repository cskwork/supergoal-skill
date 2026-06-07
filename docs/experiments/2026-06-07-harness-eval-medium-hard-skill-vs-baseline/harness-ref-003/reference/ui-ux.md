# UI/UX overlay - design authority

Load whenever the objective ships user-facing UI. Classify the surface into one tier, then load that
tier's authority. Pure non-visual work (lib, API, CLI without TUI) loads neither.

| Surface | Tier | Authority |
|---|---|---|
| landing, portfolio, marketing site, redesign, "make it look good/premium/on-brand", frontend look-and-feel | **Expressive** | `reference/taste-skill-v2.md` |
| dashboard, data table, admin panel, internal tool, settings, wizard, CRUD form | **Functional** | `reference/functional-ui.md` |

Functional is the default for dense/admin UI: it still needs design system, contrast, consistent
type/spacing/density, and complete UI states - just not marketing aesthetic. A mixed product applies
each tier to its own surface. The rest of this file describes the Expressive tier; Functional defines
its own (lighter) Plan/Build/QA overlay in its file.

The chosen authority overlays the normal mode; phases, gates, vault, and topology stay unchanged. UI
scaffolding may fan out, but one surface's look-and-feel is deep-and-narrow: use one Designer driver
per surface.

| Phase | Overlay |
|---|---|
| Plan | Add one-line **Design Read** and dials `DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY` to `plan.md`. Pick official design system vs aesthetic. For known brands, use existing brand color/type as accent source and record it. |
| Build | Dispatch **Designer** with `plan.md` + `reference/taste-skill-v2.md`. Enforce anti-default rules, real/generated images, reduced-motion fallback, hard visual bans, locked accent, no off-brand gradient/glow slop, and no self-approval. |
| QA | Run taste Pre-Flight beside normal QA. Required: a11y, reduced motion, Color Consistency Lock, LILA rule, dark/light or justified single-mode lock. Record `UI-tier: Expressive` in `verification.md` `## QA` and enumerate every text/bg pair to `<vault>/qa/contrast-pairs.json`; `qa-gate.sh` runs `node templates/contrast-gate.mjs` on it (completeness critic audits the pair list). Any fail rewinds to Build and blocks Deliver. |

Progressive disclosure:

- Conductor does not load `taste-skill-v2.md` into its own context.
- Plan Architect loads only the sections needed for Design Read/dials/system choice.
- Build Designer loads the full file in its own context.
- Verify + committee still gate Deliver.

## Source note

`reference/taste-skill-v2.md` is a compressed derivative of the upstream taste-skill v2 source, with
source and commit preserved in its banner. Refresh by re-pulling upstream, then re-compress if context
cost still matters.
